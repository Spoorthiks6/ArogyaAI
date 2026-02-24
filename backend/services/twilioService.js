const twilio = require('twilio');

let client = null;
let isInitialized = false;

const initTwilio = (accountSid, authToken) => {
  if (!accountSid || !authToken) {
    console.warn('⚠️ Twilio credentials not provided. SMS functionality will be disabled.');
    return false;
  }
  try {
    client = twilio(accountSid, authToken);
    isInitialized = true;
    console.log('✅ Twilio initialized successfully');
    console.log(`📱 Twilio Account SID: ${accountSid.substring(0, 4)}...`);
    return true;
  } catch (error) {
    console.error('❌ Error initializing Twilio:', error);
    return false;
  }
};

const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // If it's 10 digits, assume Indian number and add +91
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    // If no country code, add +91 for India by default
    if (cleaned.length === 12) {
      return '+91' + cleaned.slice(-10);
    }
    return '+' + cleaned;
  }
  
  // Validate E.164 format: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(cleaned)) {
    console.warn(`⚠️ Phone number ${phone} does not match E.164 format: ${cleaned}`);
  }
  
  return cleaned;
};

const sendSMS = async (toPhoneNumber, message) => {
  if (!client || !isInitialized) {
    throw new Error('Twilio not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not set in environment variables');
  }

  try {
    const formattedTo = formatPhoneNumber(toPhoneNumber);
    const formattedFrom = formatPhoneNumber(fromNumber);
    
    console.log(`📤 Sending SMS:`);
    console.log(`   From: ${formattedFrom}`);
    console.log(`   To: ${formattedTo}`);
    console.log(`   Message length: ${message.length} chars`);
    console.log(`   Message preview: ${message.substring(0, 50)}...`);
    
    const result = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo
    });
    
    console.log(`✅ SMS sent successfully!`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Price: $${result.price || 'N/A'}`);
    if (result.errorCode) {
      console.log(`   ⚠️ Error Code: ${result.errorCode}`);
      console.log(`   Error Message: ${result.errorMessage}`);
    }
    
    return {
      success: true,
      messageSid: result.sid,
      sentTo: toPhoneNumber,
      status: result.status,
      price: result.price,
      errorCode: result.errorCode || null,
      errorMessage: result.errorMessage || null
    };
  } catch (error) {
    console.error(`❌ Error sending SMS to ${toPhoneNumber}:`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   HTTP Status: ${error.status}`);
    console.error(`   Details: ${error.details?.message || 'No details'}`);
    
    // Extract Twilio error code if available
    const twilioErrorCode = error.code || error.status || 'UNKNOWN';
    const twilioErrorMessage = error.details?.message || error.message || 'Unknown error';
    
    return {
      success: false,
      messageSid: null,
      sentTo: toPhoneNumber,
      status: 'failed',
      errorCode: twilioErrorCode,
      errorMessage: twilioErrorMessage,
      originalError: error.message
    };
  }
};

const sendEmergencySMS = async (contactPhoneNumbers, emergencyDetails) => {
  if (!client || !isInitialized) {
    console.warn('⚠️ Twilio not initialized. Skipping SMS notifications.');
    return { success: false, reason: 'Twilio not initialized' };
  }

  // Shorter message to avoid multi-segment issues (trial account limitation - error 30044)
  // Each SMS is max 160 chars for best delivery on trial accounts
  const message = `EMERGENCY: ${emergencyDetails.userName} needs help!
Location: ${emergencyDetails.location || 'Not available'}
Call immediately or contact emergency services.`;

  // Check if on trial account
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const isTrial = accountSid && accountSid.startsWith('AC'); // Trial accounts follow this pattern
  
  if (isTrial) {
    console.log(`\n⚠️ TRIAL ACCOUNT DETECTED`);
    console.log(`   Trial accounts can ONLY send to verified numbers`);
    console.log(`   Unverified numbers will fail with error 21608`);
    console.log(`   To fix: Upgrade account OR verify each number in Twilio Console`);
  }

  console.log(`\n📢 Sending emergency SMS to ${contactPhoneNumbers.length} contacts...`);
  console.log(`   Message length: ${message.length} characters`);
  
  try {
    const results = await Promise.allSettled(
      contactPhoneNumbers.map(phone => {
        const normalizedPhone = formatPhoneNumber(phone);
        console.log(`   - Queuing SMS to ${normalizedPhone}`);
        return sendSMS(normalizedPhone, message);
      })
    );

    const sentResults = [];
    const errorResults = [];
    let sentCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const smsResult = result.value;
        if (smsResult.success) {
          sentResults.push(smsResult);
          sentCount++;
          console.log(`   ✅ SMS ${index + 1}: ${smsResult.messageSid}`);
        } else {
          // Send failed with Twilio error
          errorResults.push({
            phone: contactPhoneNumbers[index],
            errorCode: smsResult.errorCode,
            errorMessage: smsResult.errorMessage
          });
          failedCount++;
          console.warn(`   ❌ SMS ${index + 1}: Error ${smsResult.errorCode} - ${smsResult.errorMessage}`);
        }
      } else {
        // Promise rejected
        errorResults.push({
          phone: contactPhoneNumbers[index],
          errorCode: 'EXCEPTION',
          errorMessage: result.reason?.message || 'Unknown error'
        });
        failedCount++;
        console.error(`   ❌ SMS ${index + 1}: Exception - ${result.reason?.message}`);
      }
    });

    console.log(`\n📊 SMS Results: ${sentCount} sent, ${failedCount} failed`);
    
    if (errorResults.length > 0) {
      console.log(`\n⚠️ Error Summary:`);
      errorResults.forEach((err, idx) => {
        console.log(`   [${idx + 1}] ${err.phone}: ${err.errorCode} - ${err.errorMessage}`);
      });
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      details: sentResults,
      errors: errorResults
    };
  } catch (error) {
    console.error('❌ Error sending bulk emergency SMS:', error);
    throw error;
  }
};

module.exports = {
  initTwilio,
  sendSMS,
  sendEmergencySMS,
  formatPhoneNumber
};
