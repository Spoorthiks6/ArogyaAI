const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Convert audio files to WAV format for better compatibility with transcription APIs
 * Uses ffmpeg for conversion
 */
class AudioConverterService {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp-audio');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Convert audio file to WAV format
   * @param {string} inputPath - Path to input audio file
   * @returns {Promise<string>} - Path to converted WAV file
   */
  async convertToWav(inputPath) {
    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      const inputExt = path.extname(inputPath).toLowerCase();
      
      // If already WAV, return as-is
      if (inputExt === '.wav') {
        console.log(`   ✅ Already WAV format, no conversion needed`);
        return inputPath;
      }

      console.log(`   🔄 Converting ${inputExt} to WAV...`);

      const outputPath = path.join(
        this.tempDir,
        `${Date.now()}-${Math.random().toString(36).slice(2)}.wav`
      );

      // Use ffmpeg to convert
      const command = `ffmpeg -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;
      
      console.log(`   📤 Running ffmpeg conversion...`);
      const { stderr } = await execAsync(command, { timeout: 30000 });

      if (!fs.existsSync(outputPath)) {
        throw new Error('Conversion failed: output file not created');
      }

      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;
      
      console.log(`   ✅ Conversion successful`);
      console.log(`      Input: ${inputExt} (${(inputSize / 1024).toFixed(1)}KB)`);
      console.log(`      Output: WAV (${(outputSize / 1024).toFixed(1)}KB)`);

      return outputPath;
    } catch (error) {
      console.error(`   ❌ Conversion error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up temporary converted files
   * @param {string} filePath - Path to temporary file
   */
  cleanupTemp(filePath) {
    try {
      if (filePath && fs.existsSync(filePath) && filePath.includes('/temp-audio/')) {
        fs.unlinkSync(filePath);
        console.log(`   🧹 Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not clean temp file: ${error.message}`);
    }
  }
}

module.exports = new AudioConverterService();
