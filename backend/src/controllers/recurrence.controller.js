import * as recurrenceService from "../services/recurrence.service.js";

const handleRecurrenceError = (res, error) => {
  console.error("Recurrence Controller Error:", error);
  if (error.message === "Ticket not found.") {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message === "Only one active recurrence per ticket." ||
    error.message === "Recurrence configuration not found." ||
    error.message === "Start Date cannot be in the past." ||
    error.message === "End Date must be after Start Date."
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
    detail: error.message,
  });
};

export const getTicketRecurrence = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const data = await recurrenceService.getRecurrence(ticketId, req.user.companyCode);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleRecurrenceError(res, error);
  }
};

export const createTicketRecurrence = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const data = await recurrenceService.createRecurrence(ticketId, req.body, req.user);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleRecurrenceError(res, error);
  }
};

export const updateTicketRecurrence = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const data = await recurrenceService.updateRecurrence(ticketId, req.body, req.user);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleRecurrenceError(res, error);
  }
};

export const deleteTicketRecurrence = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await recurrenceService.deleteRecurrence(ticketId, req.user);

    return res.status(200).json({
      success: true,
      message: "Recurrence disabled.",
      data: result,
    });
  } catch (error) {
    return handleRecurrenceError(res, error);
  }
};
