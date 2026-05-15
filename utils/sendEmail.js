const nodemailer = require("nodemailer");

const sendEmail = async (subject, send_to, templateData, reply_to = null) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || "EduCore"} <${process.env.EMAIL_FROM || "noreply@educore.ng"}>`,
    to: send_to,
    subject: subject,
    html: templateData,
    replyTo: reply_to || process.env.EMAIL_FROM,
  };

  try {
    const info = await transporter.sendMail(message);
    return info;
  } catch (err) {
    console.error(err);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
