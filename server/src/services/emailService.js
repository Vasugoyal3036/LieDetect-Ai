const nodemailer = require("nodemailer");

// Create reusable transporter with timeout
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password (not regular password)
    },
    // Add timeouts to fail faster if credentials are wrong
    connectionTimeout: 5000,  // 5 seconds
    socketTimeout: 5000,      // 5 seconds
  });
};

// Send verification email with magic link
const sendVerificationEmail = async (email, token, name) => {
  const transporter = createTransporter();

  // Determine base URL dynamically (using Vite default URL fallback)
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyLink = `${clientUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"LieDetect AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - LieDetect AI",
    html: `
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
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <span style="font-size: 28px;">🛡️</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Complete Verification</h1>
                    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Welcome to LieDetect AI</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                      Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                      Almost there! We just need you to verify your email address to activate your account. Click the secure link below to get started.
                    </p>

                    <!-- Verification Link -->
                    <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(99,102,241,0.4);">
                      Verify Email Address
                    </a>

                    <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6; margin: 32px 0 0;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${verifyLink}" style="color: #818cf8; text-decoration: underline; word-break: break-all;">${verifyLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
  const transporter = createTransporter();

  // Determine base URL dynamically (using Vite default URL fallback)
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"LieDetect AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - LieDetect AI",
    html: `
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
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <span style="font-size: 28px;">🔑</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Password Reset Request</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                      Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                      We received a request to reset the password for your LieDetect AI account. Click the button below to choose a new password. This link will expire in exactly 1 hour.
                    </p>

                    <!-- Verification Link -->
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(236,72,153,0.4);">
                      Reset Password
                    </a>

                    <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6; margin: 32px 0 0;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${resetLink}" style="color: #818cf8; text-decoration: underline; word-break: break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px 40px;">
                    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} LieDetect AI &bull; AI-Powered Interview Analysis
                      </p>
                      <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 8px 0 0;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send 2FA Code
const sendTwoFactorEmail = async (email, otp, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"LieDetect AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html: `
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
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #3b82f6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <span style="font-size: 28px;">🔐</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 700;">Login Code</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                      Hi <strong style="color: #ffffff;">${name}</strong>,<br><br>
                      Please use the following 6-digit verification code to complete your login securely. This code will expire in 10 minutes.
                    </p>

                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.2); margin-bottom: 32px;">
                       <h2 style="font-size: 36px; letter-spacing: 8px; color: #10b981; margin: 0; font-family: monospace;">${otp}</h2>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px 40px;">
                    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} LieDetect AI
                      </p>
                      <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 8px 0 0;">
                        If you didn't attempt to log in, please secure your account.
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorEmail };
