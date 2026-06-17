import API from "./api";

const unwrapData = (responseData: any) =>
  responseData.data ?? responseData;

export const getCategories = async () => {
  const response = await API.get(
    "/master/categories"
  );

  return unwrapData(response.data);
};

export const getPriorities = async () => {
  const response = await API.get(
    "/master/priorities"
  );

  return unwrapData(response.data);
};

export const getSubCategories = async (
  categoryId: number
) => {
  const response = await API.get(
    `/master/subcategories/${categoryId}`
  );

  return unwrapData(response.data);
};

export const getAssignableUsers = async (
  subCategoryId: number
) => {
  const response = await API.get(
    `/master/assignable-users/${subCategoryId}`
  );

  return unwrapData(response.data);
};