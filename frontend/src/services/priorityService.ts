import API from "./api";

export const getPriorities =
async () => {

  const response =
    await API.get(
      "/priorities"
    );

  return response.data;
};
