const consultationService = require("../services/consultationService");

class ConsultationController {
  async bookConsultation(req, res) {
    console.log("\n===== New Consultation Booking Request =====");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Request Headers:", req.headers);
    console.log("==========================================\n");

    try {
      const {
        name,
        email,
        phone,
        company,
        postcode,
        propertyType,
        service,
        budget,
        message,
        preferredDate,
        preferredTime,
        timeline,
        timelineDetails,
      } = req.body;

      // Validate required fields (postcode, propertyType, timeline, timelineDetails, and message are optional)
      if (
        !name ||
        !email ||
        !phone ||
        !company ||
        !service ||
        !budget ||
        !preferredTime
      ) {
        console.log("Validation Failed: Missing required fields");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Phone:", phone);
        console.log("Company:", company);
        console.log("Service:", service);
        console.log("Budget:", budget);
        console.log("Preferred Time:", preferredTime);

        return res.status(400).json({
          success: false,
          message:
            "All fields are required: name, email, phone, company, service, budget, and preferredTime",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("Validation Failed: Invalid email format");

        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      console.log("Validation passed. Preparing to send confirmation email...");

      // Prepare form data
      const formData = {
        name,
        email,
        phone,
        company,
        postcode: postcode || "",
        propertyType: propertyType || "",
        service,
        budget,
        message: message || "",
        preferredDate: preferredDate || "",
        preferredTime,
        timeline: timeline || "",
        timelineDetails: timelineDetails || "",
      };

      console.log("Form data prepared:", formData);

      // Step 1: Generate token and store consultation
      console.log("\n--- Step 1: Generate Token ---");
      const token = consultationService.generateToken();
      await consultationService.storeConsultation(token, formData);

      // Step 2: Create confirmation link (direct to backend API)
      const backendUrl = process.env.BACKEND_URL;
      const confirmLink = `${backendUrl}/api/confirm/${token}`;
      console.log("Confirmation link:", confirmLink);

      // Step 3: Send confirmation email to user
      console.log("\n--- Step 2: Send Confirmation Email to User ---");
      const emailResult = await consultationService.sendConfirmationEmail(
        formData,
        confirmLink,
      );

      console.log("Consultation controller: Confirmation email sent to user");
      console.log("\n===== RESPONSE DEBUG =====");
      console.log("token variable:", typeof token);
      console.log("token length:", token?.length);
      console.log("token value:", token);
      console.log("confirmLink:", confirmLink);
      console.log("========================\n");

      const responseData = {
        success: true,
        message:
          "Confirmation email sent! Please check your inbox and click the confirmation link.",
        step: 1,
        data: {
          token: token,
          confirmLink: confirmLink,
          userEmail: email,
        },
      };

      console.log(
        "About to send response:",
        JSON.stringify(responseData, null, 2),
      );
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Consultation controller error:", error.message);
      console.error("Stack trace:", error.stack);

      res.status(500).json({
        success: false,
        message: "Failed to process consultation request",
        error: error.message,
      });
    }
  }

  async confirmConsultation(req, res) {
    console.log("\n===== Confirming Consultation =====");
    console.log("Token:", req.params.token.substring(0, 10) + "...");
    console.log("====================================\n");

    try {
      const { token } = req.params;

      if (!token) {
        console.log("❌ No token provided");
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirmation Error</title>
              <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h2 { color: #d32f2f; margin-top: 0; }
                p { color: #666; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>❌ Confirmation Error</h2>
                <p>Token is required to confirm your consultation.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Step 1: Get consultation by token
      console.log("--- Step 1: Retrieving Consultation ---");
      const consultation = await consultationService.getConsultation(token);

      if (!consultation) {
        console.log("❌ Invalid or expired token");
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Link Expired</title>
              <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h2 { color: #d32f2f; margin-top: 0; }
                p { color: #666; line-height: 1.6; }
                a { color: #1976d2; text-decoration: none; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>❌ Link Expired</h2>
                <p>This confirmation link has expired or is invalid.</p>
                <p>Please submit the consultation form again to receive a new confirmation link.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Step 2: Confirm the consultation (checks for duplicates)
      console.log("--- Step 2: Marking as Confirmed ---");
      const confirmResult = await consultationService.confirmConsultation(token);

      if (!confirmResult.success) {
        // Check if already confirmed
        if (confirmResult.error === 'already_confirmed') {
          console.log("⚠️  Already confirmed, redirecting to homepage...");
          return res.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Already Confirmed</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    margin: 0; 
                    padding: 20px; 
                    min-height: 100vh; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                  }
                  .container { 
                    max-width: 500px; 
                    background: white; 
                    padding: 50px; 
                    border-radius: 12px; 
                    text-align: center; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                  }
                  h2 { color: #ff9800; margin-top: 0; font-size: 28px; }
                  p { color: #666; line-height: 1.8; font-size: 16px; margin: 20px 0; }
                  .spinner { 
                    width: 50px; 
                    height: 50px; 
                    border: 4px solid #f3f3f3; 
                    border-top: 4px solid #667eea; 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite; 
                    margin: 30px auto; 
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                </style>
                <script>
                  setTimeout(function() {
                    window.location.href = '${process.env.FRONTEND_URL || 'https://www.b-spoke.com.au'}';
                  }, 2000);
                </script>
              </head>
              <body>
                <div class="container">
                  <h2>⚠️ Already Confirmed</h2>
                  <p>You have already confirmed this consultation request.</p>
                  <p>We will contact you soon!</p>
                  <div class="spinner"></div>
                  <p style="font-size: 14px; color: #999;">Redirecting to homepage...</p>
                </div>
              </body>
            </html>
          `);
        }

        console.log("❌ Failed to confirm");
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirmation Failed</title>
              <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h2 { color: #d32f2f; margin-top: 0; }
                p { color: #666; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>❌ Confirmation Failed</h2>
                <p>Could not confirm your consultation. Please try again.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Step 3: Send email to admin (in background - don't await)
      console.log("\n--- Step 3: Sending to Admin ---");
      consultationService
        .sendConsultationToAdmin(confirmResult.consultation)
        .then(() => {
          console.log("✅ Admin email sent successfully!");
        })
        .catch((error) => {
          console.error(
            "⚠️ Failed to send admin email (but consultation confirmed):",
            error.message,
          );
        });

      console.log("✅ Consultation confirmed!");

      // Return HTML loading page with redirect
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmation Successful</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                margin: 0; 
                padding: 20px; 
                min-height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
              }
              .container { 
                max-width: 500px; 
                background: white; 
                padding: 50px; 
                border-radius: 12px; 
                text-align: center; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
              }
              h1 { color: #4caf50; margin-top: 0; font-size: 36px; }
              h2 { color: #333; font-size: 24px; margin: 20px 0; }
              p { color: #666; line-height: 1.8; font-size: 16px; margin: 20px 0; }
              .checkmark { font-size: 60px; margin: 20px 0; animation: scaleIn 0.5s ease-in-out; }
              @keyframes scaleIn {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
              }
              .spinner { 
                width: 50px; 
                height: 50px; 
                border: 4px solid #f3f3f3; 
                border-top: 4px solid #667eea; 
                border-radius: 50%; 
                animation: spin 1s linear infinite; 
                margin: 30px auto; 
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
            <script>
              setTimeout(function() {
                window.location.href = '${process.env.FRONTEND_URL || 'https://www.b-spoke.com.au'}';
              }, 2000);
            </script>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">✅</div>
              <h1>Success!</h1>
              <h2>Your Consultation is Confirmed</h2>
              <p>Thank you for confirming your consultation request!</p>
              <p>Our team will contact you soon.</p>
              <div class="spinner"></div>
              <p style="font-size: 14px; color: #999;">Redirecting to homepage...</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Confirm consultation error:", error.message);
      console.error("Stack trace:", error.stack);

      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #d32f2f; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>❌ Server Error</h2>
              <p>Failed to confirm consultation. Please try again later.</p>
              <p style="font-size: 12px; color: #999;">${error.message}</p>
            </div>
          </body>
        </html>
      `);
    }
  }
}

module.exports = new ConsultationController();
