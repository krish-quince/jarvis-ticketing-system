import API from "./api";

const unwrapData = <T,>(responseData: { data?: T } | T): T =>
  (responseData as { data?: T })?.data ?? (responseData as T);

// ── Legacy admin-catalog tags (kept for backward compat) ──────────────────────
export interface Tag {
  tag_id: number;
  tag_name: string;
  tag_color: string | null;
  is_active?: boolean;
}

export const getTags = async (): Promise<Tag[]> => {
  const response = await API.get("/tickets/tags");
  return unwrapData(response.data);
};

export const getTicketTags = async (ticketId: number): Promise<Tag[]> => {
  const response = await API.get(`/tickets/${ticketId}/tags`);
  return unwrapData(response.data);
};

export const updateTicketTags = async (
  ticketId: number,
  tagNames: string[],
): Promise<Tag[]> => {
  const response = await API.put(`/tickets/${ticketId}/tags`, {
    tags: tagNames,
  });
  return unwrapData(response.data);
};

// ── Freeform tags ─────────────────────────────────────────────────────────────
export interface FreeformTag {
  id: number;
  tag_message: string;
  user_code: string;
  created_at: string;
}

export interface FreeformTagCount {
  tag_message: string;
  ticket_count: number;
}

export const getFreeformTicketTags = async (ticketId: number): Promise<FreeformTag[]> => {
  const response = await API.get(`/tickets/${ticketId}/freeform-tags`);
  return unwrapData(response.data);
};

export const addFreeformTag = async (
  ticketId: number,
  tagMessage: string,
): Promise<FreeformTag> => {
  const response = await API.post(`/tickets/${ticketId}/freeform-tags`, {
    tag_message: tagMessage,
  });
  return unwrapData(response.data);
};

export const deleteFreeformTag = async (
  ticketId: number,
  tagId: number,
): Promise<void> => {
  await API.delete(`/tickets/${ticketId}/freeform-tags/${tagId}`);
};

export const getCompanyFreeformTags = async (): Promise<FreeformTagCount[]> => {
  const response = await API.get("/tickets/freeform-tags");
  return unwrapData(response.data);
};
