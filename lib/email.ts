import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = 'noreply@rentanddrive.net'
const SUPPORT_EMAIL = 'support@rentanddrive.net'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentanddrive.net'

interface WelcomeEmailParams {
  to: string
  firstName?: string
  role: 'host' | 'renter'
}

interface VerificationEmailParams {
  to: string
  firstName?: string
  verificationLink: string
  role: 'host' | 'renter'
}

export async function sendWelcomeEmail({ to, firstName, role }: WelcomeEmailParams) {
  const isHost = role === 'host'
  const memberType = isHost ? 'Founding RAD Host' : 'RAD Renter'
  const greeting = firstName ? `Hey ${firstName}` : 'Hey there'
  const dashboardLink = isHost ? `${SITE_URL}/host/dashboard` : `${SITE_URL}/renter/suite`
  
  const subject = isHost 
    ? 'Welcome to RAD - You\'re a Founding Host!' 
    : 'Welcome to Rent and Drive!'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F2EC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F2EC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1C1F1A; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #F5F2EC; font-size: 28px; font-weight: 400; font-family: Georgia, serif;">
                Rent and Drive
              </h1>
              <p style="margin: 8px 0 0; color: #C4813A; font-size: 14px; letter-spacing: 1px;">
                ${memberType.toUpperCase()}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #1C1F1A; font-size: 24px; font-family: Georgia, serif;">
                ${greeting},
              </h2>
              
              <p style="margin: 0 0 24px; color: #4A5A4A; font-size: 16px; line-height: 1.6;">
                ${isHost 
                  ? 'Welcome to Rent and Drive! As a <strong style="color: #2D4A2D;">Founding RAD Host</strong>, you\'re part of an exclusive group shaping the future of peer-to-peer vehicle rentals in Reno, Tahoe, Moab, and Bozeman.'
                  : 'Welcome to Rent and Drive! As a <strong style="color: #2D4A2D;">RAD Renter</strong>, you now have access to unique vehicles from local hosts - no rental counters, no middleman fees, just great rides for your adventures.'
                }
              </p>
              
              ${isHost ? `
              <div style="background-color: #2D4A2D; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #F5F2EC; font-size: 18px;">Founding Host Benefits</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #F5F2EC; font-size: 14px; line-height: 1.8;">
                  <li>Only <strong>10% commission</strong> - the lowest in the industry</li>
                  <li>Eagle Eye verification system for renters</li>
                  <li>CarFidelity protection on every trip</li>
                  <li>Priority support as a founding member</li>
                </ul>
              </div>
              ` : `
              <div style="background-color: #F5F2EC; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #E5E2DC;">
                <h3 style="margin: 0 0 12px; color: #1C1F1A; font-size: 18px;">What You Get</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4A5A4A; font-size: 14px; line-height: 1.8;">
                  <li>Save <strong>10% vs Turo</strong> - book direct, pay less</li>
                  <li>Unique vehicles from local hosts</li>
                  <li>Adventure gear add-ons available</li>
                  <li>Insurance included on every trip</li>
                </ul>
              </div>
              `}
              
              <p style="margin: 24px 0; text-align: center;">
                <a href="${dashboardLink}" style="display: inline-block; background-color: #C4813A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
                  ${isHost ? 'Go to Host Dashboard' : 'Browse Vehicles'}
                </a>
              </p>
              
              <p style="margin: 24px 0 0; color: #4A5A4A; font-size: 14px; line-height: 1.6;">
                Questions? Our team is here to help. Just reply to this email or reach out at <a href="mailto:${SUPPORT_EMAIL}" style="color: #C4813A;">${SUPPORT_EMAIL}</a>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1C1F1A; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: #A8B5A8; font-size: 12px;">
                Rent and Drive - Reno | Tahoe | Moab | Bozeman
              </p>
              <p style="margin: 0; color: #6B7B6B; font-size: 12px;">
                <a href="${SITE_URL}" style="color: #6B7B6B;">rentanddrive.net</a> | 
                <a href="mailto:${SUPPORT_EMAIL}" style="color: #6B7B6B;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const textContent = `
${greeting},

Welcome to Rent and Drive! You're now a ${memberType}.

${isHost 
  ? `As a Founding RAD Host, you're part of an exclusive group shaping the future of peer-to-peer vehicle rentals in Reno, Tahoe, Moab, and Bozeman.

FOUNDING HOST BENEFITS:
- Only 10% commission - the lowest in the industry
- Eagle Eye verification system for renters
- CarFidelity protection on every trip
- Priority support as a founding member`
  : `As a RAD Renter, you now have access to unique vehicles from local hosts - no rental counters, no middleman fees, just great rides for your adventures.

WHAT YOU GET:
- Save 10% vs Turo - book direct, pay less
- Unique vehicles from local hosts
- Adventure gear add-ons available
- Insurance included on every trip`
}

Get started: ${dashboardLink}

Questions? Reach out at ${SUPPORT_EMAIL}

---
Rent and Drive - Reno | Tahoe | Moab | Bozeman
${SITE_URL}
`

  try {
    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL,
        name: 'Rent and Drive'
      },
      replyTo: SUPPORT_EMAIL,
      subject,
      text: textContent,
      html: htmlContent,
    })
    console.log(`[v0] Welcome email sent to ${to} as ${role}`)
    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to send welcome email:', error)
    return { success: false, error }
  }
}

export async function sendVerificationEmail({ to, firstName, verificationLink, role }: VerificationEmailParams) {
  const memberType = role === 'host' ? 'Founding RAD Host' : 'RAD Renter'
  const greeting = firstName ? `Hey ${firstName}` : 'Hey there'
  
  const subject = 'Verify your email - Rent and Drive'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F2EC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F2EC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1C1F1A; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #F5F2EC; font-size: 28px; font-weight: 400; font-family: Georgia, serif;">
                Rent and Drive
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <h2 style="margin: 0 0 16px; color: #1C1F1A; font-size: 24px; font-family: Georgia, serif;">
                Verify your email
              </h2>
              
              <p style="margin: 0 0 24px; color: #4A5A4A; font-size: 16px; line-height: 1.6;">
                ${greeting}, you're almost ready to join as a <strong style="color: #2D4A2D;">${memberType}</strong>. 
                Click the button below to verify your email address.
              </p>
              
              <p style="margin: 24px 0;">
                <a href="${verificationLink}" style="display: inline-block; background-color: #C4813A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
                  Verify Email Address
                </a>
              </p>
              
              <p style="margin: 24px 0 0; color: #6B7B6B; font-size: 14px; line-height: 1.6;">
                This link expires in 24 hours. If you didn't create an account with Rent and Drive, you can safely ignore this email.
              </p>
              
              <p style="margin: 16px 0 0; color: #6B7B6B; font-size: 12px;">
                Can't click the button? Copy and paste this link:<br>
                <a href="${verificationLink}" style="color: #C4813A; word-break: break-all;">${verificationLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1C1F1A; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: #A8B5A8; font-size: 12px;">
                Rent and Drive - Reno | Tahoe | Moab | Bozeman
              </p>
              <p style="margin: 0; color: #6B7B6B; font-size: 12px;">
                <a href="${SITE_URL}" style="color: #6B7B6B;">rentanddrive.net</a> | 
                <a href="mailto:${SUPPORT_EMAIL}" style="color: #6B7B6B;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const textContent = `
${greeting},

Verify your email to join Rent and Drive as a ${memberType}.

Click this link to verify your email:
${verificationLink}

This link expires in 24 hours.

If you didn't create an account with Rent and Drive, you can safely ignore this email.

---
Rent and Drive - Reno | Tahoe | Moab | Bozeman
${SITE_URL} | ${SUPPORT_EMAIL}
`

  try {
    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL,
        name: 'Rent and Drive'
      },
      replyTo: SUPPORT_EMAIL,
      subject,
      text: textContent,
      html: htmlContent,
    })
    console.log(`[v0] Verification email sent to ${to}`)
    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to send verification email:', error)
    return { success: false, error }
  }
}
