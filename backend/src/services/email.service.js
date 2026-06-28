import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config();

/**
 * Sends a welcome/credential email to a newly created user.
 * 
 * @param {Object} userDetails 
 * @param {string} userDetails.email
 * @param {string} userDetails.user_code
 * @param {string} userDetails.password
 * @param {string} userDetails.first_name
 * @param {string} [userDetails.last_name]
 * @param {number|string} userDetails.role_id
 * @param {string} [userDetails.company_code]
 * @param {number|string} [userDetails.department_id]
 */
export const sendWelcomeEmail = async (userDetails) => {
  let companyName = "Quince Capital";
  let companyLogo = ""; 
  let smtpHostDb = null;
  let smtpPortDb = null;
  let smtpUserDb = null;
  let smtpPassDb = null;
  let emailFromNameDb = null;
  let welcomeSubjectDb = null;
  let welcomeTemplateDb = null;

  let sendWelcomeEmailToggle = true;

  try {
    if (userDetails.company_code) {
      const companyRes = await pool.query(
        "SELECT company_name, logo_url FROM companies WHERE company_code = $1", 
        [userDetails.company_code]
      );
      if (companyRes.rows.length > 0) {
        const cRow = companyRes.rows[0];
        companyName = cRow.company_name;
        companyLogo = cRow.logo_url || "";
      }

      const configRes = await pool.query(
        "SELECT * FROM email_configs WHERE company_code = $1 AND is_active = true LIMIT 1",
        [userDetails.company_code]
      );
      if (configRes.rows.length > 0) {
        const cfg = configRes.rows[0];
        smtpHostDb = cfg.smtp_host;
        smtpPortDb = cfg.smtp_port;
        smtpUserDb = cfg.smtp_user;
        smtpPassDb = cfg.smtp_pass;
        emailFromNameDb = cfg.email_from_name;
        welcomeSubjectDb = cfg.welcome_subject;
        welcomeTemplateDb = cfg.welcome_template;
        sendWelcomeEmailToggle = cfg.send_welcome_email !== false;
      }
    }
  } catch (dbErr) {
    console.warn("Failed to load SMTP settings from database, using env fallbacks:", dbErr);
  }

  // If the active config specifies not to send the welcome email, abort early
  if (!sendWelcomeEmailToggle) {
    console.log(`Welcome email is disabled in active configuration for company ${userDetails.company_code}. Not sending.`);
    return false;
  }

  // Resolve SMTP configuration
  const smtpUser = smtpUserDb || process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = smtpPassDb || process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.APP_PASSWORD;
  const smtpHost = smtpHostDb || process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = smtpPortDb ? Number(smtpPortDb) : parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
  const fromName = emailFromNameDb || companyName || "Jarvis Helpdesk";

  if (!smtpUser || !smtpPass) {
    console.warn("SMTP credentials (EMAIL_USER/SMTP_USER and EMAIL_PASS/SMTP_PASS/APP_PASSWORD) not found in environment or database. Email not sent.");
    return false;
  }

  try {
    // 1. Fetch metadata (role name, department name)
    let roleName = "User";
    if (userDetails.role_id) {
      const roleRes = await pool.query("SELECT role_name FROM roles WHERE role_id = $1", [userDetails.role_id]);
      if (roleRes.rows.length > 0) {
        roleName = roleRes.rows[0].role_name;
      }
    }

    let departmentName = "-";
    if (userDetails.department_id) {
      const deptRes = await pool.query("SELECT department_name FROM departments WHERE department_id = $1", [userDetails.department_id]);
      if (deptRes.rows.length > 0) {
        departmentName = deptRes.rows[0].department_name;
      }
    }

    // Determine Backend URL or public URL for logo parsing
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    let logoHtml = `<span style="font-size: 20px; font-weight: bold; color: #ffffff;">${companyName}</span>`;
    
    if (companyLogo) {
      const fullLogoUrl = companyLogo.startsWith("http") ? companyLogo : `${backendUrl}${companyLogo}`;
      logoHtml = `<img src="${fullLogoUrl}" alt="${companyName} Logo" style="max-height: 40px; max-width: 200px; display: block;" />`;
    }

    // 2. Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fullName = [userDetails.first_name, userDetails.last_name].filter(Boolean).join(" ");
    const welcomeSubject = welcomeSubjectDb || `[ACTION REQUIRED] Account Created - ${companyName} Jarvis`;

    // Process HTML Template
    let htmlContent = "";
    if (welcomeTemplateDb) {
      htmlContent = welcomeTemplateDb
        .replace(/\{\{first_name\}\}/g, userDetails.first_name || "")
        .replace(/\{\{last_name\}\}/g, userDetails.last_name || "")
        .replace(/\{\{user_code\}\}/g, userDetails.user_code || "")
        .replace(/\{\{password\}\}/g, userDetails.password || "")
        .replace(/\{\{email\}\}/g, userDetails.email || "")
        .replace(/\{\{role\}\}/g, roleName || "")
        .replace(/\{\{company_name\}\}/g, companyName || "")
        .replace(/\{\{department\}\}/g, departmentName || "");
    } else {
      // Default Fallback Styled Template
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Created - Action Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7; color: #333333;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr style="background-color: #0b2240;">
            <td style="padding: 24px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="70%">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          ${logoHtml}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 4px;">
                          <span style="font-size: 12px; color: #a5b4fc; letter-spacing: 0.5px;">Ticketing System</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="30%" align="right">
                    <span style="background-color: #f59e0b; color: #000000; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Action Required</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 20px; font-size: 24px; font-weight: bold; color: #ffffff;">
                Account &mdash; <span style="color: #f59e0b;">Action Alert!!</span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 0; margin-bottom: 12px;">Dear ${fullName || 'User'},</p>
              <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin-top: 0; margin-bottom: 24px;">
                This is to inform you that your account has been created in the Jarvis Ticketing System. Request you to review your credentials below and log in to take necessary actions.
              </p>

              <!-- Credentials / Details Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #0b2240; border-radius: 4px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #0b2240; color: #ffffff;">
                  <td colspan="2" style="padding: 10px 16px; font-size: 13px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
                    &#128196; USER CREDENTIALS & DETAILS
                  </td>
                </tr>
                
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td width="40%" style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Username / User Code</td>
                  <td width="60%" style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">${userDetails.user_code}</td>
                </tr>
                
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Temporary Password</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">${userDetails.password}</td>
                </tr>
                
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Email Address</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">${userDetails.email}</td>
                </tr>

                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Role</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">${roleName}</td>
                </tr>

                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Company</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb;">${companyName}</td>
                </tr>

                <tr>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #374151; border-right: 1px solid #e5e7eb; background-color: #f9fafb;">Department</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #111827;">${departmentName}</td>
                </tr>
              </table>

              <!-- Automatic Mail Note Banner -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; line-height: 1.5; color: #92400e;">
                    <strong>Note:</strong> This is an automated mail. Please do not respond to this email.
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #4b5563; margin-top: 0; margin-bottom: 4px;">Warm Regards,</p>
              <p style="font-size: 15px; font-weight: bold; color: #0b2240; margin-top: 0; margin-bottom: 0;">${companyName}</p>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr style="background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            <td style="padding: 20px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px;">
                      &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
                    </span>
                    <span style="font-size: 11px; color: #9ca3af; display: block;">
                      This is a system-generated notification from Jarvis Ticketing System.
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; color: #9ca3af;">
                      Powered by <strong>Jarvis&trade;</strong>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    // 3. Send Email
    const mailOptions = {
      from: `"${fromName}" <${smtpUser}>`,
      to: userDetails.email,
      subject: welcomeSubject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email successfully sent to ${userDetails.email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
};

export const sendNewTicketNotifications = async (ticket, suppressUserEmail = false, suppressTechEmail = false) => {
  // 1. Fetch SMTP config for the ticket's company
  let companyName = "Quince Capital";
  let smtpHostDb = null;
  let smtpPortDb = null;
  let smtpUserDb = null;
  let smtpPassDb = null;
  let emailFromNameDb = null;
  let sendAssignmentEmailToggle = true;

  try {
    const companyRes = await pool.query(
      "SELECT company_name FROM companies WHERE company_code = $1", 
      [ticket.company_code]
    );
    if (companyRes.rows.length > 0) {
      companyName = companyRes.rows[0].company_name;
    }

    const configRes = await pool.query(
      "SELECT * FROM email_configs WHERE company_code = $1 AND is_active = true LIMIT 1",
      [ticket.company_code]
    );
    if (configRes.rows.length > 0) {
      const cfg = configRes.rows[0];
      smtpHostDb = cfg.smtp_host;
      smtpPortDb = cfg.smtp_port;
      smtpUserDb = cfg.smtp_user;
      smtpPassDb = cfg.smtp_pass;
      emailFromNameDb = cfg.email_from_name;
      sendAssignmentEmailToggle = cfg.send_ticket_assignment_email !== false;
    }
  } catch (dbErr) {
    console.warn("Failed to load SMTP settings for ticket notifications:", dbErr);
  }

  // Resolve SMTP configuration
  const smtpUser = smtpUserDb || process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = smtpPassDb || process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.APP_PASSWORD;
  const smtpHost = smtpHostDb || process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = smtpPortDb ? Number(smtpPortDb) : parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
  const fromName = emailFromNameDb || companyName || "Jarvis Helpdesk";

  if (!smtpUser || !smtpPass) {
    console.warn("SMTP credentials not configured. Skipping email notifications.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // 2. Send User Confirmation Email (if not suppressed)
  if (!suppressUserEmail) {
    try {
      const userRes = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE user_code = $1 AND is_active = true",
        [ticket.raised_by_user_code]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
        const mailOptions = {
          from: `"${fromName}" <${smtpUser}>`,
          to: u.email,
          subject: `Ticket Created - #${ticket.ticket_no}: ${ticket.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Ticket Confirmation</h2>
              <p>Dear ${fullName},</p>
              <p>Your ticket has been successfully created in the system.</p>
              <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;" width="30%">Ticket No</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.ticket_no}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Subject</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Description</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.description || ""}</td>
                </tr>
              </table>
              <p style="margin-top: 20px; font-size: 12px; color: #777;">This is a system-generated notification. Please do not reply directly to this email.</p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to user ${u.email}`);
      }
    } catch (err) {
      console.error("Failed to send new ticket user confirmation email:", err);
    }
  }

  // 3. Send Tech Notification Email (if not suppressed, ticket has assignee, and settings allow it)
  if (!suppressTechEmail && ticket.assigned_to_user_code && sendAssignmentEmailToggle) {
    try {
      const techRes = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE user_code = $1 AND is_active = true",
        [ticket.assigned_to_user_code]
      );
      if (techRes.rows.length > 0) {
        const tech = techRes.rows[0];
        const fullName = [tech.first_name, tech.last_name].filter(Boolean).join(" ");
        const mailOptions = {
          from: `"${fromName}" <${smtpUser}>`,
          to: tech.email,
          subject: `Ticket Assigned - #${ticket.ticket_no}: ${ticket.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>New Ticket Assignment</h2>
              <p>Dear ${fullName},</p>
              <p>The following ticket has been assigned to you:</p>
              <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;" width="30%">Ticket No</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.ticket_no}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Subject</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Description</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${ticket.description || ""}</td>
                </tr>
              </table>
              <p style="margin-top: 20px; font-size: 12px; color: #777;">Please log in to your dashboard to review and manage this ticket.</p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent to technician ${tech.email}`);
      }
    } catch (err) {
      console.error("Failed to send ticket assignment email to tech:", err);
    }
  }
};
