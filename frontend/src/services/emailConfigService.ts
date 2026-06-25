import API from "./api";

const unwrapData = (responseData: any) => responseData.data ?? responseData;

export const getEmailConfigs = async (companyCode?: string) => {
  const response = await API.get("/email-configs", {
    params: companyCode ? { companyCode } : undefined,
  });
  return unwrapData(response.data);
};

export const createEmailConfig = async (payload: any, companyCode?: string) => {
  const url = companyCode
    ? `/email-configs?companyCode=${encodeURIComponent(companyCode)}`
    : "/email-configs";
  const response = await API.post(url, payload);
  return unwrapData(response.data);
};

export const updateEmailConfig = async (id: number, payload: any, companyCode?: string) => {
  const url = companyCode
    ? `/email-configs/${id}?companyCode=${encodeURIComponent(companyCode)}`
    : `/email-configs/${id}`;
  const response = await API.patch(url, payload);
  return unwrapData(response.data);
};

export const activateEmailConfig = async (id: number, companyCode?: string) => {
  const url = companyCode
    ? `/email-configs/${id}/activate?companyCode=${encodeURIComponent(companyCode)}`
    : `/email-configs/${id}/activate`;
  const response = await API.post(url);
  return unwrapData(response.data);
};

export const deleteEmailConfig = async (id: number, companyCode?: string) => {
  const url = companyCode
    ? `/email-configs/${id}?companyCode=${encodeURIComponent(companyCode)}`
    : `/email-configs/${id}`;
  const response = await API.delete(url);
  return unwrapData(response.data);
};
