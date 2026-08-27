// ============================================
// 📧 COMPLETE OTP EMAIL SERVICE - Single File
// ============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ============================================
// 1. OTP GENERATOR
// ============================================
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP =  async(email,name,otp) =>{
    

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",  // ← MUST BE smtp.gmail.com
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
  },
});

try {
  const info = await transporter.sendMail({
    from: '"Hi I Am Aman" aryansinger435@gmail.com', // sender address
    to: email, // list of recipients
    subject: "Hello", // subject line
    text: "hello", // plain text body
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
        }
        .email-container {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 40px 35px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
            border: 1px solid #e4e7ec;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 22px;
            margin-bottom: 28px;
        }
        .header h1 {
            font-size: 26px;
            color: #1a2332;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .header h1 span {
            color: #4CAF50;
        }
        .header p {
            color: #7a8a9e;
            font-size: 13px;
            margin: 4px 0 0 0;
            letter-spacing: 0.5px;
        }
        .greeting {
            margin-bottom: 22px;
        }
        .greeting h2 {
            font-size: 19px;
            color: #1a2332;
            font-weight: 600;
            margin: 0 0 6px 0;
        }
        .greeting p {
            color: #4a5a6e;
            font-size: 15px;
            line-height: 1.7;
            margin: 0;
        }
        .otp-box {
            background: linear-gradient(145deg, #f7f9fc 0%, #eef1f5 100%);
            padding: 28px 20px;
            text-align: center;
            border-radius: 12px;
            margin: 25px 0;
            border: 2px dashed #4CAF50;
        }
        .otp-box .label {
            font-size: 12px;
            color: #7a8a9e;
            text-transform: uppercase;
            letter-spacing: 4px;
            font-weight: 600;
            display: block;
            margin-bottom: 10px;
        }
        .otp-box .otp-code {
            font-size: 46px;
            color: #1a2332;
            letter-spacing: 14px;
            font-weight: 800;
            background: #ffffff;
            padding: 10px 22px;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
            font-family: 'Courier New', monospace;
        }
        .info-box {
            padding: 14px 18px;
            border-radius: 8px;
            margin: 16px 0;
            text-align: center;
        }
        .info-box.validity {
            background: #fff8e1;
            border-left: 4px solid #ffc107;
        }
        .info-box.validity p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .info-box.security {
            background: #fce4ec;
            border-left: 4px solid #e53935;
        }
        .info-box.security p {
            color: #b71c1c;
            font-size: 13px;
            margin: 0;
        }
        .info-box strong {
            font-weight: 700;
        }
        .footer {
            border-top: 1px solid #e4e7ec;
            padding-top: 22px;
            text-align: center;
            margin-top: 8px;
        }
        .footer p {
            font-size: 12px;
            color: #9aabbe;
            margin: 0 0 4px 0;
            line-height: 1.6;
        }
        .footer .brand-name {
            color: #4CAF50;
            font-weight: 600;
        }
        .footer .copyright {
            color: #b0c0d0;
            font-size: 11px;
            margin-top: 6px;
        }
        .footer .auto-note {
            color: #c5d0dd;
            font-size: 11px;
            margin-top: 8px;
        }
        @media (max-width: 480px) {
            .email-container {
                padding: 25px 18px;
            }
            .otp-box .otp-code {
                font-size: 34px;
                letter-spacing: 10px;
                padding: 8px 14px;
            }
            .header h1 {
                font-size: 22px;
            }
            .greeting h2 {
                font-size: 17px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🛍️ Cloth <span>Store</span></h1>
            <p>Your Trusted Fashion Destination</p>
        </div>

        <!-- Greeting -->
        <div class="greeting">
            <h2>Hello ${otp}! 👋</h2>
            <p>Thank you for choosing Cloth Store. Please use the OTP below to complete your verification.</p>
        </div>

        <!-- OTP Code -->
        <div class="otp-box">
            <span class="label">🔑 One-Time Password</span>
            <div class="otp-code">${otp} ${name}</div>
        </div>

        <!-- Validity -->
        <div class="info-box validity">
            <p>⏰ This OTP is valid for <strong>5 minutes</strong> only</p>
        </div>

        <!-- Security Note -->
        <div class="info-box security">
            <p>🔒 <strong>Never share this OTP</strong> with anyone. Cloth Store will never ask for your OTP.</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>If you didn't request this, please <strong>ignore</strong> this email.</p>
            <p class="copyright">© ${new Date().getFullYear()} <span class="brand-name">Cloth Store</span>. All rights reserved.</p>
            <p class="auto-note">This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
`, // HTML body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview URL is only available when using an Ethereal test account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} catch (err) {
  console.error("Error while sending mail:", err);
}
}


export const verifyOTP = (userOTP, storedOTP, expiryTime) => {
    if (userOTP !== storedOTP) {
        return { success: false, message: 'Invalid OTP' };
    }
    if (new Date() > new Date(expiryTime)) {
        return { success: false, message: 'OTP has expired' };
    }
    return { success: true, message: 'OTP verified successfully' };
};

// ============================================
// 4. RESEND OTP
// ============================================
export const resendOTP = async (email, name) => {
    const newOTP = generateOTP();
    await sendOTP(email, name, newOTP);
    return { success: true, otp: newOTP, message: 'New OTP sent' };
};

export default {
    generateOTP,
    sendOTP,
    verifyOTP,
    resendOTP
};