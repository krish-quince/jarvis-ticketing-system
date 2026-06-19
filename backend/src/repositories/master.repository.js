import pool from "../config/db.js";

export const getCategories = async () => {
  const result = await pool.query(
    `
    SELECT
      category_id,
      category_name,
      category_description
    FROM ticket_categories
    WHERE is_active = true
    ORDER BY category_name
    `,
    []
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

export const getStatuses = async () => {
  const result = await pool.query(
    `
    SELECT
      status_id,
      status_name,
      status_color
    FROM ticket_statuses
    WHERE is_active = true
    ORDER BY status_id
    `
  );

  return result.rows;
};

export const getSubCategories = async (
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
    WHERE category_id = $1
    AND is_active = true
    ORDER BY subcategory_name
    `,
    [categoryId]
  );

  return result.rows;
};

export const getSubCategoryById = async (
  subcategoryId
) => {

  const result = await pool.query(
    `
    SELECT
      subcategory_id,
      category_id,
      subcategory_name,
      assigned_user_code
    FROM ticket_subcategories
    WHERE subcategory_id = $1
      AND is_active = true
    `,
    [subcategoryId]
  );

  return result.rows[0];
};

export const getAssignableUsers = async (
  subcategoryId, 
  companyCode
) => {

  const subCategoryResult =
    await pool.query(
      `
      SELECT assigned_user_code
      FROM ticket_subcategories
      WHERE subcategory_id = $1
      `,
      [subcategoryId]
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
      SELECT department_id
      FROM users
      WHERE user_code = $1
      AND company_code = $2
      `,
      [routingUser, companyCode]
    );

  const departmentId =
    departmentResult.rows[0]
      ?.department_id;

  if (!departmentId) {
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
      WHERE department_id = $1
      AND company_code = $2
      AND is_active = true
      ORDER BY first_name
      `,
      [departmentId, companyCode]
    );

  return usersResult.rows;
};
