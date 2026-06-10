const APP_NAME = 'PrepHelp';

/**
 * Send email verification OTP after signup
 */
export const sendVerificationEmail = async (userEmail, token) => {
  // Fire and forget IIFE so it doesn't block the main thread/response
  (async () => {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: "PrepHelp", 
            email: "aayushkohli3004@gmail.com" // IMPORTANT: Replace this with the email verified in Brevo dashboard
          },
          to: [{ email: userEmail }],
          subject: "Verify Your PrepHelp Account",
          htmlContent: `<html><body>
            <h2>Welcome to PrepHelp!</h2>
            <p>Your verification code is: <strong>${token}</strong></p>
          </body></html>`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }
      
      console.log(`Verification email successfully sent via Brevo to ${userEmail}`);
    } catch (error) {
      console.error("Brevo Email API Error:", error);
    }
  })();
};

/**
 * Send password reset OTP
 */
export const sendPasswordResetEmail = async (userEmail, token) => {
  // Fire and forget IIFE so it doesn't block the main thread/response
  (async () => {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: "PrepHelp", 
            email: "YOUR_VERIFIED_SENDER_EMAIL@gmail.com" // IMPORTANT: Replace this with the email verified in Brevo dashboard
          },
          to: [{ email: userEmail }],
          subject: "PrepHelp - Password Reset Code",
          htmlContent: `<html><body>
            <h2>Reset Your Password</h2>
            <p>Your password reset code is: <strong>${token}</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </body></html>`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }
      
      console.log(`Password reset email successfully sent via Brevo to ${userEmail}`);
    } catch (error) {
      console.error("Brevo Email API Error:", error);
    }
  })();
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
