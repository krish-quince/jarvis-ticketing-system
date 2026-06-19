import * as service from "../services/master.service.js";

export const getCategories = async (
  req,
  res
) => {
  try {
    const data =
      await service.getCategories();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch categories",
    });
  }
};

export const getPriorities = async (
  req,
  res
) => {
  try {
    const data =
  await service.getPriorities();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch priorities",
    });
  }
};

export const getStatuses = async (
  req,
  res
) => {
  try {
    const data =
  await service.getStatuses();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch statuses",
    });
  }
};

export const getRoles = async (
  req,
  res
) => {
  try {
    const data =
  await service.getRoles();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch roles",
    });
  }
};

export const getDepartments = async (
  req,
  res
) => {
  try {
    const data =
  await service.getDepartments();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch departments",
    });
  }
};

export const getCompanies = async (
  req,
  res
) => {
  try {
    const data =
  await service.getCompanies();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch companies",
    });
  }
};

const sendAdminMasterResponse = (
  res,
  data,
  notFoundMessage
) => {
  if (!data) {
    return res.status(404).json({
      success: false,
      message: notFoundMessage,
    });
  }

  return res.status(200).json({
    success: true,
    data,
  });
};

export const createCategory = async (req, res) => {
  try {
    const data =
      await service.createCategory(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const data =
      await service.updateCategory(
        req.params.categoryId,
        req.body
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Category not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const data =
      await service.deleteCategory(
        req.params.categoryId
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Category not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const data = await service.createSubCategory(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const data = await service.updateSubCategory(
      req.params.subcategoryId,
      req.body,
    );

    return sendAdminMasterResponse(
      res,
      data,
      "Subcategory not found",
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const data = await service.deleteSubCategory(
      req.params.subcategoryId,
    );

    return sendAdminMasterResponse(
      res,
      data,
      "Subcategory not found",
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createStatus = async (req, res) => {
  try {
    const data =
      await service.createStatus(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const data =
      await service.updateStatus(
        req.params.statusId,
        req.body
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Status not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const data =
      await service.deleteStatus(
        req.params.statusId
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Status not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPriority = async (req, res) => {
  try {
    const data =
      await service.createPriority(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePriority = async (req, res) => {
  try {
    const data =
      await service.updatePriority(
        req.params.priorityId,
        req.body
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Priority not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePriority = async (req, res) => {
  try {
    const data =
      await service.deletePriority(
        req.params.priorityId
      );

    return sendAdminMasterResponse(
      res,
      data,
      "Priority not found"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubCategories = async (
  req,
  res
) => {

  try {

    const { categoryId } = req.params;

    const data =
      await service.getSubCategories(
        categoryId
      );

    return res.status(200).json({
      success: true,
      data
    });

  } catch(error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

export const getAssignableUsers = async (req, res) => {
  try {
    const filters = {
      subcategoryId: req.params.subcategoryId || req.query.subcategoryId,
      categoryId: req.query.categoryId,
      departmentId: req.query.departmentId,
    };

    const users =
      await service.getAssignableUsers(
        filters,
        req.user.companyCode,
      );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
