import API from "./api";

export const getDashboardSummary =
  async () => {
    const response =
      await API.get(
        "/dashboard/summary"
      );

    return response.data;
  };