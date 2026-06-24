import API from "./api";

const unwrapData = (responseData: any) => responseData.data ?? responseData;

export const getEmailConfigs = async () => {
  const response = await API.get("/email-configs");
  return unwrapData(response.data);
};

export const createEmailConfig = async (payload: any) => {
  const response = await API.post("/email-configs", payload);
  return unwrapData(response.data);
};

export const updateEmailConfig = async (id: number, payload: any) => {
  const response = await API.patch(`/email-configs/${id}`, payload);
  return unwrapData(response.data);
};

export const activateEmailConfig = async (id: number) => {
  const response = await API.post(`/email-configs/${id}/activate`);
  return unwrapData(response.data);
};

export const deleteEmailConfig = async (id: number) => {
  const response = await API.delete(`/email-configs/${id}`);
  return unwrapData(response.data);
};
