const { Resend } = require("resend");

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Send verification email with magic link
const sendVerificationEmail = async (email, token, name) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyLink = `${clientUrl}/verify-email?token=${token}`;

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #1a1a3e, #16162e); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="font-size: 28px;">🛡️</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Complete Verification</h1>
                  <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Welcome to LieDetect AI</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                    Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                    Almost there! We just need you to verify your email address to activate your account. Click the secure link below to get started.
                  </p>
                  <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(99,102,241,0.4);">
                    Verify Email Address
                  </a>
                  <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6; margin: 32px 0 0;">
                    Or copy and paste this link:<br>
                    <a href="${verifyLink}" style="color: #818cf8; text-decoration: underline; word-break: break-all;">${verifyLink}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} LieDetect AI &bull; AI-Powered Interview Analysis
                    </p>
                    <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 8px 0 0;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_USER || "onboarding@resend.dev",
      to: email,
      subject: "Verify Your Email - LieDetect AI",
      html: emailContent,
    });
    console.log("✓ Verification email sent to:", email);
  } catch (error) {
    console.error("Resend verification email error:", error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #1a1a3e, #16162e); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="font-size: 28px;">🔑</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Reset Your Password</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                    Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                    We received a request to reset your password. Click below to choose a new password. This link expires in 1 hour.
                  </p>
                  <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(236,72,153,0.4);">
                    Reset Password
                  </a>
                  <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6; margin: 32px 0 0;">
                    Or visit: <a href="${resetLink}" style="color: #818cf8; text-decoration: underline; word-break: break-all;">${resetLink}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">
                      If you didn't request a password reset, ignore this email. Your password will remain unchanged.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_USER || "onboarding@resend.dev",
      to: email,
      subject: "Reset Your Password - LieDetect AI",
      html: emailContent,
    });
    console.log("✓ Password reset email sent to:", email);
  } catch (error) {
    console.error("Resend password reset error:", error);
    throw error;
  }
};

// Send 2FA email
const sendTwoFactorEmail = async (email, otp, name) => {
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #1a1a3e, #16162e); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #3b82f6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="font-size: 28px;">🔐</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Your 2FA Code</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                    Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                    Your two-factor authentication code is:
                  </p>
                  <div style="background: rgba(99, 102, 241, 0.15); border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 32px 0;">
                    <p style="color: #6366f1; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                  </div>
                  <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0;">
                    This code expires in 5 minutes. Never share this code with anyone.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">
                      If you didn't request this code, ignore this email.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_USER || "onboarding@resend.dev",
      to: email,
      subject: "Your 2FA Code - LieDetect AI",
      html: emailContent,
    });
    console.log("✓ 2FA email sent to:", email);
  } catch (error) {
    console.error("Resend 2FA error:", error);
    throw error;
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorEmail };
