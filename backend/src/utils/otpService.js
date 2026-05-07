/**
 * OTP Service - Twilio SMS integration
 */
const twilio = require('twilio');
const logger = require('./logger');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOTP = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your Rodofood OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`,
    });
    logger.info(`OTP sent to +91${phone} | SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error(`OTP send failed for +91${phone}: ${error.message}`);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

const OTP_EXPIRY_MINUTES = 10;

module.exports = { generateOTP, sendOTP, OTP_EXPIRY_MINUTES };
