import pool from "../config/db.js";

export const getCategories = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT
      category_id,
      category_name,
      category_description
    FROM ticket_categories
    WHERE is_active = true AND company_code = $1
    ORDER BY category_name
    `,
    [companyCode]
  );

  return result.rows;
};

export const getPriorities = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT
      priority_id,
      priority_name,
      priority_value,
      priority_color
    FROM ticket_priorities
    WHERE is_active = true AND company_code = $1
    ORDER BY priority_value
    `,
    [companyCode]
  );

  return result.rows;
};

export const getStatuses = async (companyCode) => {
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
    WHERE is_active = true AND company_code = $1
    ORDER BY status_id
    `,
    [companyCode]
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

export const getDepartments = async (companyCode) => {
  let query = `
    SELECT
      * 
    FROM departments
    WHERE is_active = true
  `;
  const params = [];
  if (companyCode) {
    query += ` AND company_code = $1`;
    params.push(companyCode);
  }
  const result = await pool.query(query, params);

  return result.rows;
};

export const getCompanies = async (includeDeleted = false) => {
  let query = `
    SELECT
      * 
    FROM companies
    WHERE is_active = true
  `;
  if (!includeDeleted) {
    query += ` AND is_deleted = false`;
  }
  query += ` ORDER BY company_name`;
  const result = await pool.query(query);

  return result.rows;
};



export const createCategory = async ({
  category_name,
  category_description,
  company_code,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_categories (
      category_name,
      category_description,
      company_code
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [category_name, category_description || null, company_code]
  );

  return result.rows[0];
};

export const updateCategory = async (
  categoryId,
  {
    category_name,
    category_description,
    is_active = true,
  },
  companyCode
) => {
  const result = await pool.query(
    `
    UPDATE ticket_categories
    SET
      category_name = $1,
      category_description = $2,
      is_active = $3,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE category_id = $4 AND company_code = $5
    RETURNING *
    `,
    [
      category_name,
      category_description || null,
      is_active,
      categoryId,
      companyCode,
    ]
  );

  return result.rows[0];
};

export const deleteCategory = async (categoryId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE ticket_categories
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE category_id = $1 AND company_code = $2
    RETURNING *
    `,
    [categoryId, companyCode]
  );

  return result.rows[0];
};

export const createStatus = async ({
  status_name,
  status_color,
  is_default = false,
  is_closed_status = false,
  company_code,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_statuses (
      status_name,
      status_color,
      is_default,
      is_closed_status,
      company_code
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [status_name, status_color || null, is_default, is_closed_status, company_code]
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
  },
  companyCode
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
    WHERE status_id = $6 AND company_code = $7
    RETURNING *
    `,
    [
      status_name,
      status_color || null,
      is_default,
      is_closed_status,
      is_active,
      statusId,
      companyCode,
    ]
  );

  return result.rows[0];
};

export const deleteStatus = async (statusId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE ticket_statuses
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE status_id = $1 AND company_code = $2
    RETURNING *
    `,
    [statusId, companyCode]
  );

  return result.rows[0];
};

export const createPriority = async ({
  priority_name,
  priority_value,
  priority_color,
  company_code,
}) => {
  const result = await pool.query(
    `
    INSERT INTO ticket_priorities (
      priority_name,
      priority_value,
      priority_color,
      company_code
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [priority_name, priority_value, priority_color || null, company_code]
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
  },
  companyCode
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
    WHERE priority_id = $5 AND company_code = $6
    RETURNING *
    `,
    [
      priority_name,
      priority_value,
      priority_color || null,
      is_active,
      priorityId,
      companyCode,
    ]
  );

  return result.rows[0];
};

export const deletePriority = async (priorityId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE ticket_priorities
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE priority_id = $1 AND company_code = $2
    RETURNING *
    `,
    [priorityId, companyCode]
  );

  return result.rows[0];
};

export const getSubCategories = async (categoryId, companyCode) => {
  const result = await pool.query(
    `
    SELECT
      subcategory_id,
      category_id,
      subcategory_name,
      subcategory_description,
      assigned_user_code
    FROM ticket_subcategories
    WHERE category_id = $1 AND company_code = $2 AND is_active = true
    ORDER BY subcategory_name
    `,
    [categoryId, companyCode]
  );

  return result.rows;
};

export const createSubCategory = async ({
  category_id,
  subcategory_name,
  subcategory_description,
  assigned_user_code,
  company_code,
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
      assigned_user_code,
      company_code
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      category_id,
      subcategory_name,
      subcategory_description || null,
      assigned_user_code || null,
      company_code,
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
  companyCode,
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
    WHERE subcategory_id = $6 AND company_code = $7
    RETURNING *
    `,
    [
      category_id,
      subcategory_name,
      subcategory_description || null,
      assigned_user_code || null,
      is_active,
      subcategoryId,
      companyCode,
    ],
  );

  return result.rows[0];
};

