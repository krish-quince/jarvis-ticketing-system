import * as tagService from "../services/tag.service.js";
import * as tagRepo from "../repositories/tag.repository.js";

const sendTagError = (res, error) => {
  if (
    error.message === "Ticket not found." ||
    error.message === "Access denied to this ticket."
  ) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message === "tags must be an array of tag names." ||
    error.message === "Tag name cannot be empty." ||
    error.message === "Tag name must be 100 characters or fewer." ||
    error.message === "A ticket cannot have more than 25 tags."
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
};

export const getTags = async (req, res) => {
  try {
    const data = await tagService.getTags(req.user.companyCode);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tags",
    });
  }
};

export const getTicketTags = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const data = await tagService.getTicketTags(
      ticketId,
      req.user.companyCode,
      req.user,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return sendTagError(res, error);
  }
};

export const updateTicketTags = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tags } = req.body;

    const data = await tagService.updateTicketTags(ticketId, tags, req.user);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return sendTagError(res, error);
  }
};

// ── Freeform tag handlers ──────────────────────────────────────────────────────

export const getCompanyFreeformTags = async (req, res) => {
  try {
    const data = await tagRepo.getAllFreeformTagsWithCount(req.user.companyCode);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch freeform tags" });
  }
};

export const getFreeformTicketTags = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const data = await tagRepo.getFreeformTagsForTicket(ticketId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch freeform tags" });
  }
};

export const addFreeformTicketTag = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tag_message } = req.body;

    if (!tag_message || !tag_message.trim()) {
      return res.status(400).json({ success: false, message: "tag_message is required" });
    }
    if (tag_message.trim().length > 100) {
      return res.status(400).json({ success: false, message: "Tag must be 100 characters or fewer" });
    }

    const data = await tagRepo.addFreeformTag(
      ticketId,
      req.user.companyCode,
      tag_message,
      req.user.userCode,
    );
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to add tag" });
  }
};

export const deleteFreeformTicketTag = async (req, res) => {
  try {
    const { ticketId, tagId } = req.params;
    const deleted = await tagRepo.removeFreeformTag(tagId, ticketId, req.user.companyCode);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete tag" });
  }
};
