import pool from "../config/db.js";

export const getCategories = async (companyId) => {
  const result = await pool.query(
    `
    SELECT
      category_id,
      category_name,
      category_description
    FROM ticket_categories
    WHERE company_id = $1
      AND is_active = true
    ORDER BY category_name
    `,
    [companyId]
  );

  return result.rows;
};

export const getPriorities = async (companyId) => {
  const result = await pool.query(
    `
    SELECT
      priority_id,
      priority_name,
      priority_value,
      priority_color
    FROM ticket_priorities
    WHERE company_id = $1
      AND is_active = true
    ORDER BY priority_value
    `,
    [companyId]
  );

  return result.rows;
};