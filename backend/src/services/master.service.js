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

export const getSubCategories = async (categoryId) => {
  return repository.getSubCategories(categoryId);
};

export const getAssignableUsers = async (subcategoryId, companyCode) => {
  return repository.getAssignableUsers(subcategoryId, companyCode);
};
