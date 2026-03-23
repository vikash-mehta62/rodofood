/**
 * OTP Service - Twilio SMS integration
 * Falls back to console log in development
 */
const logger = require('./logger');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
    return { success: true, sid: 'dev_mode' };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const message = await client.messages.create({
      body: `Your Rodofood OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error(`OTP send failed: ${error.message}`);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

const OTP_EXPIRY_MINUTES = 10;

module.exports = { generateOTP, sendOTP, OTP_EXPIRY_MINUTES };
