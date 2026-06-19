import API from "./api";

const unwrapData = (responseData: any) => responseData.data ?? responseData;

export const getCategories = async () => {
  const response = await API.get("/master/categories");

  return unwrapData(response.data);
};

export const getPriorities = async () => {
  const response = await API.get("/master/priorities");

  return unwrapData(response.data);
};

export const getStatuses = async () => {
  const response = await API.get("/master/statuses");

  return unwrapData(response.data);
};

export const createCategory = async (payload: any) => {
  const response = await API.post("/master/categories", payload);

  return unwrapData(response.data);
};

export const updateCategory = async (categoryId: number, payload: any) => {
  const response = await API.patch(`/master/categories/${categoryId}`, payload);

  return unwrapData(response.data);
};

export const deleteCategory = async (categoryId: number) => {
  const response = await API.delete(`/master/categories/${categoryId}`);

  return unwrapData(response.data);
};

export const createStatus = async (payload: any) => {
  const response = await API.post("/master/statuses", payload);

  return unwrapData(response.data);
};

export const updateStatus = async (statusId: number, payload: any) => {
  const response = await API.patch(`/master/statuses/${statusId}`, payload);

  return unwrapData(response.data);
};

export const deleteStatus = async (statusId: number) => {
  const response = await API.delete(`/master/statuses/${statusId}`);

  return unwrapData(response.data);
};

export const createPriority = async (payload: any) => {
  const response = await API.post("/master/priorities", payload);

  return unwrapData(response.data);
};

export const updatePriority = async (priorityId: number, payload: any) => {
  const response = await API.patch(`/master/priorities/${priorityId}`, payload);

  return unwrapData(response.data);
};

export const deletePriority = async (priorityId: number) => {
  const response = await API.delete(`/master/priorities/${priorityId}`);

  return unwrapData(response.data);
};

export const getRoles = async () => {
  const response = await API.get("/master/roles");
  return unwrapData(response.data);
};

export const getDepartments = async () => {
  const response = await API.get("/master/departments");
  return unwrapData(response.data);
};

export const getCompanies = async () => {
  const response = await API.get("/master/companies");
  return unwrapData(response.data);
};

export const getSubCategories = async (categoryId: number) => {
  const response = await API.get(`/master/subcategories/${categoryId}`);

  return unwrapData(response.data);
};

export const getAssignableUsers = async (subCategoryId: number) => {
  const response = await API.get(`/master/assignable-users/${subCategoryId}`);

  return unwrapData(response.data);
};
