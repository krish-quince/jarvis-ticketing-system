import * as repository from "../repositories/master.repository.js";

export const getCategories = async (companyCode) => {
  return repository.getCategories(companyCode);
};

export const getPriorities = async (companyCode) => {
  return repository.getPriorities(companyCode);
};

export const getStatuses = async (companyCode) => {
  return repository.getStatuses(companyCode);
};

export const getRoles = async () => {
  return repository.getRoles();
};

export const getDepartments = async (companyCode) => {
  return repository.getDepartments(companyCode);
};

export const getCompanies = async (includeDeleted = false) => {
  return repository.getCompanies(includeDeleted);
};

export const deleteCompany = async (companyCode) => {
  return repository.deleteCompany(companyCode);
};

export const restoreCompany = async (companyCode) => {
  return repository.restoreCompany(companyCode);
};

export const createCategory = async (payload) => {
  return repository.createCategory(payload);
};

export const updateCategory = async (categoryId, payload, companyCode) => {
  return repository.updateCategory(categoryId, payload, companyCode);
};

export const deleteCategory = async (categoryId, companyCode) => {
  return repository.deleteCategory(categoryId, companyCode);
};

export const createStatus = async (payload) => {
  return repository.createStatus(payload);
};

export const updateStatus = async (statusId, payload, companyCode) => {
  return repository.updateStatus(statusId, payload, companyCode);
};

export const deleteStatus = async (statusId, companyCode) => {
  return repository.deleteStatus(statusId, companyCode);
};

export const createPriority = async (payload) => {
  return repository.createPriority(payload);
};

export const updatePriority = async (priorityId, payload, companyCode) => {
  return repository.updatePriority(priorityId, payload, companyCode);
};

export const deletePriority = async (priorityId, companyCode) => {
  return repository.deletePriority(priorityId, companyCode);
};

export const getSubCategories = async (categoryId, companyCode) => {
  return repository.getSubCategories(categoryId, companyCode);
};

export const createSubCategory = async (payload) => {
  return repository.createSubCategory(payload);
};

export const updateSubCategory = async (subcategoryId, payload, companyCode) => {
  return repository.updateSubCategory(subcategoryId, payload, companyCode);
};

export const deleteSubCategory = async (subcategoryId, companyCode) => {
  return repository.deleteSubCategory(subcategoryId, companyCode);
};

export const getAssignableUsers = async (filters, companyCode) => {
  return repository.getAssignableUsers(filters, companyCode);
};

export const createCompany = async (payload) => {
  return repository.createCompany(payload);
};

export const updateCompany = async (companyCode, payload) => {
  return repository.updateCompany(companyCode, payload);
};

export const deleteCompany = async (companyCode) => {
  return repository.deleteCompany(companyCode);
};

export const restoreCompany = async (companyCode) => {
  return repository.restoreCompany(companyCode);
};

