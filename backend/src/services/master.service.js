import * as repository from "../repositories/master.repository.js";

export const getCategories = async (
  companyId
) => {
  return repository.getCategories(
    companyId
  );
};

export const getPriorities = async (
  companyId
) => {
  return repository.getPriorities(
    companyId
  );
};

export const getSubCategories = async (
  companyId,
  categoryId
) => {

  return repository.getSubCategories(
    companyId,
    categoryId
  );

};

export const getAssignableUsers = async (
  companyId,
  subcategoryId
) => {

  return repository.getAssignableUsers(
    companyId,
    subcategoryId
  );

};