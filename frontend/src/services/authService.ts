import API from "./api";

export const login = async (
  email: string,
  password: string,
  company_code: string
) => {
  const response =
    await API.post(
      "/auth/login",
      {
        email,
        password,
        company_code
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