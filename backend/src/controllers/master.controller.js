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
      await service.getPriorities(
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
        "Failed to fetch priorities",
    });
  }
};