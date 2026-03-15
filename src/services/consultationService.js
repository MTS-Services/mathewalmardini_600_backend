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
        '✅ Consultation Request Received - B-Spoke',
        `Hi ${formData.name}, we have received your consultation request and will be in touch shortly.`,
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
        
        // Send consultation details to admin if not already sent
        const shouldSendToAdmin = !updated.followUpSent;

        return {
          success: true,
          consultation: updated,
          shouldSendToAdmin
        };
      }

      return { success: true, alreadyTracked: true };
    } catch (error) {
      console.error('❌ Failed to track email open:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send consultation details to admin when email is opened
  async sendDetailsToAdminOnOpen(consultation) {
    console.log('\n===== Sending Consultation Details to Admin (Email Opened) =====');
    console.log('Admin Email:', process.env.EMAIL_RECIPIENT);
    console.log('From User:', consultation.name);
    console.log('================================================================\n');

    try {
      // Mark as sent first to prevent duplicates
      await prisma.consultation.update({
        where: { token: consultation.token },
        data: {
          followUpSent: true,
          followUpSentAt: new Date()
        }
      });

      const adminEmailHTML = getConsultationEmailTemplate(consultation);
      const result = await emailService.sendEmail(
        process.env.EMAIL_RECIPIENT,
        `📩 New Consultation Request from ${consultation.name} (Email Opened)`,
        `New consultation request from ${consultation.name} (${consultation.email}) - User opened the confirmation email.`,
        adminEmailHTML
      );

      console.log('✅ Admin email sent successfully (triggered by email open)!');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Failed to send admin email on open:', error.message);
      throw error;
    }
  }
}

module.exports = new ConsultationService();
