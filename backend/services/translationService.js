const https = require('https');

/**
 * Translation Service - Translates text from Hindi/Kannada to English
 * Uses Google Translate API (free endpoint)
 */

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/element.js';

/**
 * Translate text from source language to English using a free translation API
 * Supports: hi (Hindi) -> en (English), kn (Kannada) -> en (English)
 */
async function translateToEnglish(text, sourceLanguage) {
  console.log(`📝 Translating from ${sourceLanguage} to English...`);
  
  // If already in English or unknown language, return as is
  if (sourceLanguage === 'en' || !text) {
    return text;
  }

  try {
    // Use Google Translate free API endpoint
    const languageMap = {
      'hi': 'hi',
      'kn': 'kn',
      'en': 'en'
    };

    const targetLang = languageMap[sourceLanguage] || sourceLanguage;
    
    // Using free translation via Google's public translate API
    const translated = await translateViaGoogleFree(text, targetLang, 'en');
    
    console.log(`✅ Translation successful: "${text}" -> "${translated}"`);
    return translated;
  } catch (error) {
    console.error(`❌ Translation error: ${error.message}`);
    console.log(`⚠️ Falling back to original text in ${sourceLanguage}`);
    return text; // Return original if translation fails
  }
}

/**
 * Use free Google Translate API endpoint
 * This uses an undocumented but publicly available endpoint
 */
async function translateViaGoogleFree(text, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    // Using MyMemory Translation API (completely free, no key needed)
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.responseStatus === 200 && response.responseData) {
            const translatedText = response.responseData.translatedText;
            resolve(translatedText);
          } else {
            console.warn(`⚠️ Translation API warning: ${response.responseDetails}`);
            resolve(text); // Return original if API returns warning
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse translation response:`, parseError.message);
          reject(parseError);
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Translation API error: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Batch translate multiple texts
 * Useful for translating emergency alert components
 */
async function translateBatch(texts, sourceLanguage) {
  if (sourceLanguage === 'en' || !texts || texts.length === 0) {
    return texts;
  }

  try {
    const translated = await Promise.all(
      texts.map(text => translateToEnglish(text, sourceLanguage))
    );
    return translated;
  } catch (error) {
    console.error(`❌ Batch translation error:`, error.message);
    return texts; // Return original texts if batch translation fails
  }
}

/**
 * Format emergency message in both source and English
 * Returns object with both versions
 */
async function formatEmergencyMessage(originalText, sourceLanguage, location, userName) {
  const englishText = sourceLanguage === 'en' 
    ? originalText 
    : await translateToEnglish(originalText, sourceLanguage);

  const smsMessage = `🚨 EMERGENCY ALERT from ${userName}: ${englishText}. Location: https://maps.google.com/?q=${location}`;
  
  return {
    original: originalText,
    english: englishText,
    smsMessage: smsMessage,
    whatsappMessage: `🚨 EMERGENCY ALERT\n\nFrom: ${userName}\nMessage: ${englishText}\n\nLocation: https://maps.google.com/?q=${location}`,
    sourceLanguage: sourceLanguage
  };
}

module.exports = {
  translateToEnglish,
  translateBatch,
  formatEmergencyMessage,
  GOOGLE_TRANSLATE_API
};
