import pool from "../config/db.js";
import * as ticketRepository from "../repositories/ticket.repository.js";
import * as historyService from "./history.service.js";
import {
  canAccessTicket,
  canManageTicket
} from "../utils/ticketPermissions.js";
import * as masterRepository from "../repositories/master.repository.js";

export const createTicket = async (ticketData, user, files = []) => {
  let category_id = ticketData.category_id;
  let priority_id = ticketData.priority_id;
  let status_id = ticketData.status_id;
  let subcategory_id = ticketData.subcategory_id || null;
  let assigned_to_user_code = ticketData.assigned_to_user_code || null;

  // Resolve IDs by name if provided
  if (ticketData.category_name) {
    const res = await pool.query(
      "SELECT category_id FROM ticket_categories WHERE category_name = $1 AND company_code = $2",
      [ticketData.category_name, user.companyCode],
    );
    if (res.rows.length > 0) category_id = res.rows[0].category_id;
  }
  if (ticketData.priority_name) {
    const res = await pool.query(
      "SELECT priority_id FROM ticket_priorities WHERE priority_name = $1 AND company_code = $2",
      [ticketData.priority_name, user.companyCode],
    );
    if (res.rows.length > 0) priority_id = res.rows[0].priority_id;
  }
  if (ticketData.status_name) {
    const res = await pool.query(
      "SELECT status_id FROM ticket_statuses WHERE status_name = $1 AND company_code = $2",
      [ticketData.status_name, user.companyCode],
    );
    if (res.rows.length > 0) status_id = res.rows[0].status_id;
  }

  // Fallbacks
  if (!category_id) {
    const res = await pool.query(
      "SELECT category_id FROM ticket_categories WHERE company_code = $1 LIMIT 1",
      [user.companyCode],
    );
    category_id = res.rows[0]?.category_id;
  }
  if (!priority_id) {
    const res = await pool.query(
      "SELECT priority_id FROM ticket_priorities WHERE company_code = $1 LIMIT 1",
      [user.companyCode],
    );
    priority_id = res.rows[0]?.priority_id;
  }
  if (!status_id) {
    const res = await pool.query(
      "SELECT status_id FROM ticket_statuses WHERE is_default = true AND company_code = $1 LIMIT 1",
      [user.companyCode],
    );
    status_id = res.rows[0]?.status_id || 1;
  }

  if (assigned_to_user_code) {
    const assignees = assigned_to_user_code.split("|");
    for (const code of assignees) {
      if (!code.trim()) continue;
      const assigneeResult = await pool.query(
        `
      SELECT user_code
      FROM users
      WHERE user_code = $1
      AND company_code = $2
      `,
        [code.trim(), user.companyCode],
      );

      if (assigneeResult.rows.length === 0) {
        throw new Error(`Assigned user "${code}" not found.`);
      }
    }
  }

  const category = await ticketRepository.getCategoryByIdAndCompany(category_id, user.companyCode);

  if (!category) {
    throw new Error("Category not found.");
  }

  if (subcategory_id) {
    const subCategory =
      await masterRepository.getSubCategoryById(subcategory_id, user.companyCode);

    if (!subCategory) {
      throw new Error("Subcategory not found.");
    }

    if (Number(subCategory.category_id) !== Number(category_id)) {
      throw new Error("Subcategory does not belong to selected category.");
    }

    // Manual assignment wins
    if (!assigned_to_user_code) {
      const routingUser = subCategory.assigned_user_code;

      if (routingUser) {
        const routingUsers = routingUser
          .split("|")
          .map((u) => u.trim())
          .filter(Boolean);

        if (routingUsers.length > 0) {
          const randomIndex = Math.floor(Math.random() * routingUsers.length);
          assigned_to_user_code = routingUsers[randomIndex];

          // Allocate to all of them (excluding the assigned one)
          const allocatedList = routingUsers.filter(
            (code) => code !== assigned_to_user_code,
          );
          if (allocatedList.length > 0) {
            ticketData.allocated_to_user_code = allocatedList.join("|");
          }
        }
      }
    }
  }

  let allocated_to_user_code = ticketData.allocated_to_user_code || null;

  // Let's validate allocated users if provided
  if (allocated_to_user_code) {
    const allocatedCodes = allocated_to_user_code.split("|").map(c => c.trim()).filter(Boolean);
    for (const code of allocatedCodes) {
      const userRes = await pool.query(
        "SELECT user_code FROM users WHERE user_code = $1 AND company_code = $2 AND is_active = true",
        [code, user.companyCode]
      );
      if (userRes.rows.length === 0) {
        throw new Error(`Allocated user "${code}" not found or inactive.`);
      }
    }
  }

  // If manual assign_to is provided, validate it belongs to the assignable pool
  if (assigned_to_user_code) {
    const assignableUsers = await masterRepository.getAssignableUsers(
      {
        subcategoryId: subcategory_id,
        categoryId: category_id,
        departmentId: user.departmentId,
      },
      user.companyCode,
    );
    const canAssignToUser = assignableUsers.some(
      (assignableUser) =>
        assignableUser.user_code === assigned_to_user_code,
    );

    if (!canAssignToUser) {
      throw new Error(
        "Assigned user must belong to the ticket category or department.",
      );
    }
  } else {
    // If no assigned user is selected, check if we have allocated users
    if (allocated_to_user_code) {
      const allocatedCodes = allocated_to_user_code.split("|").map(c => c.trim()).filter(Boolean);
      if (allocatedCodes.length > 0) {
        // Ticket can be assigned to only 1 person at a time (e.g. the first one in allocated list)
        assigned_to_user_code = allocatedCodes[0];
      }
    }
  }

  const payload = {
    subject: ticketData.subject,
    description: ticketData.description,

    category_id,
    subcategory_id,

    priority_id,
    status_id,

    assigned_to_user_code,
    allocated_to_user_code,
    
    due_date: ticketData.due_date || null,

    raisedByUserCode: user.userCode,
    companyCode: user.companyCode,

    department_id: user.departmentId,
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ticket = await ticketRepository.createTicket(payload, client);

    const attachments = await ticketRepository.createTicketAttachments(
      ticket.ticket_id,
      user.userCode,
      files,
      client,
    );

    await historyService.createHistory(
      ticket.ticket_id,
      "Created",
      "",
      "Ticket Created",
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return { ...ticket, attachments };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllTickets = async (companyCode, user, search, page, limit, sortBy, sortOrder) => {
  return await ticketRepository.getAllTickets(
    companyCode,
    user,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  );
};

export const getTicketById = async (ticketId, companyCode, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId, companyCode);
  if (!ticket) return null;
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }
  return ticket;
};

export const updateTicketStatus = async (ticketId, statusId, user) => {
  if (!statusId) {
    throw new Error("status_id is required.");
  }

  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Update status permission:
  if (!canManageTicket(ticket, user)) {
    const isCreator = ticket.raised_by_user_code === user.userCode;
    const statusRes = await pool.query(
      "SELECT status_name FROM ticket_statuses WHERE status_id = $1",
      [statusId],
    );
    const statusName = statusRes.rows[0]?.status_name || "";
    if (isCreator && statusName.toLowerCase() === "closed") {
      // Allowed to close their own ticket
    } else {
      throw new Error(
        "Access denied. Customers can only close their own tickets.",
      );
    }
  }

  const status = await ticketRepository.getStatusByIdAndCompany(statusId, user.companyCode);

  if (!status) {
    throw new Error("Status not found.");
  }

  if (String(ticket.status_id) === String(statusId)) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketStatus(
      ticketId,
      statusId,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Status",
      String(ticket.status_id),
      String(statusId),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const assignTicket = async (ticketId, assignedToUserCode, user) => {
  if (!assignedToUserCode) {
    throw new Error("assigned_to_user_code is required.");
  }

  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Assign Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error("Access denied. Only technicians can assign tickets.");
  }

  // A ticket can be assigned to only 1 person at a time
  if (assignedToUserCode.includes("|")) {
    throw new Error("A ticket can be assigned to only 1 person at a time.");
  }

  const assignee = await ticketRepository.getUserByCodeAndCompany(
    assignedToUserCode.trim(),
    user.companyCode,
  );

  if (!assignee) {
    throw new Error(`Assigned user "${assignedToUserCode}" not found.`);
  }

  const oldValue = ticket.assigned_to_user_code ?? "";

  if (String(oldValue) === String(assignedToUserCode)) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketAssignee(
      ticketId,
      assignedToUserCode,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "AssignedTo",
      String(oldValue),
      String(assignedToUserCode),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateTicketAllocated = async (ticketId, allocatedToUserCode, user) => {
  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Assign/Allocate Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error("Access denied. Only technicians can allocate tickets.");
  }

  if (allocatedToUserCode) {
    const codes = allocatedToUserCode.split("|").map(c => c.trim()).filter(Boolean);
    for (const code of codes) {
      const dbUser = await ticketRepository.getUserByCodeAndCompany(
        code,
        user.companyCode,
      );
      if (!dbUser) {
        throw new Error(`Allocated user "${code}" not found.`);
      }
    }
  }

  const oldValue = ticket.allocated_to_user_code ?? "";

  if (String(oldValue) === String(allocatedToUserCode)) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketAllocated(
      ticketId,
      allocatedToUserCode,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Allocations",
      String(oldValue),
      String(allocatedToUserCode),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateTicketPriority = async (ticketId, priorityId, user) => {
  if (!priorityId) {
    throw new Error("priority_id is required.");
  }

  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Priority Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error(
      "Access denied. Only technicians can update ticket priority.",
    );
  }

  const priority = await ticketRepository.getPriorityByIdAndCompany(priorityId, user.companyCode);

  if (!priority) {
    throw new Error("Priority not found.");
  }

  if (String(ticket.priority_id) === String(priorityId)) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketPriority(
      ticketId,
      priorityId,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Priority",
      String(ticket.priority_id),
      String(priorityId),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateTicketCategory = async (
  ticketId,
  categoryId,
  subCategoryId,
  user,
) => {
  if (!categoryId) {
    throw new Error("category_id is required.");
  }

  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update access 
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Category Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error(
      "Access denied. Only technicians can update ticket category.",
    );
  }

  const category = await ticketRepository.getCategoryByIdAndCompany(categoryId, user.companyCode);

  if (!category) {
    throw new Error("Category not found.");
  }

  let subCategory = null;

  if (subCategoryId) {
    subCategory = await ticketRepository.getSubCategoryById(subCategoryId, user.companyCode);

    if (!subCategory) {
      throw new Error("Subcategory not found.");
    }

    if (String(subCategory.category_id) !== String(categoryId)) {
      throw new Error("Subcategory does not belong to selected category.");
    }
  }

  if (
    String(ticket.category_id) === String(categoryId) &&
    String(ticket.subcategory_id || "") === String(subCategoryId || "")
  ) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketCategory(
      ticketId,
      categoryId,
      subCategoryId,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Category",
      String(ticket.category_id),
      String(categoryId),
      user.userCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Subcategory",
      String(ticket.subcategory_id || ""),
      String(subCategoryId || ""),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const resolveTicket = async (ticketId, statusId, user) => {
  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  const resolvedStatus = statusId
    ? await ticketRepository.getStatusByIdAndCompany(statusId, user.companyCode)
    : await ticketRepository.getResolvedStatusByCompany(user.companyCode);

  if (!resolvedStatus) {
    throw new Error("Resolved status not found.");
  }

  const oldResolvedBy = ticket.resolved_by_user_code ?? "";
  const nextStatusId = resolvedStatus.status_id;

  if (
    oldResolvedBy === user.userCode &&
    String(ticket.status_id) === String(nextStatusId)
  ) {
    return ticket;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultTicket = await ticketRepository.resolveTicket(
      ticketId,
      user.userCode,
      nextStatusId,
      user.companyCode,
      client,
    );

    if (String(ticket.status_id) !== String(nextStatusId)) {
      await historyService.createHistory(
        ticketId,
        "Status",
        String(ticket.status_id),
        String(nextStatusId),
        user.userCode,
        client,
      );
    }

    if (oldResolvedBy !== user.userCode) {
      await historyService.createHistory(
        ticketId,
        "Resolution",
        String(oldResolvedBy),
        String(user.userCode),
        user.userCode,
        client,
      );
    }

    await client.query("COMMIT");

    return resultTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const takeoverTicket = async (ticketId, user) => {
  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Cant update closed ticket.");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Validate that the takeover user is in the allocated list (or they are superadmin/admin)
  const isTechnicianAdmin = [1, 4].includes(Number(user.roleId));
  const allocatedList = ticket.allocated_to_user_code
    ? ticket.allocated_to_user_code.split("|").map(c => c.trim()).filter(Boolean)
    : [];
  const isAllocated = allocatedList.includes(user.userCode);

  if (!isAllocated && !isTechnicianAdmin) {
    throw new Error("Only allocated people can takeover this ticket.");
  }

  const previousAssignee = ticket.assigned_to_user_code ?? "";

  if (previousAssignee === user.userCode) {
    return ticket;
  }

  // Shift previous assignee to allocated list, and set user as assigned
  let nextAllocatedList = [...allocatedList];
  if (previousAssignee && !nextAllocatedList.includes(previousAssignee)) {
    nextAllocatedList.push(previousAssignee);
  }
  // Remove the taker-over from the allocated list since they are now assigned
  nextAllocatedList = nextAllocatedList.filter(code => code !== user.userCode);

  const nextAllocatedString = nextAllocatedList.join("|") || null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketAssignAndAllocate(
      ticketId,
      user.userCode,
      nextAllocatedString,
      user.companyCode,
      client,
    );

    // Create history logs
    await historyService.createHistory(
      ticketId,
      "Takeover",
      String(previousAssignee),
      String(user.userCode),
      user.userCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Allocations",
      String(ticket.allocated_to_user_code ?? ""),
      String(nextAllocatedString ?? ""),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateTicketDueDate = async (ticketId, dueDate, user) => {
  if (!dueDate) {
    throw new Error("due_date is required.");
  }

  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if(ticket.status_name == "Closed") {
    throw new Error("Can't update closed ticket.");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  if (!canManageTicket(ticket, user)) {
    throw new Error("Access denied. Only technicians can update due date.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketDueDate(
      ticketId,
      dueDate,
      user.companyCode,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "DueDate",
      ticket.due_date ? String(ticket.due_date) : "",
      String(dueDate),
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    return updatedTicket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
