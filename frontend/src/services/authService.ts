import API from "./api";

export const login = async (
  user_code: string,
  password: string
) => {
  const response =
    await API.post(
      "/auth/login",
      {
        user_code,
        password
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