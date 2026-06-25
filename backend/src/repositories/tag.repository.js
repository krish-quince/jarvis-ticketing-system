import pool from "../config/db.js";

export const getTagsByCompany = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT
      tag_id,
      tag_name,
      tag_color,
      is_active
    FROM tags
    WHERE is_active = true AND company_code = $1
    ORDER BY tag_name
    `,
    [companyCode],
  );

  return result.rows;
};

export const getTagByNameAndCompany = async (tagName, companyCode, client = null) => {
  const db = client || pool;

  const result = await db.query(
    `
    SELECT tag_id, tag_name, tag_color, is_active
    FROM tags
    WHERE LOWER(tag_name) = LOWER($1) AND company_code = $2
    `,
    [tagName, companyCode],
  );

  return result.rows[0];
};

export const createTag = async ({ tag_name, tag_color, company_code }, client = null) => {
  const db = client || pool;

  await db.query(
    `
    SELECT setval(
      'public.tags_tag_id_seq',
      COALESCE((SELECT MAX(tag_id) FROM public.tags), 0) + 1,
      false
    )
    `,
  );

  const result = await db.query(
    `
    INSERT INTO tags (
      tag_name,
      tag_color,
      company_code
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [tag_name.trim(), tag_color || "#6366F1", company_code],
  );

  return result.rows[0];
};

// Reactivates a soft-deleted tag instead of duplicating it, if it already exists for the company.
export const reactivateTag = async (tagId, client = null) => {
  const db = client || pool;

  const result = await db.query(
    `
    UPDATE tags
    SET is_active = true, update_timestamp = CURRENT_TIMESTAMP
    WHERE tag_id = $1
    RETURNING *
    `,
    [tagId],
  );

  return result.rows[0];
};

export const updateTag = async (tagId, { tag_name, tag_color, is_active = true }, companyCode) => {
  const result = await pool.query(
    `
    UPDATE tags
    SET
      tag_name = $1,
      tag_color = $2,
      is_active = $3,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE tag_id = $4 AND company_code = $5
    RETURNING *
    `,
    [tag_name.trim(), tag_color || null, is_active, tagId, companyCode],
  );

  return result.rows[0];
};

export const deleteTag = async (tagId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE tags
    SET is_active = false, update_timestamp = CURRENT_TIMESTAMP
    WHERE tag_id = $1 AND company_code = $2
    RETURNING *
    `,
    [tagId, companyCode],
  );

  return result.rows[0];
};

export const getTagsForTicket = async (ticketId, client = null) => {
  const db = client || pool;

  const result = await db.query(
    `
    SELECT
      t.tag_id,
      t.tag_name,
      t.tag_color
    FROM ticket_tags tt
    JOIN tags t ON t.tag_id = tt.tag_id
    WHERE tt.ticket_id = $1
    ORDER BY t.tag_name
    `,
    [ticketId],
  );

  return result.rows;
};

export const getTagsForTickets = async (ticketIds, client = null) => {
  const db = client || pool;

  if (!ticketIds || ticketIds.length === 0) return [];

  const result = await db.query(
    `
    SELECT
      tt.ticket_id,
      t.tag_id,
      t.tag_name,
      t.tag_color
    FROM ticket_tags tt
    JOIN tags t ON t.tag_id = tt.tag_id
    WHERE tt.ticket_id = ANY($1::bigint[])
    ORDER BY t.tag_name
    `,
    [ticketIds],
  );

  return result.rows;
};

export const addTicketTag = async (ticketId, tagId, client = null) => {
  const db = client || pool;

  await db.query(
    `
    INSERT INTO ticket_tags (ticket_id, tag_id)
    VALUES ($1, $2)
    ON CONFLICT (ticket_id, tag_id) DO NOTHING
    `,
    [ticketId, tagId],
  );
};

export const removeTicketTag = async (ticketId, tagId, client = null) => {
  const db = client || pool;

  await db.query(
    `
    DELETE FROM ticket_tags
    WHERE ticket_id = $1 AND tag_id = $2
    `,
    [ticketId, tagId],
  );
};

export const removeAllTicketTags = async (ticketId, client = null) => {
  const db = client || pool;

  await db.query(
    `
    DELETE FROM ticket_tags
    WHERE ticket_id = $1
    `,
    [ticketId],
  );
};

// Deletes tags that have zero ticket associations left (Jitbit-style auto-cleanup).
// Restricted to a specific set of candidate tag IDs so we never sweep the whole table.
export const deleteOrphanTags = async (tagIds, client = null) => {
  const db = client || pool;

  if (!tagIds || tagIds.length === 0) return [];

  const result = await db.query(
    `
    DELETE FROM tags
    WHERE tag_id = ANY($1::bigint[])
      AND NOT EXISTS (
        SELECT 1 FROM ticket_tags tt WHERE tt.tag_id = tags.tag_id
      )
    RETURNING tag_id
    `,
    [tagIds],
  );

  return result.rows;
};

// ── Freeform tags ─────────────────────────────────────────────────────────────
// No admin catalog. Any user can attach any text to a ticket.

export const getFreeformTagsForTicket = async (ticketId) => {
  const result = await pool.query(
    `SELECT id, tag_message, user_code, created_at
     FROM ticket_freeform_tags
     WHERE ticket_id = $1
     ORDER BY created_at ASC`,
    [ticketId],
  );
  return result.rows;
};

export const addFreeformTag = async (ticketId, companyCode, tagMessage, userCode) => {
  const result = await pool.query(
    `INSERT INTO ticket_freeform_tags (ticket_id, company_code, tag_message, user_code)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tag_message, user_code, created_at`,
    [ticketId, companyCode, tagMessage.trim(), userCode],
  );
  return result.rows[0];
};

export const removeFreeformTag = async (tagId, ticketId, companyCode) => {
  const result = await pool.query(
    `DELETE FROM ticket_freeform_tags
     WHERE id = $1 AND ticket_id = $2 AND company_code = $3
     RETURNING id`,
    [tagId, ticketId, companyCode],
  );
  return result.rows[0];
};

// Returns unique tag texts with their ticket counts, for the sidebar.
export const getAllFreeformTagsWithCount = async (companyCode) => {
  const result = await pool.query(
    `SELECT LOWER(tag_message) AS tag_message, COUNT(DISTINCT ticket_id)::int AS ticket_count
     FROM ticket_freeform_tags
     WHERE company_code = $1
     GROUP BY LOWER(tag_message)
     ORDER BY ticket_count DESC, LOWER(tag_message)`,
    [companyCode],
  );
  return result.rows;
};
