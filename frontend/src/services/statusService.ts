import API from "./api";

export const getStatuses =
async () => {

  const response =
    await API.get(
      "/statuses"
    );

  return response.data;
};
