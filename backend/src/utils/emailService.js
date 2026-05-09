const nodemailer = require('nodemailer');
const logger = require('./logger');

const generateEmailOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // force IPv4
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

const sendEmailOTP = async (email, otp, name = '') => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify your email — Rodofood',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
            <p style="color:#666;font-size:13px;margin-top:4px;">Highway Food Pre-Ordering</p>
          </div>
          <p style="color:#333;font-size:15px;">Hi ${name || 'there'},</p>
          <p style="color:#555;font-size:14px;line-height:1.6;">Use the OTP below to verify your email address. It is valid for <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#FFF7ED;border:2px dashed #FF6B35;border-radius:12px;padding:16px 40px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#FF6B35;">${otp}</span>
            </div>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;">Do not share this OTP with anyone. Rodofood will never ask for your OTP.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · India's First Highway Food Network</p>
        </div>
      `,
    });
    logger.info(`Email OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Email OTP failed for ${email}: ${error.message}`);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

const EMAIL_OTP_EXPIRY_MINUTES = 10;

module.exports = { generateEmailOTP, sendEmailOTP, EMAIL_OTP_EXPIRY_MINUTES };
