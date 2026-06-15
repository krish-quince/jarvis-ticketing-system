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

export const getPriorities = async () => {
  const result = await pool.query(
    `
    SELECT
      priority_id,
      priority_name,
      priority_value,
      priority_color
    FROM ticket_priorities
    WHERE is_active = true
    ORDER BY priority_value
    `
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

export const getAssignableUsers = async (
  subcategoryId, 
  companyId
) => {

  const subCategoryResult =
    await pool.query(
      `
      SELECT assigned_user_code
      FROM ticket_subcategories
      WHERE subcategory_id = $1
      AND company_id = $2
      `,
      [subcategoryId, companyId]
    );

  if (
    subCategoryResult.rows.length === 0
  ) {
    return [];
  }

  const routingUser =
    subCategoryResult.rows[0]
      .assigned_user_code;

  if (!routingUser) {
    return [];
  }

  const departmentResult =
    await pool.query(
      `
      SELECT department
      FROM users
      WHERE user_code = $1
      AND company_id = $2
      `,
      [routingUser, companyId]
    );

  const department =
    departmentResult.rows[0]
      ?.department;

  if (!department) {
    return [];
  }

  const usersResult =
    await pool.query(
      `
      SELECT
        user_code,
        first_name,
        last_name
      FROM users
      WHERE department = $1
      AND company_id = $2
      AND is_active = true
      ORDER BY first_name
      `,
      [department, companyId]
    );

  return usersResult.rows;
};