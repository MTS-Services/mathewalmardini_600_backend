/**
 * Test Email Tracking Flow
 * 
 * This script demonstrates the email tracking and follow-up flow
 */

require('dotenv').config();
const consultationService = require('./src/services/consultationService');

async function testEmailTracking() {
  console.log('\n===========================================');
  console.log('EMAIL TRACKING & FOLLOW-UP TEST');
  console.log('===========================================\n');

  // Test data
  const formData = {
    name: 'Test User',
    email: 'shariarhosain131529@gmail.com',
    phone: '1234567890',
    address: 'Test Address',
    postcode: '1234',
    propertyType: 'free-standing',
    service: 'Bathroom Renovation',
    bathroom: '2',
    message: 'This is a test',
    preferredDate: '',
    preferredTime: '9:00 AM',
    timeline: 'asap',
    timelineDetails: ''
  };

  try {
    // Step 1: Create consultation
    console.log('📝 Step 1: Creating consultation...');
    const token = consultationService.generateToken();
    await consultationService.storeConsultation(token, formData);
    console.log('✅ Consultation created with token:', token.substring(0, 10) + '...\n');

    // Step 2: Send confirmation email
    console.log('📧 Step 2: Sending confirmation email...');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const confirmLink = `${backendUrl}/api/confirm/${token}`;
    await consultationService.sendConfirmationEmail(formData, confirmLink, token);
    console.log('✅ Confirmation email sent!\n');

    console.log('===========================================');
    console.log('NEXT STEPS TO TEST:');
    console.log('===========================================');
    console.log('1. Check email inbox for confirmation email');
    console.log('2. Open the email (loads tracking pixel)');
    console.log('3. Watch server console for tracking logs');
    console.log('4. If you DON\'T click confirm, you should get a follow-up email');
    console.log('\nOr simulate tracking by visiting:');
    console.log(`   ${backendUrl}/api/track-open/${token}`);
    console.log('\n===========================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailTracking();
