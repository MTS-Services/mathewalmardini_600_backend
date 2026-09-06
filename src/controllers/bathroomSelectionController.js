const emailService = require("../services/emailService");
const {
  getBathroomSelectionEmailTemplate,
  getBathroomSelectionText,
} = require("../services/bathroomSelectionEmailTemplate");

class BathroomSelectionController {
  async submit(req, res) {
    console.log("\n===== Bathroom Selection Form Submission =====");

    try {
      const { project, categories, sendCopyToClient } = req.body;

      if (!project?.clientName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Full name is required",
        });
      }

      if (!project?.email?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(project.email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      if (!project?.phone?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone is required",
        });
      }

      const phoneDigits = String(project.phone).replace(/\D/g, "");
      if (!/^\d{10}$/.test(phoneDigits)) {
        return res.status(400).json({
          success: false,
          message: "Phone must be exactly 10 digits",
        });
      }

      if (!project?.projectAddress?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project address is required",
        });
      }

      const payload = {
        project: {
          clientName: project.clientName.trim(),
          email: project.email.trim(),
          phone: phoneDigits,
          projectAddress: project.projectAddress.trim(),
          bathroomType: project.bathroomType || "",
          bathroomTypeLabel:
            project.bathroomTypeLabel || project.bathroomType || "",
          bathroomTypeOther: project.bathroomTypeOther || "",
          rubbishRemoval: project.rubbishRemoval || "",
        },
        categories: Array.isArray(categories) ? categories : [],
      };

      const adminEmail = process.env.EMAIL_RECIPIENT;
      if (!adminEmail) {
        throw new Error("Admin email recipient is not configured");
      }

      const subject = `Bathroom Selection — ${payload.project.clientName} (${payload.project.bathroomTypeLabel})`;
      const html = getBathroomSelectionEmailTemplate(payload);
      const text = getBathroomSelectionText(payload);

      await emailService.sendEmail(adminEmail, subject, text, html);
      console.log("Bathroom selection sent to admin:", adminEmail);

      if (sendCopyToClient) {
        const clientHtml = getBathroomSelectionEmailTemplate(payload, {
          forClient: true,
        });
        const clientSubject = `Your Bathroom Selection Copy — B-Spoke`;
        await emailService.sendEmail(
          payload.project.email,
          clientSubject,
          text,
          clientHtml,
        );
        console.log("Bathroom selection copy sent to client:", payload.project.email);
      }

      return res.status(200).json({
        success: true,
        message: "Bathroom selection submitted successfully",
      });
    } catch (error) {
      console.error("Bathroom selection error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to submit bathroom selection form",
        error: error.message,
      });
    }
  }
}

module.exports = new BathroomSelectionController();
