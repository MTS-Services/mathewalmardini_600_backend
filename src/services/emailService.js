const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('Initializing Email Service...');
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('Email transporter configured with SMTP');
  }

  async sendEmail(to, subject, text, html) {
    console.log('===== Sending Email =====');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('HTML:', html ? 'HTML content provided' : 'No HTML content');

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text,
        html: html
      };

      console.log('Mail options prepared:', mailOptions);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
      console.log('========================');
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('===== Email Sending Failed =====');
      console.error('Error:', error.message);
      console.error('Full error:', error);
      console.error('================================');
      
      throw error;
    }
  }
}

module.exports = new EmailService();
