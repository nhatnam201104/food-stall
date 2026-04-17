# Azure Speech Service Integration Plan

**Document Version:** 1.0  
**Created:** 2026-04-18  
**Status:** Draft for Review  
**Project:** Audio Tour Guide System

---

## 1. Executive Summary

### 1.1 Objective
Replace Google TTS + Google Translate with **Azure Speech Service** to provide multi-language audio translation with better voice quality, reliability, and commercial support.

### 1.2 Current State
| Component | Current Implementation |
|-----------|------------------------|
| TTS Engine | Google TTS (`google-tts-api`) |
| Translation | Google Translate (`@vitalets/google-translate-api` + `@iamtraction/google-translate`) |
| Languages | 12 (vi, en, zh, fr, ja, ko, de, es, pt, ru, th, id) |
| Cache | In-memory, 500 entries, 30 min TTL |
| API Endpoint | `POST /tts/preview` |

### 1.3 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile)                          │
│  AudioManager → TTSService → POST /tts/preview                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    BACKEND (Express)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TTS Controller (tts.controller.ts)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Azure TTS Service (NEW)                      │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐   │  │
│  │  │ Translation      │───▶│ Azure Speech SDK            │   │  │
│  │  │ (Azure Translator│    │ - speakTextAsync()          │   │  │
│  │  │  OR Google)      │    │ - Returns ArrayBuffer       │   │  │
│  │  └─────────────────┘    └─────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    AZURE CLOUD                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │ Azure Translator API    │  │ Azure Speech TTS API        │   │
│  │ (Text Translation)      │  │ (Neural Voices)             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Azure Services Selection

### 2.1 Option Analysis

| Option | Translation | TTS | Pros | Cons |
|--------|-------------|-----|------|------|
| **A** | Azure Translator | Azure Speech SDK | Native integration, consistent quality | Higher cost |
| **B** | Google Translate (keep) | Azure Speech SDK | Cost-effective, proven translation | Mixed providers |
| **C** | Azure Translator | Azure Speech SDK | Full Azure stack | 2 Azure services |

### 2.2 Recommended: Option B (Hybrid)

**Rationale:**
- Keep Google Translate (proven, free tier available, existing cache)
- Use Azure Speech SDK for TTS only (superior voice quality, neural voices)
- Fallback chain: Azure TTS → Google TTS (current)

---

## 3. Supported Languages & Voices

### 3.1 Azure Neural Voices Mapping

| Language | Code | Azure Voice (Neural) | Style |
|----------|------|---------------------|-------|
| Vietnamese | vi | vi-VN-NamMinhNeural | Warm, professional |
| English | en | en-US-JennyNeural | Friendly, versatile |
| Chinese | zh | zh-CN-XiaoxiaoNeural | Expressive |
| French | fr | fr-FR-DeniseNeural | Elegant |
| Japanese | ja | ja-JP-NanamiNeural | Pleasant |
| Korean | ko | ko-KR-SunHiNeural | Cheerful |
| German | de | de-DE-KatjaNeural | Professional |
| Spanish | es | es-ES-ElviraNeural | Passionate |
| Portuguese | pt | pt-BR-FranciscaNeural | Lively |
| Russian | ru | ru-RU-DariyaNeural | Calm |
| Thai | th | th-TH-PremwadeeNeural | Friendly |
| Indonesian | id | id-ID-GadisNeural | Warm |

### 3.2 SSML Template

```xml
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{locale}'>
  <voice name='{voiceName}'>
    {text}
  </voice>
</speak>
```

---

## 4. Implementation Plan

### Phase 1: Environment & Dependencies

#### Step 1.1: Add Azure Environment Variables

```env
# backend/.env
AZURE_SPEECH_KEY=your-speech-resource-key
AZURE_SPEECH_REGION=eastus  # or your region
AZURE_TRANSLATOR_KEY=your-translator-key  # optional
AZURE_TRANSLATOR_REGION=eastus  # optional
```

#### Step 1.2: Install Dependencies

```bash
cd backend
npm install microsoft-cognitiveservices-speech-sdk
npm install -D @types/microsoft-cognitiveservices-speech-sdk  # if TypeScript
```

