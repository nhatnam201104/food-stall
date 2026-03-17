declare module 'speak-tts' {
  interface SpeakListeners {
    onend?: () => void;
    onstop?: () => void;
  }

  interface SpeakPayload {
    text: string;
    lang?: string;
    listeners?: SpeakListeners;
  }

  interface InitOptions {
    volume?: number;
    lang?: string;
  }

  export default class Speech {
    static hasBrowserSupport(): boolean;
    init(options?: InitOptions): Promise<void>;
    speak(payload: SpeakPayload): Promise<void>;
    cancel(): void;
  }
}
