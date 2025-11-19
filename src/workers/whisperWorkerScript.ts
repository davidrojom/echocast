export const whisperWorkerScript = `
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

env.allowLocalModels = false;

class WhisperWorker {
  static instance = null;
  transcriber = null;

  static getInstance() {
    if (this.instance === null) {
      this.instance = new WhisperWorker();
    }
    return this.instance;
  }

  async load(modelName = 'Xenova/whisper-small') {
    if (this.transcriber) return;

    self.postMessage({ status: 'loading', message: 'Loading model...' });

    try {
      this.transcriber = await pipeline('automatic-speech-recognition', modelName, {
        progress_callback: (data) => {
          self.postMessage({
            status: 'loading',
            message: data.status,
            data: data
          });
        }
      });

      self.postMessage({ status: 'ready', message: 'Model loaded successfully' });
    } catch (error) {
      self.postMessage({ status: 'error', message: error.message || String(error) });
    }
  }

  async generate(audio, language) {
    if (!this.transcriber) {
      self.postMessage({ status: 'error', message: 'Model not loaded' });
      return;
    }

    try {
      const output = await this.transcriber(audio, {
        language: language,
        task: 'transcribe',
        // chunk_length_s: 30, // Removed to allow growing buffer
        // stride_length_s: 5, // Removed to prevent splitting
        repetition_penalty: 1.2,
        no_repeat_ngram_size: 3,
      });

      self.postMessage({
        status: 'complete',
        data: output
      });
    } catch (error) {
      self.postMessage({ status: 'error', message: error.message || String(error) });
    }
  }
}

const worker = WhisperWorker.getInstance();

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'load':
      await worker.load(data?.model);
      break;
    case 'generate':
      await worker.generate(data.audio, data.language);
      break;
  }
});
`;