export const deleteSubCategory = async (subcategoryId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE ticket_subcategories
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE subcategory_id = $1 AND company_code = $2
    RETURNING *
    `,
    [subcategoryId, companyCode],
  );

  return result.rows[0];
};

export const getSubCategoryById = async (subcategoryId, companyCode) => {
  const result = await pool.query(
    `
    SELECT
      subcategory_id,
      category_id,
      subcategory_name,
      assigned_user_code
    FROM ticket_subcategories
    WHERE subcategory_id = $1 AND company_code = $2
      AND is_active = true
    `,
    [subcategoryId, companyCode]
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
  if (subcategoryId) {
    const subCategoryResult = await pool.query(
      `
      SELECT assigned_user_code
      FROM ticket_subcategories
      WHERE subcategory_id = $1
      AND company_code = $2
      AND is_active = true
      `,
      [subcategoryId, companyCode],
    );

    if (subCategoryResult.rows.length > 0) {
      const routingUser = subCategoryResult.rows[0].assigned_user_code;
      if (routingUser) {
        const usersList = routingUser.split("|").map(u => u.trim()).filter(Boolean);
        if (usersList.length > 0) {
          const usersResult = await pool.query(
            `
            SELECT user_code, first_name, last_name
            FROM users
            WHERE user_code = ANY($1::varchar[])
            AND company_code = $2
            AND is_active = true
            ORDER BY first_name
            `,
            [usersList, companyCode],
          );
          return usersResult.rows;
        }
      }
    }
    return [];
  }

  const departmentIds = new Set();

  if (departmentId) {
    departmentIds.add(Number(departmentId));
  }

  if (categoryId) {
    const categoryRoutingResult = await pool.query(
      `
      SELECT DISTINCT u.department_id
      FROM ticket_subcategories sc
      JOIN ReturnTable(sc.assigned_user_code, '|') rt ON true
      INNER JOIN users u ON u.user_code = rt.Value
      WHERE sc.category_id = $1
      AND sc.is_active = true
      AND sc.company_code = $2
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

export const createCompany = async ({
  company_name,
  company_code,
  email,
  phone,
  address,
  logo_url,
  email_domain,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert the company
    const companyResult = await client.query(
      `
      INSERT INTO companies (
        company_name,
        company_code,
        email,
        phone,
        address,
        logo_url,
        email_domain,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
      `,
      [company_name, company_code, email || null, phone || null, address || null, logo_url || null, email_domain || null]
    );

    const code = companyResult.rows[0].company_code;

    // 2. Insert default priorities: Low (1), Medium (2), High (3)
    await client.query(
      `
      INSERT INTO ticket_priorities (priority_name, priority_value, priority_color, company_code, is_active)
      VALUES 
        ('Low', 1, '#4CAF50', $1, true),
        ('Medium', 2, '#FF9800', $1, true),
        ('High', 3, '#F44336', $1, true)
      `,
      [code]
    );

    // 3. Insert default statuses: New (is_default=true), In Progress, Closed (is_closed_status=true)
    await client.query(
      `
      INSERT INTO ticket_statuses (status_name, status_color, display_order, is_default, is_closed_status, company_code, is_active)
      VALUES 
        ('New', '#2196F3', 1, true, false, $1, true),
        ('In Progress', '#FFC107', 2, false, false, $1, true),
        ('Closed', '#4CAF50', 3, false, true, $1, true)
      `,
      [code]
    );

    // 4. Insert default category: General
    await client.query(
      `
      INSERT INTO ticket_categories (category_name, category_description, company_code, is_active)
      VALUES ('General', 'General support queries', $1, true)
      `,
      [code]
    );

    // 5. Insert default departments: IT, HR, Support, Finance
    await client.query(
      `
      INSERT INTO departments (department_name, company_code, is_active)
      VALUES 
        ('IT', $1, true),
        ('HR', $1, true),
        ('Support', $1, true),
        ('Finance', $1, true)
      `,
      [code]
    );

    await client.query("COMMIT");
    return companyResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateCompany = async (
  companyCode,
  {
    company_name,
    email,
    phone,
    address,
    logo_url,
    email_domain,
    is_active = true,
  }
) => {
  const result = await pool.query(
    `
    UPDATE companies
    SET
      company_name = $1,
      email = $2,
      phone = $3,
      address = $4,
      logo_url = $5,
      email_domain = $6,
      is_active = $7,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE company_code = $8
    RETURNING *
    `,
    [
      company_name,
      email || null,
      phone || null,
      address || null,
      logo_url || null,
      email_domain || null,
      is_active,
      companyCode,
    ]
  );
  return result.rows[0];
};

export const deleteCompany = async (companyCode) => {
  const result = await pool.query(
    `
    UPDATE companies
    SET
      is_deleted = true,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE company_code = $1
    RETURNING *
    `,
    [companyCode]
  );
  return result.rows[0];
};

export const restoreCompany = async (companyCode) => {
  const result = await pool.query(
    `
    UPDATE companies
    SET
      is_deleted = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE company_code = $1
    RETURNING *
    `,
    [companyCode]
  );
  return result.rows[0];
};

export const createDepartment = async ({ department_name, company_code }) => {
  await pool.query(
    `
    SELECT setval(
      'public.departments_department_id_seq',
      COALESCE((SELECT MAX(department_id) FROM departments), 0) + 1,
      false
    )
    `
  );

  const result = await pool.query(
    `
    INSERT INTO departments (department_name, company_code)
    VALUES ($1, $2)
    RETURNING *
    `,
    [department_name, company_code]
  );
  return result.rows[0];
};

export const updateDepartment = async (departmentId, { department_name, is_active = true }, companyCode) => {
  const result = await pool.query(
    `
    UPDATE departments
    SET
      department_name = $1,
      is_active = $2,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE department_id = $3 AND company_code = $4
    RETURNING *
    `,
    [department_name, is_active, departmentId, companyCode]
  );
  return result.rows[0];
};

export const deleteDepartment = async (departmentId, companyCode) => {
  const result = await pool.query(
    `
    UPDATE departments
    SET
      is_active = false,
      update_timestamp = CURRENT_TIMESTAMP
    WHERE department_id = $1 AND company_code = $2
    RETURNING *
    `,
    [departmentId, companyCode]
  );
  return result.rows[0];
};

export const getCompanySettings = async (companyCode) => {
  const result = await pool.query(
    `
    SELECT company_code, company_name, logo_url, favicon_url, helpdesk_title, title_link,
           smtp_host, smtp_port, smtp_user, smtp_pass, email_from_name, welcome_subject, welcome_template
    FROM companies
    WHERE company_code = $1 AND is_deleted = false
    `,
    [companyCode]
  );
  return result.rows[0];
};

export const updateCompanySettings = async (companyCode, { 
  logo_url, favicon_url, helpdesk_title, title_link,
  smtp_host, smtp_port, smtp_user, smtp_pass, email_from_name, welcome_subject, welcome_template 
}) => {
  const fields = [];
  const params = [];
  let index = 1;

  if (logo_url !== undefined) {
    fields.push(`logo_url = $${index++}`);
    params.push(logo_url);
  }
  if (favicon_url !== undefined) {
    fields.push(`favicon_url = $${index++}`);
    params.push(favicon_url);
  }
  if (helpdesk_title !== undefined) {
    fields.push(`helpdesk_title = $${index++}`);
    params.push(helpdesk_title);
  }
  if (title_link !== undefined) {
    fields.push(`title_link = $${index++}`);
    params.push(title_link);
  }
  if (smtp_host !== undefined) {
    fields.push(`smtp_host = $${index++}`);
    params.push(smtp_host);
  }
  if (smtp_port !== undefined) {
    fields.push(`smtp_port = $${index++}`);
    params.push(smtp_port === "" || smtp_port === null ? null : Number(smtp_port));
  }
  if (smtp_user !== undefined) {
    fields.push(`smtp_user = $${index++}`);
    params.push(smtp_user);
  }
  if (smtp_pass !== undefined) {
    fields.push(`smtp_pass = $${index++}`);
    params.push(smtp_pass);
  }
  if (email_from_name !== undefined) {
    fields.push(`email_from_name = $${index++}`);
    params.push(email_from_name);
  }
  if (welcome_subject !== undefined) {
    fields.push(`welcome_subject = $${index++}`);
    params.push(welcome_subject);
  }
  if (welcome_template !== undefined) {
    fields.push(`welcome_template = $${index++}`);
    params.push(welcome_template);
  }

  if (fields.length === 0) {
    return getCompanySettings(companyCode);
  }

  params.push(companyCode);
  const result = await pool.query(
    `
    UPDATE companies
    SET
      ${fields.join(", ")},
      update_timestamp = CURRENT_TIMESTAMP
    WHERE company_code = $${index}
    RETURNING company_code, company_name, logo_url, favicon_url, helpdesk_title, title_link,
              smtp_host, smtp_port, smtp_user, smtp_pass, email_from_name, welcome_subject, welcome_template
    `,
    params
  );
  return result.rows[0];
};


