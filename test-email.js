require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('===================================');
  console.log('Email Test Configuration');
  console.log('===================================');
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('SMTP Secure:', process.env.SMTP_SECURE);
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
  console.log('Test Recipient:', 'shariarhosain131529@gmail.com');
  console.log('===================================\n');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify connection
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully!\n');
  } catch (error) {
    console.error('✗ SMTP connection failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }

  // Send test email
  try {
    console.log('Sending test email...');
    
    const mailOptions = {
      from: 'info@b-spoke.com.au',
      to: 'shariarhosain131529@gmail.com',
      subject: 'Test Email from B-Spoke - Mailgun SMTP',
      text: 'This is a test email sent via Mailgun SMTP to verify the email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Test Email - B-Spoke</h2>
          <p>This is a test email sent via <strong>Mailgun SMTP</strong> to verify the email configuration is working correctly.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            <strong>SMTP Configuration:</strong><br>
            Host: ${process.env.SMTP_HOST}<br>
            Port: ${process.env.SMTP_PORT}<br>
            From: info@b-spoke.com.au
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Sent on: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✓ Email sent successfully!\n');
    console.log('===================================');
    console.log('Email Details:');
    console.log('===================================');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('===================================');
    
  } catch (error) {
    console.error('✗ Email sending failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEmail();
