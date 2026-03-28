# Email Open Tracking & Auto Follow-up

## Overview
This feature tracks when recipients open confirmation emails and automatically sends a follow-up reminder if they haven't confirmed yet.

## How It Works

### 1. **Email Tracking Pixel**
- A 1x1 transparent GIF image is embedded at the bottom of confirmation emails
- When the recipient opens the email, the image loads from: `/api/track-open/:token`
- The server logs this as an "email opened" event in the database

### 2. **Database Tracking Fields**
```javascript
emailOpened: Boolean       // Has the email been opened?
emailOpenedAt: DateTime    // When was it opened?
followUpSent: Boolean      // Has follow-up been sent?
followUpSentAt: DateTime   // When was follow-up sent?
```

### 3. **Auto Follow-up Logic**
When an email is opened:
1. Check if `emailOpened` is false (first time opening)
2. If yes, mark as opened and check if follow-up should be sent
3. Send follow-up if:
   - `followUpSent` is false
   - `confirmed` is false (user hasn't confirmed yet)

### 4. **Follow-up Email**
- Friendly reminder with the confirmation link
- Orange theme to differentiate from initial email
- Only sent once per consultation request

## API Endpoints

### Track Email Open
```
GET /api/track-open/:token
```
- Returns: 1x1 transparent GIF
- Side effect: Logs open, triggers follow-up if needed
- Always returns 200 (success or fail) to prevent email client errors

## Limitations

⚠️ **Important Notes:**
- **Image blocking**: Many email clients block images by default (Gmail, Outlook)
- **Privacy features**: Some clients pre-load images on servers, not user devices
- **Not 100% accurate**: Tracking may miss opens or record false positives
- **GDPR/Privacy**: Ensure compliance if collecting personal data

## Best Practices

1. **Timing**: Follow-up is sent immediately when email is opened (not clicked)
2. **Once only**: Follow-up is sent only once per consultation
3. **No tracking on follow-up**: Follow-up emails don't include tracking pixels to avoid loops
4. **Graceful degradation**: System works fine even if tracking fails

## Testing

### Test Tracking Locally
```bash
# Start server
npm start

# In another terminal, simulate email open
curl http://localhost:3000/api/track-open/YOUR_TOKEN_HERE
```

### Check Database
```javascript
// Check if tracking worked
const consultation = await prisma.consultation.findUnique({
  where: { token: 'YOUR_TOKEN' }
});

console.log('Email Opened:', consultation.emailOpened);
console.log('Follow-up Sent:', consultation.followUpSent);
```

## Production Considerations

1. **Deploy code changes** to production server
2. **Add EMAIL_FROM** environment variable
3. **Run database migration** or `npx prisma db push`
4. **Restart server** to load new code
5. **Test with real email** to verify tracking pixel loads

## Disabling Tracking

To disable tracking without removing code:
- Don't pass token to `getConfirmationEmailTemplate()` 
- Or remove tracking pixel from email template
- Existing database fields remain but won't be populated

## Privacy Notice

Consider adding to your email footer:
```
"We use email tracking to improve our service. 
Emails may contain a tracking pixel to confirm delivery."
```
