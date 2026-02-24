const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

/**
 * Deepgram Transcription Service
 * Supports: 37+ languages, real-time transcription, multilingual detection
 * Free tier: 300 minutes/month
 * Pricing: Cheaper than Google Cloud ($0.0043 per minute)
 * 
 * Setup:
 * 1. Sign up at https://console.deepgram.com/
 * 2. Get API key from dashboard
 * 3. Add to .env: DEEPGRAM_API_KEY=your_key_here
 */

class DeepgramTranscriptionService {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.baseURL = 'https://api.deepgram.com/v1';

    if (!this.apiKey) {
      console.warn('⚠️ DEEPGRAM_API_KEY not set in environment variables');
    }
  }

  /**
   * Transcribe audio file using Deepgram
   * @param {string} audioFilePath - Path to audio file
   * @param {string} language - Optional language code
   * @returns {Promise<{text: string, language: string, confidence: number}>}
   */
  async transcribeAudio(audioFilePath, language = null) {
    try {
      if (!this.apiKey) {
        throw new Error('DEEPGRAM_API_KEY is not configured');
      }

      console.log(`\n🎤 Starting Deepgram transcription`);
      console.log(`   File: ${audioFilePath}`);

      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      const audioBuffer = fs.readFileSync(audioFilePath);
      console.log(`   📊 File size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Prepare request
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: path.basename(audioFilePath),
        contentType: this.getContentType(audioFilePath),
      });

      // Build query params for better accuracy
      const params = new URLSearchParams({
        model: 'nova-2', // Latest Deepgram model, best accuracy
        language: language || 'en',
        punctuate: true,
        numerals: true,
        smart_format: true,
        diarize: false,
      });

      console.log(`   🌍 Language: ${language || 'auto-detect'}`);
      console.log(`   ⏳ Sending to Deepgram API...`);

      const response = await axios.post(
        `${this.baseURL}/listen?${params.toString()}`,
        formData,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }
      );

      const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      const detectedLanguage = response.data?.results?.channels?.[0]?.detected_language;
      const confidence = response.data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      if (!transcript) {
        console.warn('   ⚠️ No speech detected in audio');
        return {
          text: '[No speech detected]',
          language: 'unknown',
          confidence: 0,
        };
      }

      console.log(`   ✅ Transcription successful!`);
      console.log(`   📝 Text: "${transcript}"`);
      console.log(`   🌍 Detected language: ${detectedLanguage}`);
      console.log(`   📊 Confidence: ${(confidence * 100).toFixed(1)}%`);

      return {
        text: transcript,
        language: detectedLanguage || 'unknown',
        confidence: confidence,
      };
    } catch (error) {
      console.error('❌ Deepgram error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Transcribe with translation to English
   * @param {string} audioFilePath - Path to audio file
   * @param {string} sourceLanguage - Source language
   * @returns {Promise<Object>}
   */
  async transcribeAndTranslate(audioFilePath, sourceLanguage = null) {
    try {
      console.log(`\n🎤 Transcribing and translating to English...`);

      // Deepgram will auto-translate if you enable translation feature
      const result = await this.transcribeAudio(audioFilePath, sourceLanguage);

      // For translation to English, we can use Google Translate as fallback
      let englishText = result.text;

      // If detected language is not English and text is available
      if (result.language && result.language !== 'en' && result.text !== '[No speech detected]') {
        console.log(`   🌐 Original detected language: ${result.language}`);
        // Use Google Translate API for translation
        try {
          const Translate = require('@google-cloud/translate').v2.Translate;
          const translate = new Translate();
          const [translation] = await translate.translate(result.text, 'en');
          englishText = translation;
          console.log(`   ✅ Translated to English: "${englishText}"`);
        } catch (err) {
          console.warn(`   ⚠️ Translation skipped: ${err.message}`);
          // Use original if translation fails
        }
      }

      return {
        originalText: result.text,
        englishText: englishText,
        detectedLanguage: result.language,
        confidence: result.confidence,
      };
    } catch (error) {
      console.error('❌ Transcribe and translate error:', error.message);
      throw error;
    }
  }

  /**
   * Get MIME type for audio file
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
    };
    return mimeTypes[ext] || 'audio/wav';
  }

  /**
   * Batch transcribe multiple files
   */
  async transcribeBatch(audioFilePaths) {
    console.log(`\n📦 Batch transcription: ${audioFilePaths.length} files`);
    const results = [];

    for (let i = 0; i < audioFilePaths.length; i++) {
      try {
        const filePath = audioFilePaths[i];
        console.log(`   [${i + 1}/${audioFilePaths.length}] Processing...`);
        const result = await this.transcribeAudio(filePath);
        results.push({
          file: filePath,
          success: true,
          transcript: result.text,
          language: result.language,
        });
      } catch (error) {
        results.push({
          file: audioFilePaths[i],
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new DeepgramTranscriptionService();
