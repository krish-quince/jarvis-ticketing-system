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

export const getSubCategories = async (
  companyId,
  categoryId
) => {

  const result = await pool.query(
    `
    SELECT
      subcategory_id,
      subcategory_name,
      subcategory_description,
      assigned_user_code
    FROM ticket_subcategories
    WHERE company_id = $1
      AND category_id = $2
      AND is_active = true
    ORDER BY subcategory_name
    `,
    [companyId, categoryId]
  );

  return result.rows;
};

export const getSubCategoryById = async (
  subcategoryId,
  companyId
) => {

  const result = await pool.query(
    `
    SELECT
      subcategory_id,
      category_id,
      company_id,
      subcategory_name,
      assigned_user_code
    FROM ticket_subcategories
    WHERE subcategory_id = $1
      AND company_id = $2
      AND is_active = true
    `,
    [subcategoryId, companyId]
  );

  return result.rows[0];
};