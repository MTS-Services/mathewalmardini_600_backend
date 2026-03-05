# Consultation Booking Server

Simple Express.js server with two-step email confirmation flow for handling consultation booking requests.

## 🔄 How It Works

### Step 1: User Submits Form
User fills consultation form → Server sends **confirmation email** with link

### Step 2: User Clicks Link
User clicks link in email → Server sends **consultation details to admin**

---

## 📋 API Endpoints

```
├── server.js                          # Main server file
├── src/
│   ├── routes/
│   │   └── consultationRoutes.js     # Consultation routes
│   ├── controllers/
│   │   └── consultationController.js # Consultation controller
│   └── services/
│       ├── consultationService.js    # Consultation service
│       ├── emailService.js           # Email service (Nodemailer)
│       └── emailTemplates.js         # Email HTML templates
├── .env                              # Environment variables
├── .gitignore                        # Git ignore file
└── package.json                      # Project dependencies
```

## Setup

### 1. Configure Gmail App Password

1. Go to your Google Account → Security
2. Enable 2-Factor Authentication
3. Security → App passwords
4. Generate password for "Mail"
5. Copy the 16-character password

### 2. Configure Environment Variables

Edit `.env` file:

```env
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 3. Install and Start

```bash
npm install
npm start
```

Server runs on http://localhost:5000

## API Endpoint

## API Endpoints

### 1. Book Consultation (Step 1)
**POST** `/api/book-consultation`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "service": "Web Development",
  "budget": "$5000-$10000",
  "message": "I need a website",
  "preferredDate": "2026-03-20",
  "preferredTime": "2:00 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmation email sent! Please check your inbox and click the confirmation link.",
  "data": {
    "token": "a1b2c3d4e...",
    "userEmail": "john@example.com"
  }
}
```

### 2. Confirm Consultation (Step 2)
**GET** `/api/confirm/:token`

User clicks this link from their email. Server:
1. Verifies token
2. Sends consultation to admin
3. Returns success message

**Response:**
```json
{
  "success": true,
  "message": "✅ Email sent to admin! We will contact you soon.",
  "data": {
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "confirmedAt": "2026-03-05T10:30:00.000Z"
  }
}
```

## Project Structure

## Frontend Integration

```javascript
const response = await fetch('http://localhost:5000/api/book-consultation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },**Two-step confirmation** - User confirms before admin is notified
- ✓ **Token-based** - Unique 32-byte tokens per consultation
- ✓ **24-hour expiry** - Tokens expire after 24 hours for security
- ✓ Beautiful HTML email templates
- ✓ Comprehensive console logging
- ✓ CORS enabled
- ✓ No authentication (as requested)
- ✓ Clean modular architecture (src folder)

## 📧 Email Flow

**Email 1 (Step 1):** Confirmation email to user
- Beautiful design with confirmation button
- Unique token in link
- 24-hour expiry warning
- What happens next info

**Email 2 (Step 2):** Consultation details to admin
- Complete consultation information
- User contact details
- All preferences and requirements
- Service and budget info

## Token Security

- Tokens are unique (crypto.randomBytes)
- Expire after 24 hours
- Case-sensitive
- Can only be used once
- Automatically cleaned up if expired
    message: 'I need a website'
  }),
});

const data = await response.json();
console.log(data);
```

## Features

- ✓ Clean modular architecture (src folder structure)
- ✓ Proper separation: Routes → Controllers → Services
- ✓ Beautiful HTML email templates
- ✓ Automatic dual email sending (admin + user)
- ✓ Comprehensive console logging
- ✓ CORS enabled
- ✓ No authentication (as requested)
- ✓ Gmail integration with Nodemailer

## Console Logging

All operations logged to console:
- Server startup info
- Request details
- Email sending process
- Success/error messages
- Validation results
