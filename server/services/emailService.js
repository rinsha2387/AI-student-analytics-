const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendOtpEmail = async (email, otp, purpose = "verification") => {
  return transporter.sendMail({
    from: `"AI Student Analytics" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your AI Student Analytics verification code",
    text: `Your ${purpose} OTP is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
        <h2>AI Student Analytics</h2>
        <p>Use this verification code to continue your ${purpose}:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
          ${otp}
        </div>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
