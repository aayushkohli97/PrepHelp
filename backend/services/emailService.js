import nodemailer from 'nodemailer';

const APP_NAME = 'PrepHelp';

/**
 * Create a fresh transporter on each call so it always reads
 * the latest process.env values (avoids dotenv race condition).
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true only for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Helps with Gmail reliability
    tls: {
      rejectUnauthorized: false,
    },
    // Forces IPv4 to fix Render's ENETUNREACH IPv6 error
    family: 4, 
  });
};

/**
 * When using Gmail SMTP, the FROM address MUST be the Gmail account itself.
 * Using a custom domain (noreply@prephelp.com) causes Gmail to reject it.
 */
const getFromAddress = () => {
  return `"${APP_NAME}" <${process.env.SMTP_USER}>`;
};

/**
 * Build a styled HTML email body
 */
const buildEmailHTML = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0f; font-family: Arial, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #12121a; border-radius: 16px; border: 1px solid rgba(108,92,231,0.2); overflow: hidden; }
    .header { background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; }
    .body { padding: 32px 24px; }
    .body p { color: #a0a0b8; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #1a1a2e; border: 1px solid rgba(108,92,231,0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #a29bfe; font-family: monospace; }
    .footer { padding: 16px 24px; border-top: 1px solid rgba(108,92,231,0.15); text-align: center; }
    .footer p { color: #6c6c80; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ ${APP_NAME}</h1>
    </div>
    <div class="body">
      <h2 style="color:#e8e8f0; margin:0 0 16px; font-size:20px;">${title}</h2>
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated email from ${APP_NAME}. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send email verification OTP after signup
 */
export const sendVerificationEmail = async (to, otp) => {
  const body = `
    <p>Welcome to ${APP_NAME}! Please verify your email address to get started.</p>
    <p>Use the following 6-digit code to verify your account:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(), // Must match SMTP_USER for Gmail
    to,
    subject: `${APP_NAME} — Verify Your Email`,
    html: buildEmailHTML('Verify Your Email', body),
  });

  console.log(`✅ Verification email sent to ${to}`);
};

/**
 * Send password reset OTP
 */
export const sendPasswordResetEmail = async (to, otp) => {
  const body = `
    <p>We received a request to reset your password.</p>
    <p>Use the following 6-digit code to proceed:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p>If you didn't request a password reset, please ignore this email — your password will remain unchanged.</p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(), // Must match SMTP_USER for Gmail
    to,
    subject: `${APP_NAME} — Password Reset Code`,
    html: buildEmailHTML('Reset Your Password', body),
  });

  console.log(`✅ Password reset email sent to ${to}`);
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
