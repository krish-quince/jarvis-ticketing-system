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
      status_color,
      is_default,
      is_closed_status,
      is_active,
      update_timestamp
    FROM ticket_statuses
    WHERE is_active = true
    ORDER BY status_id
    `
  );

  return result.rows;
};

export const getRoles = async () => {
  const result = await pool.query(
    `
    SELECT
      * 
    FROM roles 
    WHERE is_active = true;
    `
  );

  return result.rows;
};

export const getDepartments = async () => {
  
  const result = await pool.query(
    `
    SELECT
      * 
    FROM departments
    WHERE is_active = true;
    `
  );

  return result.rows;
};

export const getCompanies = async () => {
  const result = await pool.query(
    `
    SELECT
      * 
    FROM companies
    WHERE is_active = true;
    `
  );

  return result.rows;
};

export const createCategory = async ({
  category_name,
  category_description,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_categories (
      category_name,
      category_description
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [category_name, category_description || null]
  );

  return result.rows[0];
};

export const updateCategory = async (
  categoryId,
  {
    category_name,
    category_description,
    is_active = true,
  }
) => {
  const result = await pool.query(
    `
    UPDATE ticket_categories
    SET
      category_name = $1,
      category_description = $2,
      is_active = $3,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE category_id = $4
    RETURNING *
    `,
    [
      category_name,
      category_description || null,
      is_active,
      categoryId,
    ]
  );

  return result.rows[0];
};

export const deleteCategory = async (categoryId) => {
  const result = await pool.query(
    `
    UPDATE ticket_categories
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE category_id = $1
    RETURNING *
    `,
    [categoryId]
  );

  return result.rows[0];
};

export const createStatus = async ({
  status_name,
  status_color,
  is_default = false,
  is_closed_status = false,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_statuses (
      status_name,
      status_color,
      is_default,
      is_closed_status
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [status_name, status_color || null, is_default, is_closed_status]
  );

  return result.rows[0];
};

export const updateStatus = async (
  statusId,
  {
    status_name,
    status_color,
    is_default = false,
    is_closed_status = false,
    is_active = true,
  }
) => {
  const result = await pool.query(
    `
    UPDATE ticket_statuses
    SET
      status_name = $1,
      status_color = $2,
      is_default = $3,
      is_closed_status = $4,
      is_active = $5,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE status_id = $6
    RETURNING *
    `,
    [
      status_name,
      status_color || null,
      is_default,
      is_closed_status,
      is_active,
      statusId,
    ]
  );

  return result.rows[0];
};

export const deleteStatus = async (statusId) => {
  const result = await pool.query(
    `
    UPDATE ticket_statuses
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE status_id = $1
    RETURNING *
    `,
    [statusId]
  );

  return result.rows[0];
};

export const createPriority = async ({
  priority_name,
  priority_value,
  priority_color,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_priorities (
      priority_name,
      priority_value,
      priority_color
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [priority_name, priority_value, priority_color || null]
  );

  return result.rows[0];
};

export const updatePriority = async (
  priorityId,
  {
    priority_name,
    priority_value,
    priority_color,
    is_active = true,
  }
) => {
  const result = await pool.query(
    `
    UPDATE ticket_priorities
    SET
      priority_name = $1,
      priority_value = $2,
      priority_color = $3,
      is_active = $4,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE priority_id = $5
    RETURNING *
    `,
    [
      priority_name,
      priority_value,
      priority_color || null,
      is_active,
      priorityId,
    ]
  );

  return result.rows[0];
};

export const deletePriority = async (priorityId) => {
  const result = await pool.query(
    `
    UPDATE ticket_priorities
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE priority_id = $1
    RETURNING *
    `,
    [priorityId]
  );

  return result.rows[0];
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

export const createSubCategory = async ({
  category_id,
  subcategory_name,
  subcategory_description,
  assigned_user_code,
}) => {
  await pool.query(
    `
    SELECT setval(
      'public.ticket_subcategories_subcategory_id_seq',
      COALESCE((SELECT MAX(subcategory_id) FROM ticket_subcategories), 0) + 1,
      false
    )
    `,
  );

  const result = await pool.query(
    `
    INSERT INTO ticket_subcategories (
      category_id,
      subcategory_name,
      subcategory_description,
      assigned_user_code
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      category_id,
      subcategory_name,
      subcategory_description || null,
      assigned_user_code || null,
    ],
  );

  return result.rows[0];
};

export const updateSubCategory = async (
  subcategoryId,
  {
    category_id,
    subcategory_name,
    subcategory_description,
    assigned_user_code,
    is_active = true,
  },
) => {
  const result = await pool.query(
    `
    UPDATE ticket_subcategories
    SET
      category_id = $1,
      subcategory_name = $2,
      subcategory_description = $3,
      assigned_user_code = $4,
      is_active = $5,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE subcategory_id = $6
    RETURNING *
    `,
    [
      category_id,
      subcategory_name,
      subcategory_description || null,
      assigned_user_code || null,
      is_active,
      subcategoryId,
    ],
  );

  return result.rows[0];
};

export const deleteSubCategory = async (subcategoryId) => {
  const result = await pool.query(
    `
    UPDATE ticket_subcategories
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE subcategory_id = $1
    RETURNING *
    `,
    [subcategoryId],
  );

  return result.rows[0];
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
  {
    subcategoryId,
    departmentId,
    categoryId,
  },
  companyCode,
) => {
  const departmentIds = new Set();

  if (departmentId) {
    departmentIds.add(Number(departmentId));
  }

  const addRoutingDepartment = async (assignedUserCode) => {
    if (!assignedUserCode) return;

    const departmentResult = await pool.query(
      `
      SELECT department_id
      FROM users
      WHERE user_code = $1
      AND company_code = $2
      AND is_active = true
      `,
      [assignedUserCode, companyCode],
    );

    const routingDepartmentId = departmentResult.rows[0]?.department_id;

    if (routingDepartmentId) {
      departmentIds.add(Number(routingDepartmentId));
    }
  };

  if (subcategoryId) {
    const subCategoryResult = await pool.query(
      `
      SELECT assigned_user_code
      FROM ticket_subcategories
      WHERE subcategory_id = $1
      AND is_active = true
      `,
      [subcategoryId],
    );

    if (subCategoryResult.rows.length === 0) {
      return [];
    }

    const routingUser = subCategoryResult.rows[0].assigned_user_code;
    await addRoutingDepartment(routingUser);
  }

  if (!subcategoryId && categoryId) {
    const categoryRoutingResult = await pool.query(
      `
      SELECT DISTINCT u.department_id
      FROM ticket_subcategories sc
      INNER JOIN users u ON u.user_code = sc.assigned_user_code
      WHERE sc.category_id = $1
      AND sc.is_active = true
      AND u.company_code = $2
      AND u.is_active = true
      `,
      [categoryId, companyCode],
    );

    categoryRoutingResult.rows.forEach((row) => {
      if (row.department_id) {
        departmentIds.add(Number(row.department_id));
      }
    });
  }

  if (departmentIds.size === 0) {
    return [];
  }

  const departmentIdList = [...departmentIds];
  const usersResult =
    await pool.query(
      `
      SELECT
        user_code,
        first_name,
        last_name
      FROM users
      WHERE department_id = ANY($1::int[])
      AND company_code = $2
      AND is_active = true
      ORDER BY first_name
      `,
      [departmentIdList, companyCode],
    );

  return usersResult.rows;
};
