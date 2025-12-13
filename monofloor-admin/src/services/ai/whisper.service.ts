import { config } from '../../config';
import * as fs from 'fs';
import * as path from 'path';

interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
}

export class WhisperService {
  private apiKey = config.openai.apiKey;
  private endpoint = 'https://api.openai.com/v1/audio/transcriptions';

  async transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    const fileName = path.basename(audioFilePath);

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();

    return {
      text: data.text,
      duration: data.duration || 0,
      language: data.language || 'pt',
    };
  }

  async transcribeFromBuffer(
    buffer: Buffer,
    filename: string
  ): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', new Blob([buffer]), filename);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();

    return {
      text: data.text,
      duration: data.duration || 0,
      language: data.language || 'pt',
    };
  }
}

export const whisperService = new WhisperService();
