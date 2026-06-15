import * as service from "../services/master.service.js";

export const getCategories = async (
  req,
  res
) => {
  try {
    const data =
      await service.getCategories(
        req.user.companyId
      );

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

export const getSubCategories = async (
  req,
  res
) => {

  try {

    const { categoryId } = req.params;

    const data =
      await service.getSubCategories(
        req.user.companyId,
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
    const { subcategoryId } = req.params;

    const users =
      await service.getAssignableUsers(
        subcategoryId,
        req.user.companyId
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