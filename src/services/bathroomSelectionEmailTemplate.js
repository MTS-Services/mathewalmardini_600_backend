const LOGO_URL = "https://dc3v08iv2c2ou.cloudfront.net/logo.png";

const getBathroomSelectionEmailTemplate = (payload, options = {}) => {
  const { project, categories } = payload;
  const forClient = Boolean(options.forClient);

  const categorySections = (categories || [])
    .map((cat) => {
      const entries = Object.entries(cat.answers || {}).filter(
        ([, v]) =>
          v !== undefined &&
          v !== null &&
          v !== "" &&
          !(Array.isArray(v) && !v.length),
      );

      if (!entries.length) return "";

      const rows = entries
        .map(([key, value]) => {
          const isUrl =
            typeof value === "string" && /^https?:\/\//i.test(value);
          const display = Array.isArray(value)
            ? value.join(", ")
            : isUrl
              ? `<a href="${value}" target="_blank" rel="noopener noreferrer" style="color:#205767;word-break:break-all;">View photo</a><br/><img src="${value}" alt="Uploaded photo" style="margin-top:8px;max-width:100%;max-height:220px;border-radius:8px;border:1px solid #ddd;" />`
              : String(value);
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase());
          return `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%; vertical-align: top;">${label}:</td>
              <td style="padding: 8px 0; color: #333333;">${display}</td>
            </tr>`;
        })
        .join("");

      return `
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
          <tr>
            <td style="padding: 20px;">
              <h2 style="margin: 0 0 12px 0; color: #205767; font-size: 18px; border-bottom: 2px solid #205767; padding-bottom: 8px;">
                ${cat.number} — ${cat.title}
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">${rows}</table>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const heading = forClient
    ? "Your Bathroom Selection Summary"
    : "New Bathroom Selection Form";
  const subheading = forClient
    ? "A copy of the selections you submitted to B-Spoke"
    : "Submitted from the B-Spoke website";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bathroom Selection Form</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 640px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #205767; padding: 28px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="B-Spoke" width="160" style="display:block;margin:0 auto 16px auto;max-width:160px;height:auto;border:0;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${heading}</h1>
              <p style="margin: 10px 0 0 0; color: #f0f0f0; font-size: 14px;">${subheading}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #e8f1f4; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 16px 0; color: #205767; font-size: 18px;">Project details</h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Full Name:</td><td style="padding: 6px 0; color: #333;">${project.clientName || "—"}</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 6px 0; color: #333;"><a href="mailto:${project.email}" style="color:#205767;">${project.email || "—"}</a></td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Phone:</td><td style="padding: 6px 0; color: #333;"><a href="tel:${project.phone}" style="color:#205767;">${project.phone || "—"}</a></td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Project Address:</td><td style="padding: 6px 0; color: #333;">${project.projectAddress || "—"}</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Bathroom:</td><td style="padding: 6px 0; color: #333;">${project.bathroomTypeLabel || project.bathroomType || "—"}</td></tr>
                      <tr><td style="padding: 6px 0; font-weight: bold; color: #555;">Rubbish Removal:</td><td style="padding: 6px 0; color: #333;">${project.rubbishRemoval || "—"}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${categorySections || "<p style='color:#666;'>No category selections provided.</p>"}
            </td>
          </tr>
          <tr>
            <td style="background-color: #163f4f; padding: 24px; text-align: center;">
              <img src="${LOGO_URL}" alt="B-Spoke" width="100" style="display:block;margin:0 auto 12px auto;max-width:100px;height:auto;border:0;opacity:0.95;" />
              <p style="margin: 0; font-size: 12px; color: #95a5a6;">© ${new Date().getFullYear()} B-Spoke Renovations</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const getBathroomSelectionText = (payload) => {
  const { project, categories } = payload;
  let text = `Bathroom Selection Form\n\n`;
  text += `Full name: ${project.clientName}\n`;
  text += `Email: ${project.email}\n`;
  text += `Phone: ${project.phone}\n`;
  text += `Address: ${project.projectAddress}\n`;
  text += `Bathroom: ${project.bathroomTypeLabel || project.bathroomType}\n`;
  text += `Rubbish Removal: ${project.rubbishRemoval || "—"}\n\n`;

  (categories || []).forEach((cat) => {
    text += `\n${cat.number} — ${cat.title}\n`;
    Object.entries(cat.answers || {}).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v.join(", ") : v;
      if (val) text += `  ${k}: ${val}\n`;
    });
  });

  return text;
};

module.exports = {
  getBathroomSelectionEmailTemplate,
  getBathroomSelectionText,
};
