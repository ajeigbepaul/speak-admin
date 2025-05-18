
"use server";

import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Ensure these are set in your .env.local
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || '"Speak Admin" <noreply@example.com>';

let transporter: nodemailer.Transporter | null = null;

if (emailHost && emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
} else {
  console.warn(
    "Email service is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in your .env.local file. Emails will not be sent."
  );
  // Fallback to Ethereal if no config provided (for local dev convenience, will log to console)
  // This part will attempt to create a test account if no other config is found.
  // In a real scenario, you might want to disable this or make it more explicit.
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error("Failed to create a test email account for Ethereal:", err);
      return;
    }
    console.log("Ethereal test account created. Credentials:");
    console.log("User:", account.user);
    console.log("Pass:", account.pass);
    console.log("Preview URL:", nodemailer.getTestMessageUrl({path:''})); // Dummy call to satisfy type

    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass, // generated ethereal password
        },
    });
     console.log("Nodemailer configured with Ethereal for testing. Check console for credentials and preview URLs.");
  });

}

export async function sendMail({ to, subject, text, html }: MailOptions): Promise<{success: boolean; message: string; previewUrl?: string | false }> {
  if (!transporter) {
    const message = "Email service is not properly configured. Email not sent.";
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
