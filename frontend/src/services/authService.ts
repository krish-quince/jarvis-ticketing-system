import API from "./api";

export const login = async (
  email: string,
  password: string
) => {
  const response =
    await API.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

  return response.data;
};

export const register = async (userData: any) => {
  const response = await API.post(
    "/auth/register",
    userData
  );

  return response.data;
};