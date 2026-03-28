// Email template for consultation request (sent to admin/owner)
const getConsultationEmailTemplate = (formData) => {
  const {
    name,
    email,
    phone,
        address,
    service,
        bathroom,
    message,
    preferredDate,
    preferredTime
  } = formData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Consultation Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #205767; padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                New Consultation Request
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #f0f0f0; font-size: 14px;">
                                Someone wants to book a consultation with you!
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                Hello! 👋
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                You have received a new consultation booking request. Here are all the details:
                            </p>

                            <!-- Personal Information -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h2 style="margin: 0 0 20px 0; color: #205767; font-size: 20px; border-bottom: 2px solid #205767; padding-bottom: 10px;">
                                            👤 Personal Information
                                        </h2>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; width: 35%; vertical-align: top;">
                                                    Full Name:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    ${name || 'Not provided'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Email Address:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    <a href="mailto:${email}" style="color: #205767; text-decoration: none; font-weight: 600;">
                                                        ${email || 'Not provided'}
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Phone Number:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    <a href="tel:${phone}" style="color: #205767; text-decoration: none;">
                                                        ${phone || 'Not provided'}
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Address:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    ${address || 'Not provided'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Postcode:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    ${formData.postcode || 'Not provided'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Property Type:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    ${formData.propertyType || 'Not provided'}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Service Details -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #e7f3ff; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h2 style="margin: 0 0 20px 0; color: #205767; font-size: 20px; border-bottom: 2px solid #205767; padding-bottom: 10px;">
                                            💼 Service Requirements
                                        </h2>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; width: 35%; vertical-align: top;">
                                                    Service Interested In:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    <span style="background-color: #205767; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 14px;">
                                                        ${service || 'Not specified'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Number of bathrooms:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333; font-weight: 600;">
                                                    ${bathroom || 'Not specified'}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Scheduling Information -->
                            ${preferredTime || formData.timeline || formData.timelineDetails ? `
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #e8f1f4; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h2 style="margin: 0 0 20px 0; color: #205767; font-size: 20px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
                                            📅 Preferred Schedule
                                        </h2>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            ${formData.timeline ? `
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; width: 35%; vertical-align: top;">
                                                    Project Timeline:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333; font-weight: 600;">
                                                    ${formData.timeline === 'asap' ? '⚡ ASAP (As soon as possible)' : 
                                                      formData.timeline === 'next-2-3-months' || formData.timeline === '2-3-months' ? '📆 In the next 2-3 months' : 
                                                      formData.timeline === 'other' && formData.timelineDetails ? `🔄 ${formData.timelineDetails}` :
                                                      formData.timeline === 'other' ? '🔄 Other / Flexible' : 
                                                      formData.timeline}
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${preferredTime ? `
                                            <tr>
                                                <td style="padding: 10px 0; font-weight: bold; color: #555555; vertical-align: top;">
                                                    Preferred Time:
                                                </td>
                                                <td style="padding: 10px 0; color: #333333;">
                                                    ${preferredTime}
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <!-- Message Box -->
                            ${message ? `
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #d4edda; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 18px;">
                                            💬 Other Details:
                                        </h3>
                                        <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                                            <p style="margin: 0; color: #333333; line-height: 1.8; font-size: 15px;">
                                                ${message}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <!-- CTA Button (Outlook-compatible) -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                                <tr>
                                    <td align="center" bgcolor="#205767" style="border-radius: 6px;">
                                        <a href="mailto:${email}?subject=Re: Consultation Request from ${name}" target="_blank" style="display: inline-block; padding: 16px 45px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #205767;">
                                            Reply to ${name}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #163f4f; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ecf0f1;">
                                📧 Consultation Request • Received on ${new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #95a5a6;">
                                © ${new Date().getFullYear()} Your Company Name. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

// Auto-reply template for the user
const getAutoReplyTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Request Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #205767; padding: 40px 30px; text-align: center;">
                            <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                Request Received Successfully!
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #f0f0f0; font-size: 14px;">
                                Thank you for reaching out to us
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333; line-height: 1.6;">
                                Dear <strong>${userName}</strong>, 👋
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                Thank you for your interest in booking a consultation with us! We have successfully received your request and all the information you provided.
                            </p>
                            
                            <!-- What Happens Next -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #e8f1f4; border-left: 4px solid #205767; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="margin: 0 0 15px 0; color: #205767; font-size: 18px;">
                                            📋 What Happens Next?
                                        </h3>
                                        <ul style="margin: 0; padding-left: 20px; color: #333333; line-height: 1.8;">
                                            <li style="margin-bottom: 10px;">✓ Our team is reviewing your request</li>
                                            <li style="margin-bottom: 10px;">✓ You'll receive a confirmation email within <strong>24-48 hours</strong></li>
                                            <li style="margin-bottom: 10px;">✓ We'll contact you to schedule your consultation</li>
                                            <li>✓ We'll discuss your project requirements in detail</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- Contact Info -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; font-size: 15px; color: #333333;">
                                            <strong>Need immediate assistance?</strong>
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #666666;">
                                            Feel free to reply to this email or call us directly
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0 0; font-size: 14px; color: #666666; line-height: 1.6; text-align: center;">
                                We look forward to working with you! 🚀
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #163f4f; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ecf0f1;">
                                Best regards,<br>
                                <strong style="font-size: 16px;">Your Company Team</strong>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #95a5a6;">
                                © ${new Date().getFullYear()} Your Company Name. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

// Confirmation email template with link and tracking pixel
const getConfirmationEmailTemplate = (name, confirmLink, token) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const trackingPixel = token ? `${backendUrl}/api/track-open/${token}` : '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Request Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #205767; padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                Consultation Request Received
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #f0f0f0; font-size: 14px;">
                                We've got your request!
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333; line-height: 1.6;">
                                Dear <strong>${name}</strong>, 👋
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                Thank you for submitting your consultation request! We have received your details and our team will review them shortly.
                            </p>

                            <!-- Info Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #e8f1f4; border-radius: 8px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #205767;">
                                            <strong>ℹ️ What happens next?</strong>
                                        </p>
                                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333333;">
                                            <li style="margin-bottom: 8px;">Our team will reviews your request</li>
                                            <li style="margin-bottom: 8px;">We will be in touch with you soon</li>
                                            <li>We will contact you within 24-48 hours</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #163f4f; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ecf0f1;">
                                Need help? Reply to this email
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #95a5a6;">
                                © ${new Date().getFullYear()} B-Spoke. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
    <!-- Email tracking pixel -->
    ${token ? `<img src="${trackingPixel}" width="1" height="1" alt="" style="display:block;" />` : ''}
</body>
</html>
  `;
};

module.exports = {
  getConsultationEmailTemplate,
  getAutoReplyTemplate,
  getConfirmationEmailTemplate
};
