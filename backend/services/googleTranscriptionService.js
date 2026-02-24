const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

class GoogleTranscriptionService {
  constructor() {
    // Initialize Google Cloud Speech client
    this.client = new speech.SpeechClient();
  }

  /**
   * Transcribe audio file using Google Cloud Speech-to-Text
   * Supports automatic language detection
   * @param {string} audioFilePath - Path to audio file (.wav, .mp3, .webm, .flac, .ogg)
   * @param {string} detectedLanguage - Optional language code ('hi' for Hindi, 'kn' for Kannada, 'en' for English)
   * @returns {Promise<{text: string, language: string, confidence: number}>}
   */
  async transcribeAudio(audioFilePath, detectedLanguage = null) {
    try {
      console.log(`\n🎤 Starting Google Cloud Speech transcription`);
      console.log(`   File: ${audioFilePath}`);
      
      // Verify file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Read audio file
      const audioBytes = fs.readFileSync(audioFilePath);
      console.log(`   📊 File size: ${(audioBytes.length / 1024 / 1024).toFixed(2)} MB`);

      // Prepare audio content
      const audio = {
        content: audioBytes.toString('base64'),
      };

      // Determine audio encoding based on file extension
      const ext = path.extname(audioFilePath).toLowerCase();
      let encoding;
      let sampleRateHertz = 48000;

      if (ext === '.wav') {
        encoding = 'LINEAR16';
        sampleRateHertz = 16000;
      } else if (ext === '.webm') {
        encoding = 'WEBM_OPUS';
      } else if (ext === '.mp3') {
        encoding = 'MP3';
      } else if (ext === '.flac') {
        encoding = 'FLAC';
      } else if (ext === '.ogg') {
        encoding = 'OGG_OPUS';
      } else {
        // Default to LINEAR16 if unknown
        encoding = 'LINEAR16';
      }

      console.log(`   🎵 Audio format: ${ext} (encoding: ${encoding})`);

      // Build config for transcription
      const config = {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: detectedLanguage || 'en-US',
        // Alternate languages to detect from
        alternativeLanguageCodes: [
          'hi-IN', // Hindi
          'kn-IN', // Kannada
          'ta-IN', // Tamil
          'te-IN', // Telugu
          'ml-IN', // Malayalam
        ],
        enableAutomaticPunctuation: true,
        useEnhanced: true,
        model: 'default',
        profanityFilter: false,
        // Speech adaptation for better context
        speechContexts: [
          {
            phrases: [
              'emergency',
              'help',
              'hospital',
              'ambulance',
              'pain',
              'accident',
              'injury',
              'call police',
              'fire',
              'poison',
              'drowning',
            ],
            boost: 100,
          },
        ],
      };

      console.log(`   🌍 Language codes: ${config.languageCode}, Alternates: ${config.alternativeLanguageCodes.join(', ')}`);
      console.log(`   ⏳ Sending to Google Cloud Speech API...`);

      // Send request to Google Cloud Speech API
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.client.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      if (!transcription || transcription.trim() === '') {
        console.warn('   ⚠️ No speech detected in audio');
        return {
          text: '[No speech detected in audio]',
          language: 'unknown',
          confidence: 0,
        };
      }

      console.log(`   ✅ Transcription successful!`);
      console.log(`   📝 Text: "${transcription}"`);

      // Get detected language and confidence from response
      const firstResult = response.results && response.results[0];
      const detectedLang = firstResult?.languageCode || 'en-US';
      const confidence = firstResult?.alternatives?.[0]?.confidence || 0;

      console.log(`   🌍 Detected language: ${detectedLang} (confidence: ${(confidence * 100).toFixed(1)}%)`);

      return {
        text: transcription,
        language: detectedLang,
        confidence: confidence,
      };
    } catch (error) {
      console.error('❌ Google Cloud Speech error:', error.message);
      throw error;
    }
  }

  /**
   * Transcribe and translate to English
   * @param {string} audioFilePath - Path to audio file
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<{originalText: string, englishText: string, detectedLanguage: string}>}
   */
  async transcribeAndTranslate(audioFilePath, sourceLanguage = null) {
    try {
      console.log(`\n🎤 Transcribing and translating to English...`);

      // First transcribe
      const result = await this.transcribeAudio(audioFilePath, sourceLanguage);

      let englishText = result.text;

      // If not already in English, translate
      if (result.language && result.language !== 'en-US' && result.language !== 'en' && result.text !== '[No speech detected in audio]') {
        console.log(`   🌐 Translating from ${result.language} to English...`);
        const Translate = require('@google-cloud/translate').v2.Translate;
        const translate = new Translate();

        try {
          const [translation] = await translate.translate(result.text, 'en');
          englishText = translation;
          console.log(`   ✅ Translation complete: "${englishText}"`);
        } catch (err) {
          console.warn(`   ⚠️ Translation failed, using original: ${err.message}`);
          // If translation fails, return original
        }
      }

      return {
        originalText: result.text,
        englishText: englishText,
        detectedLanguage: result.language,
      };
    } catch (error) {
      console.error('❌ Transcribe and translate error:', error.message);
      throw error;
    }
  }

  /**
   * Batch transcribe multiple files
   * @param {string[]} audioFilePaths - Array of file paths
   * @returns {Promise<Array>} Array of transcription results
   */
  async transcribeBatch(audioFilePaths) {
    console.log(`\n📦 Starting batch transcription of ${audioFilePaths.length} files...`);
    const results = [];

    for (let i = 0; i < audioFilePaths.length; i++) {
      try {
        const filePath = audioFilePaths[i];
        console.log(`   [${i + 1}/${audioFilePaths.length}] Processing: ${path.basename(filePath)}`);
        const result = await this.transcribeAudio(filePath);
        results.push({
          file: filePath,
          success: true,
          transcript: result.text,
          language: result.language,
        });
      } catch (error) {
        console.error(`   ❌ Failed to transcribe file ${i + 1}:`, error.message);
        results.push({
          file: audioFilePaths[i],
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Batch transcription complete: ${results.filter(r => r.success).length}/${audioFilePaths.length} successful`);
    return results;
  }
}

module.exports = new GoogleTranscriptionService();
