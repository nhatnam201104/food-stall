import { AudioOutlined, PauseOutlined } from '@ant-design/icons';
import { Button, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../../configs/axios.config';
import { POI_LANGUAGE_OPTIONS } from '../../constants';
import type { PoiLanguageCode } from '../../types';

type PreviewLanguageOption = PoiLanguageCode | 'auto';

const PREVIEW_LANGUAGE_OPTIONS: Array<{ value: PreviewLanguageOption; label: string }> = [
  { value: 'auto', label: 'Auto detect (mixed language)' },
  ...POI_LANGUAGE_OPTIONS,
];

interface TtsPreviewProps {
  text?: string | null;
  sourceLanguage?: PoiLanguageCode;
  defaultPreviewLanguage?: PreviewLanguageOption;
  size?: 'small' | 'middle' | 'large';
}
const TtsPreview = ({ text, sourceLanguage = 'vi', defaultPreviewLanguage, size = 'small' }: TtsPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<PreviewLanguageOption>(defaultPreviewLanguage || 'auto');
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const normalizedText = useMemo(() => (text || '').trim(), [text]);

  useEffect(() => {
    setPreviewLanguage(defaultPreviewLanguage || 'auto');
  }, [defaultPreviewLanguage]);

  useEffect(() => {
    return () => {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const stopServerAudio = () => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current.currentTime = 0;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const playServerPreview = async () => {
    setIsServerLoading(true);
    try {
      const response = await axiosInstance.post('/tts/preview', {
        text: normalizedText,
        previewLanguage,
        sourceLanguage,
      }, {
        responseType: 'blob',
      });

      const blobUrl = URL.createObjectURL(response.data);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      objectUrlRef.current = blobUrl;

      const audio = htmlAudioRef.current || new Audio();
      htmlAudioRef.current = audio;
      audio.src = blobUrl;
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      toast.error('Unable to generate TTS preview from server');
    } finally {
      setIsServerLoading(false);
    }
  };

  const onClick = async () => {
    if (!normalizedText) {
      toast.error('No TTS content available to preview');
      return;
    }

    if (isPlaying) {
      stopServerAudio();
      setIsPlaying(false);
      return;
    }

    await playServerPreview();
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        Preview language (explicit language = force translate before speech, Auto = keep mixed language):
      </Typography.Text>
      <Select<PreviewLanguageOption>
        value={previewLanguage}
        onChange={(value) => setPreviewLanguage(value)}
        options={PREVIEW_LANGUAGE_OPTIONS}
        style={{ width: 220 }}
      />
      <Button
        size={size}
        icon={isPlaying ? <PauseOutlined /> : <AudioOutlined />}
        onClick={onClick}
        disabled={!normalizedText || isServerLoading}
        loading={isServerLoading}
      >
        {isPlaying ? 'Stop preview' : `Preview TTS (${previewLanguage.toUpperCase()})`}
      </Button>
    </Space>
  );
};

export default TtsPreview;
