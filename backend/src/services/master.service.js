import * as repository from "../repositories/master.repository.js";

export const getCategories = async () => {
  return repository.getCategories();
};

export const getPriorities = async () => {
  return repository.getPriorities();
};

export const getStatuses = async () => {
  return repository.getStatuses();
};

export const getRoles = async () => {
  return repository.getRoles();
};

export const getDepartments = async () => {
  return repository.getDepartments();
};

export const getCompanies = async () => {
  return repository.getCompanies();
};

export const createCategory = async (payload) => {
  return repository.createCategory(payload);
};

export const updateCategory = async (categoryId, payload) => {
  return repository.updateCategory(categoryId, payload);
};

export const deleteCategory = async (categoryId) => {
  return repository.deleteCategory(categoryId);
};

export const createStatus = async (payload) => {
  return repository.createStatus(payload);
};

export const updateStatus = async (statusId, payload) => {
  return repository.updateStatus(statusId, payload);
};

export const deleteStatus = async (statusId) => {
  return repository.deleteStatus(statusId);
};

export const createPriority = async (payload) => {
  return repository.createPriority(payload);
};

export const updatePriority = async (priorityId, payload) => {
  return repository.updatePriority(priorityId, payload);
};

export const deletePriority = async (priorityId) => {
  return repository.deletePriority(priorityId);
};

export const getSubCategories = async (categoryId) => {
  return repository.getSubCategories(categoryId);
};

export const createSubCategory = async (payload) => {
  return repository.createSubCategory(payload);
};

export const updateSubCategory = async (subcategoryId, payload) => {
  return repository.updateSubCategory(subcategoryId, payload);
};

export const deleteSubCategory = async (subcategoryId) => {
  return repository.deleteSubCategory(subcategoryId);
};

export const getAssignableUsers = async (filters, companyCode) => {
  return repository.getAssignableUsers(filters, companyCode);
};
