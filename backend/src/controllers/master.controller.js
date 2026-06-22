import * as service from "../services/master.service.js";

export const getCategories = async (
  req,
  res
) => {
  try {
    const data =
      await service.getCategories(req.user.companyCode);

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
  await service.getPriorities(req.user.companyCode);

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
  await service.getStatuses(req.user.companyCode);

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
    const companyCode = Number(req.user.roleId) === 1 ? null : req.user.companyCode;
    const data = await service.getDepartments(companyCode);

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
    const isSuperAdmin = req.user && Number(req.user.roleId) === 4;
    const data = await service.getCompanies(isSuperAdmin);

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

export const deleteCompany = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const data = await service.deleteCompany(companyCode);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    return res.status(200).json({
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

export const restoreCompany = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const data = await service.restoreCompany(companyCode);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    return res.status(200).json({
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
      await service.createCategory({
        ...req.body,
        company_code: req.user.companyCode,
      });

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
        req.body,
        req.user.companyCode
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
        req.params.categoryId,
        req.user.companyCode
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
    const data = await service.createSubCategory({
      ...req.body,
      company_code: req.user.companyCode,
    });

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
      req.user.companyCode
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
      req.user.companyCode
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
      await service.createStatus({
        ...req.body,
        company_code: req.user.companyCode,
      });

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
        req.body,
        req.user.companyCode
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
        req.params.statusId,
        req.user.companyCode
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
      await service.createPriority({
        ...req.body,
        company_code: req.user.companyCode,
      });

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
        req.body,
        req.user.companyCode
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
        req.params.priorityId,
        req.user.companyCode
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
        categoryId,
        req.user.companyCode
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

export const createCompany = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.logo_url = `/uploads/logos/${req.file.filename}`;
    }
    const data = await service.createCompany(payload);
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

export const updateCompany = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const payload = { ...req.body };
    if (req.file) {
      payload.logo_url = `/uploads/logos/${req.file.filename}`;
    }
    const data = await service.updateCompany(companyCode, payload);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    return res.status(200).json({
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
