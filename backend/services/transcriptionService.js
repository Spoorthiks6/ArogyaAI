const fs = require('fs');
const path = require('path');

// Using OpenAI Whisper API or local processing
// You can also use Google Cloud Speech-to-Text, AWS Transcribe, etc.

class TranscriptionService {
  /**
   * Transcribe audio file to text
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} language - Language code (optional, e.g., 'hi' for Hindi, 'kn' for Kannada, 'en' for English)
   * @returns {Promise<string>} Transcribed text
   */
  static async transcribeAudio(audioFilePath, language = null) {
    try {
      console.log(`🎤 Transcribing audio file: ${audioFilePath}`);
      
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Get file size
      const fileStats = fs.statSync(audioFilePath);
      console.log(`   File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

      // Use Whisper API from OpenAI
      const transcript = await this.transcribeWithWhisper(audioFilePath, language);
      
      console.log(`✅ Transcription completed`);
      return transcript;
    } catch (error) {
      console.error('❌ Transcription error:', error.message);
      throw error;
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   * @param {string} audioFilePath - Path to audio file
   * @param {string} language - Language code
   * @returns {Promise<string>}
   */
  static async transcribeWithWhisper(audioFilePath, language = null) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Please configure it in .env file.');
    }

    try {
      console.log('   📡 Connecting to Whisper API...');
      console.log(`   API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
      
      const FormData = require('form-data');
      const fetch = require('node-fetch');
      
      const formData = new FormData();
      const fileStream = fs.createReadStream(audioFilePath);
      formData.append('file', fileStream);
      formData.append('model', 'whisper-1');
      
      console.log(`   📤 Uploading audio file (${audioFilePath})...`);
      
      // Set language if provided
      if (language && language !== 'en') {
        formData.append('language', language);
        console.log(`   🌍 Language: ${language}`);
      }

      console.log('   ⏳ Waiting for Whisper API response...');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData,
        timeout: 60000 // 60 second timeout
      });

      console.log(`   📥 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        
        console.error('   ❌ API Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(`Whisper API error (${response.status}): ${errorData.error?.message || errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log(`   📝 Raw Whisper Response:`, JSON.stringify(result, null, 2));
      
      if (!result.text) {
        console.warn('   ⚠️ No text field in Whisper response');
        return '[No transcription available]';
      }
      
      console.log(`   ✅ Transcribed text: "${result.text}"`);
      return result.text;
    } catch (error) {
      console.error('   ❌ Whisper API error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Detect language from audio (optional)
   * @param {string} audioFilePath - Path to audio file
   * @returns {Promise<string>} Detected language code
   */
  static async detectLanguage(audioFilePath) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('OPENAI_API_KEY not set, skipping language detection');
        return null;
      }

      const FormData = require('form-data');
      const fetch = require('node-fetch');
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      formData.append('model', 'whisper-1');

      // First, transcribe without language to get text
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      // Return the detected language from result
      return result.language || 'en';
    } catch (error) {
      console.warn('Language detection error:', error.message);
      return null;
    }
  }

  /**
   * Batch transcribe multiple files
   * @param {string[]} audioFilePaths - Array of file paths
   * @returns {Promise<string[]>} Array of transcriptions
   */
  static async transcribeBatch(audioFilePaths) {
    const results = [];
    
    for (const filePath of audioFilePaths) {
      try {
        const transcript = await this.transcribeAudio(filePath);
        results.push(transcript);
      } catch (error) {
        console.error(`Failed to transcribe ${filePath}:`, error.message);
        results.push(null);
      }
    }
    
    return results;
  }
}

module.exports = TranscriptionService;
