"use server";

import { sendMail } from "./email";

export async function testEmailConfiguration(
  testEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sendMail({
      to: testEmail,
      subject: "Email Configuration Test - Speak Admin",
      text: `This is a test email to verify your email configuration is working correctly.

If you received this email, your email service is properly configured and ready to send real emails.

Test Details:
- Sent at: ${new Date().toISOString()}
- From: Speak Admin System
- Configuration: ✅ Working

You can now safely send invitations and other emails to real recipients.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">✅ Email Configuration Test Successful</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p><strong>If you received this email, your email service is properly configured and ready to send real emails.</strong></p>
          </div>
          
          <h3>Test Details:</h3>
          <ul>
            <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
            <li><strong>From:</strong> Speak Admin System</li>
            <li><strong>Configuration:</strong> ✅ Working</li>
          </ul>
          
          <p>You can now safely send invitations and other emails to real recipients.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated test email from your Speak Admin system.
          </p>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error("Test email failed:", error);
    return {
      success: false,
      message: `Test email failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
