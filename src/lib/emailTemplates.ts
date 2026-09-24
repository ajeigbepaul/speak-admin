function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Speak</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;vertical-align:middle;">
                          <span style="font-size:22px;line-height:48px;">💬</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Speak</span><br/>
                          <span style="color:rgba(255,255,255,0.75);font-size:12px;">Mental Health Support Platform</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 48px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                This email was sent by Speak Admin.<br/>
                If you didn't expect this invitation, you can safely ignore this email.<br/>
                &copy; ${new Date().getFullYear()} Speak. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function infoBox(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:8px;margin:8px 0;">
    <tr>
      <td style="padding:12px 16px;">
        <span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</span><br/>
        <span style="color:#1f2937;font-size:15px;font-weight:600;font-family:monospace;">${value}</span>
      </td>
    </tr>
  </table>`;
}

export function buildAdminInviteEmail(name: string, role: string, setPasswordLink: string, tempPassword: string): string {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const content = `
    <h2 style="margin:0 0 8px 0;color:#111827;font-size:22px;font-weight:700;">You're invited to Speak Admin 🎉</h2>
    <p style="margin:0 0 24px 0;color:#6b7280;font-size:15px;line-height:1.6;">
      Hi <strong style="color:#111827;">${name}</strong>, you've been added to the Speak Admin platform as a <strong style="color:#4f46e5;">${roleLabel}</strong>.
      Click the button below to set your password and get started.
    </p>

    ${ctaButton("Set Your Password →", setPasswordLink)}

    <p style="margin:0 0 12px 0;color:#6b7280;font-size:13px;">Or copy this link into your browser:</p>
    <p style="margin:0 0 24px 0;word-break:break-all;color:#4f46e5;font-size:12px;font-family:monospace;background:#f5f3ff;padding:12px;border-radius:6px;border-left:3px solid #7c3aed;">${setPasswordLink}</p>

    <p style="margin:0 0 8px 0;color:#374151;font-size:14px;font-weight:600;">Your temporary credentials:</p>
    ${infoBox("Email", name)}
    ${infoBox("Temporary Password", tempPassword)}

    <p style="margin:24px 0 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
      For security, you'll be asked to create a new password on first login. This link expires after use.
    </p>
  `;
  return baseTemplate(content);
}

export function buildCounselorInviteEmail(email: string, setPasswordLink: string, tempPassword: string): string {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#111827;font-size:22px;font-weight:700;">You're invited to join Speak as a Counselor 🌿</h2>
    <p style="margin:0 0 24px 0;color:#6b7280;font-size:15px;line-height:1.6;">
      Hi there! We'd love to have you on the Speak platform as a <strong style="color:#4f46e5;">Counselor</strong>.
      Click the button below to set your password and complete your profile.
    </p>

    ${ctaButton("Set Password & Complete Profile →", setPasswordLink)}

    <p style="margin:0 0 12px 0;color:#6b7280;font-size:13px;">Or copy this link into your browser:</p>
    <p style="margin:0 0 24px 0;word-break:break-all;color:#4f46e5;font-size:12px;font-family:monospace;background:#f5f3ff;padding:12px;border-radius:6px;border-left:3px solid #7c3aed;">${setPasswordLink}</p>

    <p style="margin:0 0 8px 0;color:#374151;font-size:14px;font-weight:600;">Your login email:</p>
    ${infoBox("Email", email)}
    ${infoBox("Temporary Password (for reference)", tempPassword)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin:24px 0 0 0;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px 0;color:#166534;font-size:13px;font-weight:600;">What happens next?</p>
          <p style="margin:0;color:#15803d;font-size:13px;line-height:1.7;">
            1. Set your password using the link above<br/>
            2. Complete your counselor profile<br/>
            3. Our team will review and verify your account<br/>
            4. You'll receive an email once you're approved
          </p>
        </td>
      </tr>
    </table>
  `;
  return baseTemplate(content);
}

export function buildApprovalEmail(name: string, email: string): string {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#111827;font-size:22px;font-weight:700;">You're approved! Welcome to Speak 🎉</h2>
    <p style="margin:0 0 24px 0;color:#6b7280;font-size:15px;line-height:1.6;">
      Hi <strong style="color:#111827;">${name || 'there'}</strong>, great news — your counselor application has been reviewed and <strong style="color:#16a34a;">approved</strong>!
      You can now log in to the Speak app and start supporting users.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px 0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px 0;color:#166534;font-size:14px;font-weight:700;">Next steps to get started:</p>
          <p style="margin:0;color:#15803d;font-size:14px;line-height:2;">
            1. Download the <strong>Speak</strong> mobile app on your device<br/>
            2. Open the app and tap <strong>Log In</strong><br/>
            3. Enter your email: <strong>${email}</strong><br/>
            4. Use the password you set during profile setup<br/>
            5. You're in — start making a difference!
          </p>
        </td>
      </tr>
    </table>

    ${infoBox("Your Login Email", email)}

    <p style="margin:24px 0 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
      If you have any questions or need help getting started, please reach out to the Speak admin team.
    </p>
  `;
  return baseTemplate(content);
}
