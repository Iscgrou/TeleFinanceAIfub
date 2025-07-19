import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';

export class SpeechToTextService {
  private client: SpeechClient;

  constructor() {
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      this.client = new SpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    }
  }

  async transcribeAudio(audioBuffer: Buffer, languageCode = 'fa-IR'): Promise<string> {
    if (!this.client) {
      throw new Error('Google Cloud Speech not configured');
    }

    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: 'OGG_OPUS' as const,
        sampleRateHertz: 16000,
        languageCode,
        alternativeLanguageCodes: ['en-US'],
      },
    };

    try {
      const [response] = await this.client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join('\n');

      return transcription || '';
    } catch (error) {
      console.error('Speech transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async transcribeFile(filePath: string, languageCode = 'fa-IR'): Promise<string> {
    const audioBytes = fs.readFileSync(filePath);
    return this.transcribeAudio(audioBytes, languageCode);
  }
}

export const speechService = new SpeechToTextService();