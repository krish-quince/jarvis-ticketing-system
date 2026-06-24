import API from "./api";

const unwrapData = (responseData: any) => responseData.data ?? responseData;

export const getTickets = async (
  search = "",
  sortBy = "",
  sortOrder = ""
) => {
  const response = await API.get("/tickets", {
    params: {
      search,
      sortBy,
      sortOrder,
    },
  });

  return unwrapData(response.data);
};

export const getTicketById = async (
  id: number
) => {
  const response =
    await API.get(
      `/tickets/${id}`
    );

  return unwrapData(response.data);
};

export const createTicket = async (
  ticketData: any,
  attachments: File[] = [],
) => {
  const formData = new FormData();
  Object.entries(ticketData).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    formData.append(
      key,
      Array.isArray(value) ? JSON.stringify(value) : String(value),
    );
  });
  attachments.forEach((file) => formData.append("attachments", file));

  const response = await API.post("/tickets", formData);

  return unwrapData(response.data);
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
  return unwrapData(response.data);
};

export const getTicketHistory = async (ticketId: number) => {
  const response = await API.get(`/tickets/${ticketId}/history`);
  return unwrapData(response.data);
};

export const createComment = async (
  ticketId: number,
  commentText: string,
  attachments: File[] = [],
) => {
  const formData = new FormData();
  formData.append("comment_text", commentText);
  attachments.forEach((file) => formData.append("attachments", file));

  const response = await API.post(`/tickets/${ticketId}/comments`, formData);
  return unwrapData(response.data);
};

export const takeoverTicket = async (
  id: number
) => {
  const response = await API.patch(
    `/tickets/${id}/takeover`
  );

  return response.data;
};

export const updateTicketDueDate = async (
  id: number,
  dueDate: string
) => {
  const response = await API.patch(
    `/tickets/${id}/due-date`,
    {
      due_date: dueDate,
    }
  );

  return response.data;
};

export const updateTicketCategory = async (
  id: number,
  categoryId: number,
  subCategoryId: number
) => {
  const response = await API.patch(
    `/tickets/${id}/category`,
    {
      category_id: categoryId,
      subcategory_id: subCategoryId,
    }
  );

  return response.data;
};

export const allocateTicket = async (
  id: number,
  allocatedToUserCode: string
) => {
  const response = await API.patch(
    `/tickets/${id}/allocate`,
    {
      allocated_to_user_code: allocatedToUserCode,
    }
  );

  return response.data;
};
