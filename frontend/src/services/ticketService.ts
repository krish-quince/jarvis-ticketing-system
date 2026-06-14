import API from "./api";

export const getTickets = async () => {
  const response =
    await API.get("/tickets");

  return response.data.data;
};

export const getTicketById = async (
  id: number
) => {
  const response =
    await API.get(
      `/tickets/${id}`
    );

  return response.data.data;
};

export const createTicket = async (
  ticketData: any
) => {
  const response =
    await API.post(
      "/tickets",
      ticketData
    );

  return response.data.data;
};

export const updateTicket = async (
  id: number,
  ticketData: any
) => {
  const response =
    await API.put(
      `/tickets/${id}`,
      ticketData
    );

  return response.data;
};

export const deleteTicket = async (
  id: number
) => {
  const response =
    await API.delete(
      `/tickets/${id}`
    );

  return response.data;
};

export const updateTicketStatus = async (id: number, statusId: number) => {
  const response = await API.patch(`/tickets/${id}/status`, { status_id: statusId });
  return response.data;
};

export const updateTicketPriority = async (id: number, priorityId: number) => {
  const response = await API.patch(`/tickets/${id}/priority`, { priority_id: priorityId });
  return response.data;
};

export const assignTicket = async (id: number, userCode: string) => {
  const response = await API.patch(`/tickets/${id}/assign`, { assigned_to_user_code: userCode });
  return response.data;
};

export const getComments = async (ticketId: number) => {
  const response = await API.get(`/tickets/${ticketId}/comments`);
  return response.data.data;
};

export const createComment = async (ticketId: number, commentText: string) => {
  const response = await API.post(`/tickets/${ticketId}/comments`, { comment_text: commentText });
  return response.data.data;
};