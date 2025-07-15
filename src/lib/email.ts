"use server";

import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Email configuration - set these in your .env.local file
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT
  ? parseInt(process.env.EMAIL_PORT, 10)
  : 587;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom =
  process.env.EMAIL_FROM || '"Speak Admin" <noreply@example.com>';

let transporter: nodemailer.Transporter | null = null;

// Support for Gmail integration
if (
  emailHost &&
  emailUser &&
  emailPass &&
  (emailHost === "gmail" || emailHost === "smtp.gmail.com")
) {
  // Use Gmail service
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.error("Gmail service configuration error:", error);
    } else {
      console.log("Gmail server is ready to send messages");
    }
  });
} else if (emailHost && emailUser && emailPass) {
  // Use custom SMTP (e.g., Mailtrap or other)
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.error("Email service configuration error:", error);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
} else {
  console.warn(
    "Email service is not configured. Please set the following environment variables in your .env.local file:\n" +
      "EMAIL_HOST=gmail (for Gmail integration) or smtp.gmail.com (for Gmail SMTP) or your SMTP server\n" +
      "EMAIL_PORT=587 (or 465 for SSL, not needed for Gmail service)\n" +
      "EMAIL_USER=your-email@gmail.com\n" +
      "EMAIL_PASS=your-app-password\n" +
      "EMAIL_FROM=Speak Admin <noreply@yourdomain.com>\n\n" +
      "For Gmail, you'll need to:\n" +
      "1. Enable 2-factor authentication\n" +
      "2. Generate an App Password\n" +
      "3. Use the App Password as EMAIL_PASS\n\n" +
      "Emails will not be sent until configuration is complete."
  );
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: MailOptions): Promise<{
  success: boolean;
  message: string;
  previewUrl?: string | false;
}> {
  if (!transporter) {
    const message =
      "Email service is not properly configured. Please check your environment variables.";
    console.error(message);
    return { success: false, message };
  }

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);

    // Only show preview URL for test services
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Preview URL: %s", previewUrl);
    }

    return { success: true, message: "Email sent successfully.", previewUrl };
  } catch (error) {
    console.error("Error sending email:", error);
    let errorMessage = "Failed to send email.";
    if (error instanceof Error) {
      errorMessage = `Failed to send email: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
