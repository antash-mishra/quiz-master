export interface TranscriptionService {
  transcribeAudio(audioBlob: Blob): Promise<string>;
}

export class GroqTranscriptionService implements TranscriptionService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Convert blob to File with proper audio format
      const audioFile = new File([audioBlob], 'recording.webm', { 
        type: audioBlob.type || 'audio/webm' 
      });
      
      formData.append('file', audioFile);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en'); // English language

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error: any) {
      console.error('Groq transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
        } 
      });

      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'audio/webm;codecs=opus', // Good compression and quality
        audioBitsPerSecond: 64000, // Reasonable quality for speech
      };

      // Fallback mime types for browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        ...options,
        mimeType: mimeType || undefined,
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error: any) {
      console.error('Error starting recording:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        
        // Clean up
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event: any) => {
        this.cleanup();
        reject(new Error(`Recording error: ${event.error}`));
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Clean up resources
  destroy(): void {
    if (this.isRecording()) {
      this.mediaRecorder?.stop();
    }
    this.cleanup();
  }
} 