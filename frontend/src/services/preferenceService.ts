import API from "./api";

export const getColumnPreferences = async (pageName: string): Promise<Record<string, boolean>> => {
  const response = await API.get(`/preferences/columns/${pageName}`);
  return response.data;
};

export const saveColumnPreferences = async (
  pageName: string,
  preferences: Record<string, boolean>
): Promise<{ message: string }> => {
  const response = await API.put(`/preferences/columns/${pageName}`, preferences);
  return response.data;
};
