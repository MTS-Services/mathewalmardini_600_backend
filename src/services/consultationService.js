const crypto = require('crypto');
const prisma = require('../config/database');
const emailService = require('./emailService');
const { getConsultationEmailTemplate, getConfirmationEmailTemplate } = require('./emailTemplates');

class ConsultationService {
  // Generate unique token for consultation
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store consultation data with token in database
  async storeConsultation(token, formData) {
    console.log('--- Storing consultation in database ---');
    console.log('Token:', token.substring(0, 10) + '...');
    console.log('Data stored for:', formData.name);
    
    try {
      // Store with 24 hour expiry
      const expiryTime = new Date(Date.now() + (24 * 60 * 60 * 1000));
      
      const consultation = await prisma.consultation.create({
        data: {
          token,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          postcode: formData.postcode || '',
          propertyType: formData.propertyType || '',
          service: formData.service,
          bathroom: formData.bathroom,
          message: formData.message || '',
          preferredDate: formData.preferredDate || '',
          preferredTime: formData.preferredTime,
          timeline: formData.timeline || '',
          timelineDetails: formData.timelineDetails || '',
          confirmed: false,
          expiresAt: expiryTime
        }
      });
      
      console.log('✅ Consultation stored in database with ID:', consultation.id);
      return consultation;
    } catch (error) {
      console.error('❌ Failed to store consultation:', error.message);
      throw error;
    }
  }

  // Get consultation by token from database
  async getConsultation(token) {
    try {
      const consultation = await prisma.consultation.findUnique({
        where: { token }
      });
      
      if (!consultation) {
        console.log('❌ Token not found:', token.substring(0, 10) + '...');
        return null;
      }

      // Check if expired
      if (Date.now() > new Date(consultation.expiresAt).getTime()) {
        console.log('❌ Token expired:', token.substring(0, 10) + '...');
        return null;
      }

      return consultation;
    } catch (error) {
      console.error('❌ Failed to get consultation:', error.message);
      return null;
    }
  }

