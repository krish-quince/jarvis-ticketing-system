import API from "./api";

export const getUsers = async (companyCode?: string) => {
  const response = await API.get("/users", {
    params: companyCode ? { companyCode } : undefined,
  });

  return response.data.data ?? response.data;
};

export const getUsersWithAllData = async (companyCode?: string) => {
  const response = await API.get("/users/getAllUsersWithData", {
    params: companyCode ? { companyCode } : undefined,
  });

  return response.data.data ?? response.data;
};

export const getUserByCode = async (userCode: string) => {
  const response = await API.get(`/users/${userCode}`);

  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await API.post("/users", userData);

  return response.data;
};

export const updateUser = async (
  userCode: string,
  payload: any,
) => {
  const response = await API.patch(
    `/users/${userCode}`,
    payload,
  );

  return response.data.data;
};

export const deleteUser = async (userCode: string) => {
  const response = await API.delete(`/users/${userCode}`);

  return response.data;
};
