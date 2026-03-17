import { Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { PoiLanguageCode } from '../../types';
import TtsPreview from './tts-preview';

interface PoiAudioPreviewProps {
  audioMode: 'tts' | 'file';
  ttsContent?: string | null;
  languageCode?: PoiLanguageCode;
  audioUrl?: string | null;
  localAudioFile?: File | null;
}

const PoiAudioPreview = ({
  audioMode,
  ttsContent,
  languageCode = 'vi',
  audioUrl,
  localAudioFile,
}: PoiAudioPreviewProps) => {
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!localAudioFile) {
      setLocalObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(localAudioFile);
    setLocalObjectUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [localAudioFile]);

  const resolvedAudioUrl = useMemo(
    () => localObjectUrl || audioUrl || null,
    [localObjectUrl, audioUrl],
  );

  if (audioMode === 'tts') {
    return (
      <TtsPreview
        text={ttsContent}
        sourceLanguage={languageCode}
        defaultPreviewLanguage={languageCode}
      />
    );
  }

  if (!resolvedAudioUrl) {
    return <Typography.Text type="secondary">No audio file available to preview</Typography.Text>;
  }

  return (
    <audio
      controls
      preload="none"
      src={resolvedAudioUrl}
      style={{ width: '100%' }}
    />
  );
};

export default PoiAudioPreview;
