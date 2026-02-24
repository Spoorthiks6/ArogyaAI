const axios = require('axios');

let isInitialized = false;
let authKey = null;
let route = null;
let senderId = null;

const initMSG91 = (key, routeId, sender) => {
  if (!key || !routeId || !sender) {
    console.warn('⚠️ MSG91 credentials not provided. SMS functionality will be disabled.');
    return false;
  }
  try {
    authKey = key;
    route = routeId;
    senderId = sender;
    isInitialized = true;
    console.log('✅ MSG91 initialized successfully');
    console.log(`📱 MSG91 Auth Key: ${authKey.substring(0, 4)}...`);
    console.log(`📱 MSG91 Sender ID: ${senderId}`);
    return true;
  } catch (error) {
    console.error('❌ Error initializing MSG91:', error);
    return false;
  }
};

const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If already has +, validate E.164
  if (cleaned.startsWith('+')) {
    // MSG91 accepts E.164 format, just return it
    return cleaned;
  }
  
  // If 10 digits, assume Indian number and add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // If 12 digits starting with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }
  
  // Otherwise just add +
  return '+' + cleaned;
};

const sendSMS = async (toPhoneNumber, message) => {
  if (!isInitialized) {
    throw new Error('MSG91 not initialized. Check MSG91_AUTHKEY in .env');
  }

  try {
    // Use legacy MSG91 endpoint for trial accounts
    const cleaned = toPhoneNumber.replace(/\D/g, '').replace(/^0+/, '');
    const mobile = cleaned.length === 10 ? '91' + cleaned : cleaned;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.msg91.com/api/sendhttp.php?authkey=${authKey}&mobiles=${mobile}&message=${encodedMessage}&sender=${senderId}&route=${route}&country=91`;
    console.log(`📤 Sending SMS via MSG91 (legacy endpoint):`);
    console.log(`   URL: ${url}`);
    const response = await axios.get(url);
    // MSG91 legacy returns plain text like 'success:1234567890' or error string
    if (typeof response.data === 'string' && response.data.startsWith('success')) {
      return {
        success: true,
        messageSid: response.data.split(':')[1] || null,
        sentTo: toPhoneNumber,
        status: 'sent',
        price: null,
        errorCode: null,
        errorMessage: null
      };
    } else {
      return {
        success: false,
        sentTo: toPhoneNumber,
        status: 'failed',
        errorCode: 'MSG91_ERROR',
        errorMessage: response.data,
        msgId: null
      };
    }
  } catch (error) {
    console.error(`❌ Error sending SMS to ${toPhoneNumber}:`);
    console.error(`   Error Message: ${error.message}`);
    if (error.response) {
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    return {
      success: false,
      messageSid: null,
      sentTo: toPhoneNumber,
      status: 'failed',
      errorCode: error.response?.status || 'EXCEPTION',
      errorMessage: error.message,
      originalError: error.message
    };
  }
};

const sendEmergencySMS = async (contactPhoneNumbers, emergencyDetails) => {
  if (!isInitialized) {
    console.warn('⚠️ MSG91 not initialized. Skipping SMS notifications.');
    return { success: false, reason: 'MSG91 not initialized' };
  }

  // Shorter message (MSG91 best practice for delivery: < 160 chars)
  const message = `EMERGENCY: ${emergencyDetails.userName} needs help!
Location: ${emergencyDetails.location || 'Not available'}
Call immediately or contact emergency services.`;

  console.log(`\n📢 Sending emergency SMS via MSG91 to ${contactPhoneNumbers.length} contacts...`);
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
          errorResults.push({
            phone: contactPhoneNumbers[index],
            errorCode: smsResult.errorCode,
            errorMessage: smsResult.errorMessage
          });
          failedCount++;
          console.warn(`   ❌ SMS ${index + 1}: Error ${smsResult.errorCode} - ${smsResult.errorMessage}`);
        }
      } else {
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
  initMSG91,
  sendSMS,
  sendEmergencySMS,
  formatPhoneNumber
};