### Phase 2: Azure TTS Service

#### Step 2.1: Create Azure TTS Module

**File:** `backend/src/services/azure-tts.service.ts`

```typescript
import * as fs from "fs";
import * as path from "path";
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  ResultReason,
} from "microsoft-cognitiveservices-speech-sdk";
import { AppError } from "../errors/app-error";

// ─── Voice Mapping ────────────────────────────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
  vi: "vi-VN-NamMinhNeural",
  en: "en-US-JennyNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  fr: "fr-FR-DeniseNeural",
  ja: "ja-JP-NanamiNeural",
  ko: "ko-KR-SunHiNeural",
  de: "de-DE-KatjaNeural",
  es: "es-ES-ElviraNeural",
  pt: "pt-BR-FranciscaNeural",
  ru: "ru-RU-DariyaNeural",
  th: "th-TH-PremwadeeNeural",
  id: "id-ID-GadisNeural",
};

// ─── Service Class ────────────────────────────────────────────────────────────
export class AzureTtsService {
  private speechKey: string;
  private speechRegion: string;

  constructor() {
    this.speechKey = process.env.AZURE_SPEECH_KEY || "";
    this.speechRegion = process.env.AZURE_SPEECH_REGION || "eastus";
  }

  isConfigured(): boolean {
    return Boolean(this.speechKey && this.speechRegion);
  }

  /**
   * Generate audio from text using Azure Neural Voices
   * @param text Text to synthesize
   * @param languageCode ISO 639-1 language code
   * @returns Audio buffer (MP3 format)
   */
  async synthesizeSpeech(text: string, languageCode: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw new Error("Azure Speech not configured");
    }

    const voiceName = VOICE_MAP[languageCode] || VOICE_MAP["en"];
    const ssml = this.buildSsml(text, voiceName, languageCode);

    return new Promise((resolve, reject) => {
      const speechConfig = SpeechConfig.fromSubscription(
        this.speechKey,
        this.speechRegion
      );
      speechConfig.speechSynthesisOutputFormat =
        "audio-24khz-160kbitrate-mono-mp3";

      const synthesizer = new SpeechSynthesizer(speechConfig);

      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          synthesizer.close();

          if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            resolve(Buffer.from(result.audioData));
          } else {
            reject(
              new AppError(
                500,
                `Azure TTS failed: ${result.errorDetails}`
              )
            );
          }
        },
        (error) => {
          synthesizer.close();
          reject(new AppError(500, `Azure TTS error: ${error}`));
        }
      );
    });
  }

  private buildSsml(text: string, voiceName: string, lang: string): string {
    return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>
  <voice name='${voiceName}'>
    ${this.escapeXml(text)}
  </voice>
</speak>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "'");
  }
}

export const azureTtsService = new AzureTtsService();
```

### Phase 3: Integrate into TTS Service

#### Step 3.1: Update TTS Service with Azure Provider

**File:** `backend/src/services/tts.service.ts`

**Changes:**
1. Add AzureTtsService as primary provider
2. Keep Google TTS as fallback
3. Add provider selection based on availability
4. Update cache key to include provider

```typescript
import { azureTtsService } from "./azure-tts.service";

// Add to existing service...

export const ttsService = {
  // ... existing translateText method ...

  async generatePreviewAudio(
    text: string,
    previewLanguage: string,
    sourceLanguage = "vi"
  ): Promise<Buffer> {
    // ... existing translation logic ...

    // After translation, try Azure TTS first
    if (azureTtsService.isConfigured()) {
      try {
        const azureBuffer = await azureTtsService.synthesizeSpeech(
          spokenText,
          targetLanguage
        );
        return azureBuffer;
      } catch (azureError) {
        console.warn("[TTS] Azure TTS failed, falling back to Google TTS");
      }
    }

    // Fallback to Google TTS (existing logic)
    return this.generateGoogleTtsBuffer(spokenText, targetLanguage);
  },
};
```

### Phase 4: Error Handling & Retry Logic

#### Step 4.1: Error Handling Strategy

