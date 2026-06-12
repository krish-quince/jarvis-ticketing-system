import API from "./api";

export const getTickets = async () => {
  const response =
    await API.get("/tickets");

  return response.data;
};

export const getTicketById = async (
  id: number
) => {
  const response =
    await API.get(
      `/tickets/${id}`
    );

  return response.data;
};

export const createTicket = async (ticketData: any) => {
  const response = await API.post(
    "/tickets",
    ticketData
  );

  return response.data;
};

export const assignTicket = async (
  id: number,
  assigned_to_user_code: string
) => {
  const response =
    await API.patch(
      `/tickets/${id}/assign`,
      { assigned_to_user_code }
    );

  return response.data;
};

export const takeoverTicket = async (
  id: number
) => {
  const response =
    await API.patch(
      `/tickets/${id}/takeover`
    );

  return response.data;
};

export const closeTicket = async (
  id: number
) => {
  const response =
    await API.patch(
      `/tickets/${id}/close`
    );

  return response.data;
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
