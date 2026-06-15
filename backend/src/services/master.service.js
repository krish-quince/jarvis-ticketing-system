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