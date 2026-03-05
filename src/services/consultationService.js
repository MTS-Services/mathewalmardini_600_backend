const crypto = require('crypto');
const emailService = require('./emailService');
const { getConsultationEmailTemplate, getConfirmationEmailTemplate } = require('./emailTemplates');

// In-memory store for confirmation tokens (In production, use database)
const consultationTokens = new Map();

class ConsultationService {
  // Generate unique token for consultation
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store consultation data with token
  storeConsultation(token, formData) {
    console.log('--- Storing consultation with token ---');
    console.log('Token:', token.substring(0, 10) + '...');
    console.log('Data stored for:', formData.name);
    
    // Store with 24 hour expiry
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    consultationTokens.set(token, {
      formData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiryTime).toISOString(),
      confirmed: false
    });
  }

  // Get consultation by token
  getConsultation(token) {
    const consultation = consultationTokens.get(token);
    
    if (!consultation) {
      console.log('❌ Token not found:', token.substring(0, 10) + '...');
      return null;
    }

    // Check if expired
    if (Date.now() > new Date(consultation.expiresAt).getTime()) {
      console.log('❌ Token expired:', token.substring(0, 10) + '...');
      consultationTokens.delete(token);
      return null;
    }

    return consultation;
  }

  // Send confirmation email to user (Step 1)
  async sendConfirmationEmail(formData, confirmLink) {
    console.log('\n===== Sending Confirmation Email to User =====');
    console.log('User Email:', formData.email);
    console.log('Confirmation Link:', confirmLink);
    console.log('=============================================\n');

    try {
      console.log('--- Sending confirmation email ---');
      const confirmationHTML = getConfirmationEmailTemplate(formData.name, confirmLink);
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
    const { formData } = consultation;
    
    console.log('\n===== Sending Consultation Email to Admin =====');
    console.log('Admin Email:', process.env.EMAIL_RECIPIENT);
    console.log('From:', formData.name);
    console.log('==================================================\n');

    try {
      console.log('--- Sending consultation to admin ---');
      const adminEmailHTML = getConsultationEmailTemplate(formData);
      const result = await emailService.sendEmail(
        process.env.EMAIL_RECIPIENT,
        `📩 New Confirmed Consultation Request from ${formData.name}`,
        `New consultation request from ${formData.name} (${formData.email})`,
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

  // Mark consultation as confirmed
  confirmConsultation(token) {
    const consultation = this.getConsultation(token);
    
    if (consultation) {
      consultation.confirmed = true;
      consultation.confirmedAt = new Date().toISOString();
      console.log('✅ Consultation confirmed at:', consultation.confirmedAt);
      return true;
    }
    
    return false;
  }
}

module.exports = new ConsultationService();
