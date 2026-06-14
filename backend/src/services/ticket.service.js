import pool from "../config/db.js";
import * as ticketRepository from "../repositories/ticket.repository.js";
import * as historyService from "./history.service.js";
import {
  canAccessTicket,
  canManageTicket,
} from "../utils/ticketPermissions.js";

export const createTicket = async (ticketData, user) => {
  const ticketNo = `TKT-${Date.now()}`;

  let category_id = ticketData.category_id;
  let priority_id = ticketData.priority_id;
  let status_id = ticketData.status_id;

  // Resolve IDs by name if provided
  if (ticketData.category_name) {
    const res = await pool.query(
      "SELECT category_id FROM ticket_categories WHERE category_name = $1 AND company_id = $2",
      [ticketData.category_name, user.companyId],
    );
    if (res.rows.length > 0) category_id = res.rows[0].category_id;
  }
  if (ticketData.priority_name) {
    const res = await pool.query(
      "SELECT priority_id FROM ticket_priorities WHERE priority_name = $1 AND company_id = $2",
      [ticketData.priority_name, user.companyId],
    );
    if (res.rows.length > 0) priority_id = res.rows[0].priority_id;
  }
  if (ticketData.status_name) {
    const res = await pool.query(
      "SELECT status_id FROM ticket_statuses WHERE status_name = $1 AND company_id = $2",
      [ticketData.status_name, user.companyId],
    );
    if (res.rows.length > 0) status_id = res.rows[0].status_id;
  }

  // Fallbacks
  if (!category_id) {
    const res = await pool.query(
      "SELECT category_id FROM ticket_categories WHERE company_id = $1 LIMIT 1",
      [user.companyId],
    );
    category_id = res.rows[0]?.category_id;
  }
  if (!priority_id) {
    const res = await pool.query(
      "SELECT priority_id FROM ticket_priorities WHERE company_id = $1 LIMIT 1",
      [user.companyId],
    );
    priority_id = res.rows[0]?.priority_id;
  }
  if (!status_id) {
    const res = await pool.query(
      "SELECT status_id FROM ticket_statuses WHERE company_id = $1 AND is_default = true LIMIT 1",
      [user.companyId],
    );
    status_id = res.rows[0]?.status_id || 1;
  }

  const payload = {
    subject: ticketData.subject,
    description: ticketData.description,
    category_id,
    priority_id,
    status_id,
    ticketNo,
    raisedByUserCode: user.userCode,
    companyId: user.companyId,
    department: user.department || "General",
  };

  return await ticketRepository.createTicket(payload);
};

export const getAllTickets = async (companyId, user, search, page, limit) => {
  return await ticketRepository.getAllTickets(
    companyId,
    user,
    search,
    page,
    limit,
  );
};

export const getTicketById = async (ticketId, companyId, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId, companyId);
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

  const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Update status permission:
  if (!canManageTicket(user)) {
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

  const status = await ticketRepository.getStatusByIdAndCompany(
    statusId,
    user.companyId,
  );

  if (!status) {
    throw new Error("Status not found.");
  }

  if (String(ticket.status_id) === String(statusId)) {
    return ticket;
  }

  const updatedTicket = await ticketRepository.updateTicketStatus(
    ticketId,
    statusId,
    user.companyId,
  );

  await historyService.createHistory(
    ticketId,
    "Status",
    String(ticket.status_id),
    String(statusId),
    user.userCode,
  );

  return updatedTicket;
};

export const assignTicket = async (ticketId, assignedToUserCode, user) => {
  if (!assignedToUserCode) {
    throw new Error("assigned_to_user_code is required.");
  }

  const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Assign Permission
  if (!canManageTicket(user)) {
    throw new Error("Access denied. Only technicians can assign tickets.");
  }

  const assignee = await ticketRepository.getUserByCodeAndCompany(
    assignedToUserCode,
    user.companyId,
  );

  if (!assignee) {
    throw new Error("Assigned user not found.");
  }

  const oldValue = ticket.assigned_to_user_code ?? "";

  if (String(oldValue) === String(assignedToUserCode)) {
    return ticket;
  }

  const updatedTicket = await ticketRepository.updateTicketAssignee(
    ticketId,
    assignedToUserCode,
    user.companyId,
  );

  await historyService.createHistory(
    ticketId,
    "AssignedTo",
    String(oldValue),
    String(assignedToUserCode),
    user.userCode,
  );

  return updatedTicket;
};

export const updateTicketPriority = async (ticketId, priorityId, user) => {
  if (!priorityId) {
    throw new Error("priority_id is required.");
  }

  const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Priority Permission
  if (!canManageTicket(user)) {
    throw new Error("Access denied. Only technicians can update ticket priority.");
  }

  const priority = await ticketRepository.getPriorityByIdAndCompany(
    priorityId,
    user.companyId,
  );

  if (!priority) {
    throw new Error("Priority not found.");
  }

  if (String(ticket.priority_id) === String(priorityId)) {
    return ticket;
  }

  const updatedTicket = await ticketRepository.updateTicketPriority(
    ticketId,
    priorityId,
    user.companyId,
  );

  await historyService.createHistory(
    ticketId,
    "Priority",
    String(ticket.priority_id),
    String(priorityId),
    user.userCode,
  );

  return updatedTicket;
};

export const updateTicketCategory = async (ticketId, categoryId, user) => {
  if (!categoryId) {
    throw new Error("category_id is required.");
  }

  const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Category Permission
  if (!canManageTicket(user)) {
    throw new Error("Access denied. Only technicians can update ticket category.");
  }

  const category = await ticketRepository.getCategoryByIdAndCompany(
    categoryId,
    user.companyId,
  );

  if (!category) {
    throw new Error("Category not found.");
  }

  if (String(ticket.category_id) === String(categoryId)) {
    return ticket;
  }

  const updatedTicket = await ticketRepository.updateTicketCategory(
    ticketId,
    categoryId,
    user.companyId,
  );

  await historyService.createHistory(
    ticketId,
    "Category",
    String(ticket.category_id),
    String(categoryId),
    user.userCode,
  );

  return updatedTicket;
};

export const resolveTicket = async (ticketId, statusId, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  // Check Read Access
  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Check Resolve Permission
  if (!canManageTicket(user)) {
    throw new Error("Access denied. Only technicians can resolve tickets.");
  }

  const resolvedStatus = statusId
    ? await ticketRepository.getStatusByIdAndCompany(statusId, user.companyId)
    : await ticketRepository.getResolvedStatusByCompany(user.companyId);

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

  const updatedTicket = await pool.query(
    `
            UPDATE tickets
            SET
                status_id = $1,
                resolved_by_user_code = $2,
                resolution_date = CURRENT_TIMESTAMP,
                update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $3 AND company_id = $4
            RETURNING *
        `,
    [nextStatusId, user.userCode, ticketId, user.companyId],
  );

  const resultTicket = updatedTicket.rows[0];

  if (String(ticket.status_id) !== String(nextStatusId)) {
    await historyService.createHistory(
      ticketId,
      "Status",
      String(ticket.status_id),
      String(nextStatusId),
      user.userCode,
    );
  }

  if (oldResolvedBy !== user.userCode) {
    await historyService.createHistory(
      ticketId,
      "Resolution",
      String(oldResolvedBy),
      String(user.userCode),
      user.userCode,
    );
  }

  return resultTicket;
};