  // Send confirmation email to user (Step 1)
  async sendConfirmationEmail(formData, confirmLink, token) {
    console.log('\n===== Sending Confirmation Email to User =====');
    console.log('User Email:', formData.email);
    console.log('Confirmation Link:', confirmLink);
    console.log('=============================================\n');

    try {
      console.log('--- Sending confirmation email ---');
      const confirmationHTML = getConfirmationEmailTemplate(formData.name, confirmLink, token);
      const result = await emailService.sendEmail(
        formData.email,
        '📧 Confirm Your Consultation Request',
        `Hi ${formData.name}, please confirm your consultation request by clicking the link in the email.`,
        confirmationHTML
      );
      console.log('Confirmation email sent successfully!\n');
      
      return {
        success: true,
        message: 'Confirmation email sent to user',
        data: result
      };
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error.message);
      throw error;
    }
  }

  // Send consultation to admin (Step 2 - called when user confirms)
  async sendConsultationToAdmin(consultation) {
    console.log('\n===== Sending Consultation Email to Admin =====');
    console.log('Admin Email:', process.env.EMAIL_RECIPIENT);
    console.log('From:', consultation.name);
    console.log('==================================================\n');

    try {
      console.log('--- Sending consultation to admin ---');
      const adminEmailHTML = getConsultationEmailTemplate(consultation);
      const result = await emailService.sendEmail(
        process.env.EMAIL_RECIPIENT,
        `📩 New Confirmed Consultation Request from ${consultation.name}`,
        `New consultation request from ${consultation.name} (${consultation.email})`,
        adminEmailHTML
      );
      console.log('Admin email sent successfully!\n');
      
      return {
        success: true,
        message: 'Consultation sent to admin',
        data: result
      };
    } catch (error) {
      console.error('❌ Failed to send consultation to admin:', error.message);
      throw error;
    }
  }

  // Mark consultation as confirmed in database
  async confirmConsultation(token) {
    try {
      const consultation = await this.getConsultation(token);
      
      if (!consultation) {
        return { success: false, error: 'Token not found or expired' };
      }

      // Check if already confirmed
      if (consultation.confirmed) {
        console.log('⚠️  Consultation already confirmed at:', consultation.confirmedAt);
        return { success: false, error: 'already_confirmed', consultation };
      }
      
      // Mark as confirmed
      const updatedConsultation = await prisma.consultation.update({
        where: { token },
        data: {
          confirmed: true,
          confirmedAt: new Date()
        }
      });
      
      console.log('✅ Consultation confirmed at:', updatedConsultation.confirmedAt);
      return { success: true, consultation: updatedConsultation };
    } catch (error) {
      console.error('❌ Failed to confirm consultation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Track email open
  async trackEmailOpen(token) {
    try {
      const consultation = await prisma.consultation.findUnique({
        where: { token }
      });

      if (!consultation) {
        console.log('⚠️ Token not found for tracking:', token.substring(0, 10) + '...');
        return { success: false };
      }

      // Only track if not already tracked
      if (!consultation.emailOpened) {
        const updated = await prisma.consultation.update({
          where: { token },
          data: {
            emailOpened: true,
            emailOpenedAt: new Date()
          }
        });

        console.log('✅ Email opened tracked for:', consultation.name);
        
        // Check if we should send follow-up
        const shouldSendFollowUp = !updated.followUpSent && !updated.confirmed;

        return {
          success: true,
          consultation: updated,
          shouldSendFollowUp
        };
      }

      return { success: true, alreadyTracked: true };
    } catch (error) {
      console.error('❌ Failed to track email open:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send follow-up email
  async sendFollowUpEmail(consultation) {
    console.log('\n===== Sending Follow-Up Email =====');
    console.log('To:', consultation.email);
    console.log('Name:', consultation.name);
    console.log('====================================\n');

    try {
      // Mark as follow-up sent first to prevent duplicates
      await prisma.consultation.update({
        where: { token: consultation.token },
        data: {
          followUpSent: true,
          followUpSentAt: new Date()
        }
      });

      const backendUrl = process.env.BACKEND_URL;
      const confirmLink = `${backendUrl}/api/confirm/${consultation.token}`;

      const followUpHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder - Confirm Your Consultation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 50px; margin-bottom: 10px;">⏰</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                Friendly Reminder
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #fff3e0; font-size: 14px;">
                                Don't forget to confirm your consultation request
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                Hi ${consultation.name}, 👋
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                                We noticed you haven't confirmed your consultation request yet. This is a friendly reminder that your confirmation link is still active and waiting for you!
                            </p>

                            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #e65100; font-weight: bold;">⚡ Quick Action Required</p>
                                <p style="margin: 10px 0 0 0; color: #666;">Click the button below to confirm and we'll get back to you within 24-48 hours.</p>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${confirmLink}" style="display: inline-block; padding: 18px 60px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);">
                                            ✓ Confirm Now
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; font-size: 14px; color: #666; text-align: center;">
                                Or copy this link:<br>
                                <a href="${confirmLink}" style="color: #ff9800; word-break: break-all;">${confirmLink}</a>
                            </p>

                            <div style="background-color: #f5f5f5; padding: 20px; margin-top: 30px; border-radius: 8px; text-align: center;">
                                <p style="margin: 0; font-size: 13px; color: #999;">
                                    ⏱ Your confirmation link expires in 24 hours
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ecf0f1;">
                                Need help? Reply to this email
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #95a5a6;">
                                © ${new Date().getFullYear()} B-Spoke. All rights reserved.
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

      const result = await emailService.sendEmail(
        consultation.email,
        '⏰ Reminder: Confirm Your Consultation Request',
        `Hi ${consultation.name}, this is a friendly reminder to confirm your consultation request.`,
        followUpHTML
      );

      console.log('✅ Follow-up email sent successfully!');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Failed to send follow-up email:', error.message);
      throw error;
    }
  }
}

module.exports = new ConsultationService();
