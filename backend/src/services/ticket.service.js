import pool from "../config/db.js";
import * as ticketRepository from "../repositories/ticket.repository.js";
import * as historyService from "./history.service.js";
import { sendNewTicketNotifications } from "./email.service.js";
import {
  canAccessTicket,
  canManageTicket,
  checkAllocatedTakeoverBlock
} from "../utils/ticketPermissions.js";
import * as masterRepository from "../repositories/master.repository.js";
import * as tagRepository from "../repositories/tag.repository.js";

export const createTicket = async (ticketData, user, files = []) => {
  const ticketNo = `TKT-${Date.now()}`;

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

  let allocated_to_user_code = null;

  if (subcategory_id) {
    const subCategory =
      await masterRepository.getSubCategoryById(subcategory_id, user.companyCode);

    if (!subCategory) {
      throw new Error("Subcategory not found.");
    }

    if (Number(subCategory.category_id) !== Number(category_id)) {
      throw new Error("Subcategory does not belong to selected category.");
    }

    const routingUser = subCategory.assigned_user_code;
    if (routingUser) {
      const routingUsers = routingUser
        .split("|")
        .map((u) => u.trim())
        .filter(Boolean);

      if (routingUsers.length > 0) {
        // Automatic assignment if no user is manually assigned
        if (!assigned_to_user_code) {
          const randomIndex = Math.floor(Math.random() * routingUsers.length);
          assigned_to_user_code = routingUsers[randomIndex];
        }

        // Allocate all routing users of the subcategory
        const allocatedList = routingUsers;
        if (allocatedList.length > 0) {
          allocated_to_user_code = allocatedList.join("|");
        }
      }
    }
  }

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

  // Backend Validation for on-behalf ticket creation
  const isOnBehalf = ticketData.submit_for_another_user === true || ticketData.submit_for_another_user === "true";
  if (isOnBehalf && !ticketData.raised_by_user_code) {
    throw new Error("Selected user is required when submitting on behalf of another user.");
  }

  const raisedByUserCode = isOnBehalf 
    ? ticketData.raised_by_user_code 
    : user.userCode;

  const createdByUserCode = isOnBehalf
    ? user.userCode
    : null;

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

    ticketNo,

    raisedByUserCode,
    created_by_user_code: createdByUserCode,
    ticket_source: ticketData.ticket_source || 'WebApp',
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

    let tags = [];

    // Tags arrive differently depending on the client:
    // - multipart/form-data (current frontend): JSON.stringify'd array as a string, e.g. '["Bug","Urgent"]'
    // - JSON body: a real array
    // - legacy free-text input: a comma-separated string, e.g. "Bug, Urgent"
    let rawTags = ticketData.tags;

    if (typeof rawTags === "string") {
      const trimmedRaw = rawTags.trim();
      if (trimmedRaw.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmedRaw);
          rawTags = Array.isArray(parsed) ? parsed : [];
        } catch {
          rawTags = trimmedRaw ? trimmedRaw.split(",") : [];
        }
      } else {
        rawTags = trimmedRaw ? trimmedRaw.split(",") : [];
      }
    }

    if (!Array.isArray(rawTags)) {
      rawTags = [];
    }

    const uniqueTagNames = [
      ...new Map(
        rawTags
          .map((name) => String(name ?? "").trim())
          .filter(Boolean)
          .map((name) => [name.toLowerCase(), name]),
      ).values(),
    ];

    if (uniqueTagNames.length > 25) {
      throw new Error("A ticket cannot have more than 25 tags.");
    }

    for (const tagName of uniqueTagNames) {
      let tag = await tagRepository.getTagByNameAndCompany(
        tagName,
        user.companyCode,
        client,
      );

      if (!tag) {
        tag = await tagRepository.createTag(
          { tag_name: tagName, company_code: user.companyCode },
          client,
        );
      } else if (!tag.is_active) {
        tag = await tagRepository.reactivateTag(tag.tag_id, client);
      }

      await tagRepository.addTicketTag(ticket.ticket_id, tag.tag_id, client);
      tags.push(tag);
    }

    let historyMsg = "Ticket Created";
    if (payload.created_by_user_code) {
      const creatorRes = await client.query(
        "SELECT first_name, last_name FROM users WHERE user_code = $1",
        [payload.created_by_user_code]
      );
      const raisedByRes = await client.query(
        "SELECT first_name, last_name FROM users WHERE user_code = $1",
        [payload.raisedByUserCode]
      );
      const creatorName = creatorRes.rows.length > 0 
        ? [creatorRes.rows[0].first_name, creatorRes.rows[0].last_name].filter(Boolean).join(" ")
        : payload.created_by_user_code;
      const raisedByName = raisedByRes.rows.length > 0 
        ? [raisedByRes.rows[0].first_name, raisedByRes.rows[0].last_name].filter(Boolean).join(" ")
        : payload.raisedByUserCode;
      
      historyMsg = `Ticket created by ${creatorName} on behalf of ${raisedByName}`;
    }

    await historyService.createHistory(
      ticket.ticket_id,
      "Created",
      "",
      historyMsg,
      user.userCode,
      client,
    );

    await client.query("COMMIT");

    // Asynchronously send new ticket notifications based on user preferences
    sendNewTicketNotifications(
      { ...ticket, description: ticketData.description },
      ticketData.suppress_user_email === true || ticketData.suppress_user_email === "true",
      ticketData.suppress_tech_email === true || ticketData.suppress_tech_email === "true"
    ).catch((notifErr) => {
      console.error("Error triggering new ticket notifications:", notifErr);
    });

    return { ...ticket, attachments, tags };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllTickets = async (companyCode, user, search, page, limit, sortBy, sortOrder, tagFilter = "") => {
  return await ticketRepository.getAllTickets(
    companyCode,
    user,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
    tagFilter,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  checkAllocatedTakeoverBlock(ticket, user);

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

  const status = await ticketRepository.getStatusByIdAndCompany(statusId, ticket.company_code);

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
      ticket.company_code,
      user.userCode,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  checkAllocatedTakeoverBlock(ticket, user);

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
    ticket.company_code,
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
      ticket.company_code,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
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
        ticket.company_code,
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
      ticket.company_code,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  checkAllocatedTakeoverBlock(ticket, user);

  // Check Priority Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error(
      "Access denied. Only technicians can update ticket priority.",
    );
  }

  const priority = await ticketRepository.getPriorityByIdAndCompany(priorityId, ticket.company_code);

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
      ticket.company_code,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update access 
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  checkAllocatedTakeoverBlock(ticket, user);

  // Check Category Permission
  if (!canManageTicket(ticket, user)) {
    throw new Error(
      "Access denied. Only technicians can update ticket category.",
    );
  }

  const category = await ticketRepository.getCategoryByIdAndCompany(categoryId, ticket.company_code);

  if (!category) {
    throw new Error("Category not found.");
  }

  let subCategory = null;

  if (subCategoryId) {
    subCategory = await masterRepository.getSubCategoryById(subCategoryId, ticket.company_code);

    if (!subCategory) {
      throw new Error("Subcategory not found.");
    }

    if (String(subCategory.category_id) !== String(categoryId)) {
      throw new Error("Subcategory does not belong to selected category.");
    }
  }

  let allocatedToUserCode = null;
  let assignedToUserCode = ticket.assigned_to_user_code;

  if (subCategory && subCategory.assigned_user_code) {
    const routingUsers = subCategory.assigned_user_code
      .split("|")
      .map((u) => u.trim())
      .filter(Boolean);

    if (routingUsers.length > 0) {
      allocatedToUserCode = routingUsers.join("|");
      if (!assignedToUserCode || !routingUsers.includes(assignedToUserCode)) {
        const randomIndex = Math.floor(Math.random() * routingUsers.length);
        assignedToUserCode = routingUsers[randomIndex];
      }
    }
  }

  if (allocatedToUserCode) {
    const allocatedCodes = allocatedToUserCode.split("|").map(c => c.trim()).filter(Boolean);
    for (const code of allocatedCodes) {
      const userRes = await pool.query(
        "SELECT user_code FROM users WHERE user_code = $1 AND company_code = $2 AND is_active = true",
        [code, ticket.company_code]
      );
      if (userRes.rows.length === 0) {
        throw new Error(`Allocated user "${code}" not found or inactive.`);
      }
    }
  }

  if (
    String(ticket.category_id) === String(categoryId) &&
    String(ticket.subcategory_id || "") === String(subCategoryId || "") &&
    String(ticket.allocated_to_user_code || "") === String(allocatedToUserCode || "") &&
    String(ticket.assigned_to_user_code || "") === String(assignedToUserCode || "")
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
      allocatedToUserCode,
      assignedToUserCode,
      ticket.company_code,
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

    if (String(ticket.allocated_to_user_code || "") !== String(allocatedToUserCode || "")) {
      await historyService.createHistory(
        ticketId,
        "Allocations",
        String(ticket.allocated_to_user_code || ""),
        String(allocatedToUserCode || ""),
        user.userCode,
        client,
      );
    }

    if (String(ticket.assigned_to_user_code || "") !== String(assignedToUserCode || "")) {
      await historyService.createHistory(
        ticketId,
        "AssignedTo",
        String(ticket.assigned_to_user_code || ""),
        String(assignedToUserCode || ""),
        user.userCode,
        client,
      );
    }

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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  // Check Read & update access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  const resolvedStatus = statusId
    ? await ticketRepository.getStatusByIdAndCompany(statusId, ticket.company_code)
    : await ticketRepository.getResolvedStatusByCompany(ticket.company_code);

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
      ticket.company_code,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
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
      ticket.company_code,
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

  if (ticket.is_closed_status || ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close") {
    throw new Error("Can't update closed ticket.");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  checkAllocatedTakeoverBlock(ticket, user);

  if (!canManageTicket(ticket, user)) {
    throw new Error("Access denied. Only technicians can update due date.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketDueDate(
      ticketId,
      dueDate,
      ticket.company_code,
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

export const deleteAttachment = async (type, attachmentId) => {
  return await ticketRepository.deleteAttachment(type, attachmentId);
};

export const reopenTicket = async (ticketId, user) => {
  const ticket = await ticketRepository.getTicketById(
    ticketId,
    user.companyCode,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  const currentStatusRes = await pool.query(
    "SELECT is_closed_status FROM ticket_statuses WHERE status_id = $1 AND company_code = $2",
    [ticket.status_id, ticket.company_code]
  );
  const currentStatus = currentStatusRes.rows[0];
  const isClosed = ticket.is_closed_status || (currentStatus ? currentStatus.is_closed_status : (ticket.status_name?.toLowerCase() === "closed" || ticket.status_name?.toLowerCase() === "close"));

  if (!isClosed) {
    throw new Error("Ticket is not closed.");
  }

  const isCreator = ticket.raised_by_user_code === user.userCode;
  const isAssigned = ticket.assigned_to_user_code === user.userCode;
  const isAdminOrSuper = [1, 4].includes(Number(user.roleId));

  if (!isCreator && !isAssigned && !isAdminOrSuper) {
    throw new Error("Access denied. Only the creator, assigned user, or an administrator can reopen this ticket.");
  }

  let targetStatusId = null;
  
  const inProgressRes = await pool.query(
    `SELECT status_id FROM ticket_statuses 
     WHERE company_code = $1 
     AND LOWER(status_name) = 'in progress' 
     AND is_active = true 
     LIMIT 1`,
    [ticket.company_code]
  );
  
  if (inProgressRes.rows.length > 0) {
    targetStatusId = inProgressRes.rows[0].status_id;
  } else {
    const defaultRes = await pool.query(
      `SELECT status_id FROM ticket_statuses 
       WHERE company_code = $1 
       AND is_default = true 
       AND is_active = true 
       LIMIT 1`,
      [ticket.company_code]
    );
    if (defaultRes.rows.length > 0) {
      targetStatusId = defaultRes.rows[0].status_id;
    } else {
      const fallbackRes = await pool.query(
        `SELECT status_id FROM ticket_statuses 
         WHERE company_code = $1 
         AND is_closed_status = false 
         AND is_active = true 
         ORDER BY display_order ASC, status_id ASC 
         LIMIT 1`,
        [ticket.company_code]
      );
      if (fallbackRes.rows.length > 0) {
        targetStatusId = fallbackRes.rows[0].status_id;
      }
    }
  }

  if (!targetStatusId) {
    throw new Error("No active open status found to reopen the ticket.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedTicket = await ticketRepository.updateTicketStatus(
      ticketId,
      targetStatusId,
      ticket.company_code,
      null,
      client,
    );

    await historyService.createHistory(
      ticketId,
      "Status",
      String(ticket.status_id),
      String(targetStatusId),
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

export const toggleTicketPin = async (ticketId, isPinned, companyCode) => {
  return await ticketRepository.updateTicketPin(ticketId, isPinned, companyCode);
};

export const deleteTicket = async (ticketId, companyCode) => {
  const result = await ticketRepository.deleteTicket(ticketId, companyCode);
  if (!result) {
    throw new Error("Ticket not found.");
  }
  return result;
};