| Error Type | Action | Fallback |
|------------|--------|----------|
| Azure TTS timeout | Retry 1 time | Google TTS |
| Azure TTS quota exceeded | Log & alert | Google TTS |
| Azure TTS invalid voice | Use default voice | Google TTS |
| Network error | Retry 2 times | Google TTS |

### Phase 5: Monitoring & Logging

#### Step 5.1: Add Azure Metrics

```typescript
// Log Azure TTS usage for cost tracking
console.log("[AZURE TTS]", {
  timestamp: new Date().toISOString(),
  language: languageCode,
  textLength: text.length,
  duration: performance.now() - startTime,
  success: true,
});
```

---

## 5. File Structure Changes

```
backend/
├── src/
│   ├── services/
│   │   ├── tts.service.ts          # [MODIFY] Add Azure fallback
│   │   └── azure-tts.service.ts    # [NEW] Azure TTS wrapper
│   └── config/
│       └── index.ts                # [MODIFY] Add Azure env vars
├── prisma/
│   └── schema/
│       └── poi.prisma              # [NO CHANGE] Already supports audio
└── .env                            # [MODIFY] Add Azure keys
```

---

## 6. Environment Variables

### 6.1 Required Variables

```env
# Azure Speech Service (TTS)
AZURE_SPEECH_KEY=your-speech-resource-key
AZURE_SPEECH_REGION=eastus

# Optional: Azure Translator (if using instead of Google)
AZURE_TRANSLATOR_KEY=your-translator-key
AZURE_TRANSLATOR_REGION=eastus
```

### 6.2 Cost Estimation

| Service | Free Tier | Pay-as-you-go |
|---------|-----------|---------------|
| Azure Speech TTS | 0 (500K chars/month via S0) | ~$1/100K chars |
| Azure Translator | 2M chars/month free | ~$10/1M chars |
| Google TTS | Rate limited | ~$4/1M chars |

**Recommendation:** Start with Google Translate + Azure TTS hybrid to optimize costs.

---

## 7. Testing Plan

### 7.1 Unit Tests

```typescript
// backend/src/services/__tests__/azure-tts.service.test.ts

describe("AzureTtsService", () => {
  it("should synthesize Vietnamese audio", async () => {
    const buffer = await azureTtsService.synthesizeSpeech(
      "Xin chào, chào mừng bạn đến với hệ thống.",
      "vi"
    );
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should throw when not configured", () => {
    const service = new AzureTtsService();
    expect(() => service.synthesizeSpeech("test", "vi")).toThrow();
  });
});
```

### 7.2 Integration Tests

1. Test all 12 language voices
2. Test fallback chain (Azure → Google)
3. Test cache invalidation
4. Test long text chunking

---

## 8. Rollout Strategy

### Phase 1: Shadow Mode (Week 1)
- Deploy Azure TTS alongside Google TTS
- Log both outputs, compare quality
- No traffic switch

### Phase 2: Canary Deployment (Week 2)
- 10% traffic to Azure TTS
- Monitor error rates, latency
- Compare voice quality feedback

### Phase 3: Full Rollout (Week 3)
- 100% Azure TTS with Google TTS as fallback
- Monitor costs vs. quality

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Azure quota exceeded | Service outage | Fallback to Google TTS |
| Voice quality regression | User experience | A/B testing, user feedback |
| Cost overrun | Budget | Set usage alerts, cache aggressively |
| Network latency | Slow response | Edge deployment, caching |

---

## 10. Questions for Review

1. **Budget:** What is the monthly budget for Azure TTS?
2. **Quality:** Should we do user testing for voice preferences?
3. **Fallback:** Is Google TTS acceptable as permanent fallback?
4. **Regions:** Which Azure region is preferred for Vietnam users?

---

## 11. Next Steps

- [ ] Review and approve this plan
- [ ] Create Azure Speech Resource in Azure Portal
- [ ] Add environment variables to deployment
- [ ] Implement Azure TTS service
- [ ] Write unit tests
- [ ] Set up monitoring dashboard
- [ ] Begin shadow mode testing
