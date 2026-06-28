export const isSuperAdmin = (user) => (
    Number(user?.roleId) === 4 ||
    String(user?.roleName || "").toLowerCase() === "super admin"
);

export const isAdmin = (user) => (
    Number(user?.roleId) === 1 ||
    String(user?.roleName || "").toLowerCase() === "admin"
);

export const requireAdmin = (req, res, next) => {
    if (isAdmin(req.user) || isSuperAdmin(req.user)) {
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

export const requireTechnicianOrAdmin = (req, res, next) => {
    const roleId = Number(req.user?.roleId);

    if (roleId === 1 || roleId === 2 || roleId === 4) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied. Only technicians/agents and admins can perform this action.",
    });
};

export const requireSuperAdmin = (req, res, next) => {
    if (isSuperAdmin(req.user)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Super admin access required.",
    });
};
