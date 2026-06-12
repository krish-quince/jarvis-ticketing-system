import API from "./api";

export const getUsers = async () => {
  const response =
    await API.get("/users");

  return response.data;
};

export const getUserByCode = async (
  userCode: string
) => {
  const response =
    await API.get(
      `/users/${userCode}`
    );

  return response.data;
};

export const createUser = async (
  userData: any
) => {
  const response =
    await API.post(
      "/users",
      userData
    );

  return response.data;
};

export const updateUser = async (
  userCode: string,
  userData: any
) => {
  const response =
    await API.put(
      `/users/${userCode}`,
      userData
    );

  return response.data;
};

export const deleteUser = async (
  userCode: string
) => {
  const response =
    await API.delete(
      `/users/${userCode}`
    );

  return response.data;
};