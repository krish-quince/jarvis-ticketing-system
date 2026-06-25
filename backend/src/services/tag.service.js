import pool from "../config/db.js";
import * as tagRepository from "../repositories/tag.repository.js";
import * as ticketRepository from "../repositories/ticket.repository.js";
import * as historyService from "./history.service.js";
import { canAccessTicket } from "../utils/ticketPermissions.js";

export const getTags = async (companyCode) => {
  return tagRepository.getTagsByCompany(companyCode);
};

export const getTicketTags = async (ticketId, companyCode, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId, companyCode);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  return tagRepository.getTagsForTicket(ticketId);
};

// Finds an existing tag by name (case-insensitive) for the company, or creates it.
// If a soft-deleted tag with the same name exists, it gets reactivated instead of duplicated.
const findOrCreateTag = async (tagName, companyCode, client) => {
  const trimmedName = tagName.trim();

  if (!trimmedName) {
    throw new Error("Tag name cannot be empty.");
  }

  if (trimmedName.length > 100) {
    throw new Error("Tag name must be 100 characters or fewer.");
  }

  const existing = await tagRepository.getTagByNameAndCompany(
    trimmedName,
    companyCode,
    client,
  );

  if (existing) {
    if (!existing.is_active) {
      return tagRepository.reactivateTag(existing.tag_id, client);
    }
    return existing;
  }

  return tagRepository.createTag(
    { tag_name: trimmedName, company_code: companyCode },
    client,
  );
};

// Replaces the full set of tags on a ticket with the provided list of tag names.
// Tags are auto-created if they don't exist yet (Jitbit-style), and any tag that
// ends up with zero ticket associations after the change is auto-deleted.
export const updateTicketTags = async (ticketId, tagNames, user) => {
  if (!Array.isArray(tagNames)) {
    throw new Error("tags must be an array of tag names.");
  }

  const ticket = await ticketRepository.getTicketById(ticketId, user.companyCode);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new Error("Access denied to this ticket.");
  }

  // Normalize: trim, drop empties, de-dupe case-insensitively (last write wins on casing)
  const seen = new Map();
  for (const rawName of tagNames) {
    const trimmed = String(rawName ?? "").trim();
    if (!trimmed) continue;
    seen.set(trimmed.toLowerCase(), trimmed);
  }
  const uniqueNames = [...seen.values()];

  if (uniqueNames.length > 25) {
    throw new Error("A ticket cannot have more than 25 tags.");
  }

  const previousTags = await tagRepository.getTagsForTicket(ticketId);
  const previousTagIds = previousTags.map((t) => t.tag_id);
  const previousNames = previousTags.map((t) => t.tag_name).sort();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resolvedTags = [];
    for (const name of uniqueNames) {
      const tag = await findOrCreateTag(name, user.companyCode, client);
      resolvedTags.push(tag);
    }

    await tagRepository.removeAllTicketTags(ticketId, client);

    for (const tag of resolvedTags) {
      await tagRepository.addTicketTag(ticketId, tag.tag_id, client);
    }

    const newNames = resolvedTags.map((t) => t.tag_name).sort();

    if (newNames.join(", ") !== previousNames.join(", ")) {
      await historyService.createHistory(
        ticketId,
        "Tags",
        previousNames.join(", "),
        newNames.join(", "),
        user.userCode,
        client,
      );
    }

    await client.query("COMMIT");

    // Clean up orphaned tags (no longer linked to any ticket) outside the main
    // transaction's critical path, but still awaited so the caller gets a consistent view.
    const candidateOrphanIds = previousTagIds.filter(
      (id) => !resolvedTags.some((t) => t.tag_id === id),
    );
    if (candidateOrphanIds.length > 0) {
      await tagRepository.deleteOrphanTags(candidateOrphanIds);
    }

    return tagRepository.getTagsForTicket(ticketId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
