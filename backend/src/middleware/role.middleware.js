export const requireAdmin = (req, res, next) => {
    if (Number(req.user?.roleId) === 1) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied.",
    });
};

export const requireTechnician = (req, res, next) => {
    const roleId = Number(req.user?.roleId);

    if (roleId === 1 || roleId === 3) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied.",
    });
};