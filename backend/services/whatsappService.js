const twilio = require('twilio');

let client = null;
let isInitialized = false;
let twilioPhoneNumber = null;

const initWhatsApp = (accountSid, authToken, phoneNumber) => {
  if (!accountSid || !authToken || !phoneNumber) {
    console.warn('⚠️ Twilio WhatsApp credentials not fully provided. WhatsApp functionality will be disabled.');
    return false;
  }
  try {
    client = twilio(accountSid, authToken);
    twilioPhoneNumber = phoneNumber;
    isInitialized = true;
    console.log('✅ Twilio WhatsApp initialized successfully');
    console.log(`📱 WhatsApp Number: ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Error initializing Twilio WhatsApp:', error);
    return false;
  }
};

const formatPhoneNumberForWhatsApp = (phone) => {
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's 10 digits (Indian), add +91
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return 'whatsapp:+91' + cleaned;
  }
  
  // If it has country code but no +, add it
  if (!cleaned.startsWith('+')) {
    return 'whatsapp:+' + cleaned;
  }
  
  // If already has +, just prepend whatsapp:
  return 'whatsapp:' + cleaned;
};

const sendWhatsApp = async (toPhoneNumber, message) => {
  if (!client || !isInitialized) {
    throw new Error('Twilio WhatsApp not initialized. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env');
  }

  try {
    const formattedPhone = formatPhoneNumberForWhatsApp(toPhoneNumber);
    
    console.log(`📤 Sending WhatsApp via Twilio:`);
    console.log(`   To: ${formattedPhone}`);
    console.log(`   From: whatsapp:${twilioPhoneNumber}`);
    console.log(`   Message length: ${message.length} characters`);

    const result = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      to: formattedPhone,
      body: message
    });

    console.log(`   ✅ WhatsApp sent: ${result.sid}`);
    return {
      success: true,
      messageSid: result.sid,
      sentTo: toPhoneNumber,
      status: 'sent',
      provider: 'twilio'
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${toPhoneNumber}:`);
    console.error(`   Error: ${error.message}`);
    
    return {
      success: false,
      messageSid: null,
      sentTo: toPhoneNumber,
      status: 'failed',
      provider: 'twilio',
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message
    };
  }
};

const sendBulkWhatsApp = async (phoneNumbers, message) => {
  if (!isInitialized) {
    console.warn('⚠️ Twilio WhatsApp not initialized. Skipping WhatsApp notifications.');
    return { success: false, reason: 'WhatsApp not initialized' };
  }

  console.log(`\n📢 Sending WhatsApp via Twilio to ${phoneNumbers.length} contact(s)...`);
  console.log(`   Message: "${message.substring(0, 50)}..."`);
  
  try {
    const results = await Promise.allSettled(
      phoneNumbers.map(phone => {
        console.log(`   - Queuing WhatsApp to ${phone}`);
        return sendWhatsApp(phone, message);
      })
    );

    let sentCount = 0;
    let failedCount = 0;
    const sentResults = [];
    const errorResults = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const whatsappResult = result.value;
        if (whatsappResult.success) {
          sentResults.push(whatsappResult);
          sentCount++;
          console.log(`   ✅ WhatsApp ${index + 1}: ${whatsappResult.messageSid}`);
        } else {
          errorResults.push({
            phone: phoneNumbers[index],
            errorCode: whatsappResult.errorCode,
            errorMessage: whatsappResult.errorMessage
          });
          failedCount++;
          console.warn(`   ❌ WhatsApp ${index + 1}: Error ${whatsappResult.errorCode} - ${whatsappResult.errorMessage}`);
        }
      } else {
        errorResults.push({
          phone: phoneNumbers[index],
          errorCode: 'EXCEPTION',
          errorMessage: result.reason?.message || 'Unknown error'
        });
        failedCount++;
        console.error(`   ❌ WhatsApp ${index + 1}: Exception - ${result.reason?.message}`);
      }
    });

    console.log(`\n📊 WhatsApp Results: ${sentCount} sent, ${failedCount} failed`);

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      details: sentResults,
      errors: errorResults
    };
  } catch (error) {
    console.error('❌ Error sending bulk WhatsApp:', error);
    throw error;
  }
};

module.exports = {
  initWhatsApp,
  sendWhatsApp,
  sendBulkWhatsApp,
  formatPhoneNumberForWhatsApp
};
