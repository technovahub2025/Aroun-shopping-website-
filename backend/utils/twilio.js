require('dotenv').config();
const Twilio = require('twilio');

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send OTP via Twilio Verify
const sendOTP = async (phone) => {
  if (!process.env.TWILIO_SERVICE_SID) throw new Error('TWILIO_SERVICE_SID missing');
  return client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
    .verifications.create({ to: phone, channel: 'sms' });
};

// Verify OTP via Twilio Verify
const verifyOTP = async (phone, code) => {
  if (!process.env.TWILIO_SERVICE_SID) throw new Error('TWILIO_SERVICE_SID missing');
  return client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
};

module.exports = { sendOTP, verifyOTP };
