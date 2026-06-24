import pool from "../config/db.js";

export const getEmailConfigs = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT id, company_code, config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
           email_from_name, welcome_subject, welcome_template,
           send_welcome_email, send_ticket_assignment_email, send_chat_reply_email,
           send_ticket_update_email, send_reply_email, is_active,
           created_timestamp, update_timestamp
    FROM public.email_configs
    WHERE company_code = $1
    ORDER BY created_timestamp DESC
    `,
    [companyCode]
  );
  return result.rows;
};

export const getActiveEmailConfig = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT id, company_code, config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
           email_from_name, welcome_subject, welcome_template,
           send_welcome_email, send_ticket_assignment_email, send_chat_reply_email,
           send_ticket_update_email, send_reply_email, is_active
    FROM public.email_configs
    WHERE company_code = $1 AND is_active = true
    LIMIT 1
    `,
    [companyCode]
  );
  return result.rows[0] || null;
};

export const createEmailConfig = async (companyCode, data) => {
  const {
    config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
    email_from_name, welcome_subject, welcome_template,
    send_welcome_email = true, send_ticket_assignment_email = true,
    send_chat_reply_email = true, send_ticket_update_email = true,
    send_reply_email = true
  } = data;

  const result = await pool.query(
    `
    INSERT INTO public.email_configs (
      company_code, config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
      email_from_name, welcome_subject, welcome_template,
      send_welcome_email, send_ticket_assignment_email, send_chat_reply_email,
      send_ticket_update_email, send_reply_email, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, false)
    RETURNING *
    `,
    [
      companyCode, config_name, smtp_host || null, smtp_port ? Number(smtp_port) : null,
      smtp_user || null, smtp_pass || null, email_from_name || null,
      welcome_subject || null, welcome_template || null,
      send_welcome_email, send_ticket_assignment_email, send_chat_reply_email,
      send_ticket_update_email, send_reply_email
    ]
  );
  return result.rows[0];
};

export const updateEmailConfig = async (id, companyCode, data) => {
  const fields = [];
  const params = [];
  let index = 1;

  const allowedFields = {
    config_name: "config_name",
    smtp_host: "smtp_host",
    smtp_port: "smtp_port",
    smtp_user: "smtp_user",
    smtp_pass: "smtp_pass",
    email_from_name: "email_from_name",
    welcome_subject: "welcome_subject",
    welcome_template: "welcome_template",
    send_welcome_email: "send_welcome_email",
    send_ticket_assignment_email: "send_ticket_assignment_email",
    send_chat_reply_email: "send_chat_reply_email",
    send_ticket_update_email: "send_ticket_update_email",
    send_reply_email: "send_reply_email"
  };

  for (const [key, dbCol] of Object.entries(allowedFields)) {
    if (data[key] !== undefined) {
      fields.push(`${dbCol} = $${index++}`);
      let val = data[key];
      if (key === "smtp_port") {
        val = val === "" || val === null ? null : Number(val);
      }
      params.push(val);
    }
  }

  if (fields.length === 0) {
    const res = await pool.query(
      "SELECT * FROM public.email_configs WHERE id = $1 AND company_code = $2",
      [id, companyCode]
    );
    return res.rows[0];
  }

  params.push(id);
  params.push(companyCode);

  const result = await pool.query(
    `
    UPDATE public.email_configs
    SET
      ${fields.join(", ")},
      update_timestamp = CURRENT_TIMESTAMP
    WHERE id = $${index++} AND company_code = $${index++}
    RETURNING *
    `,
    params
  );
  return result.rows[0];
};

export const activateEmailConfig = async (id, companyCode) => {
  // Use a transaction to make sure only one config is active
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Deactivate all configs for the company
    await client.query(
      "UPDATE public.email_configs SET is_active = false WHERE company_code = $1",
      [companyCode]
    );

    // Activate the specific config
    const result = await client.query(
      "UPDATE public.email_configs SET is_active = true WHERE id = $1 AND company_code = $2 RETURNING *",
      [id, companyCode]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteEmailConfig = async (id, companyCode) => {
  const result = await pool.query(
    "DELETE FROM public.email_configs WHERE id = $1 AND company_code = $2 AND is_active = false RETURNING *",
    [id, companyCode]
  );
  return result.rows[0];
};
