import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getAllUsers } from "../controllers/user.controller.js";

const router = Router();

const isAdmin = (req, res, next) => {
    if (req.user && Number(req.user.roleId) === 1) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admins only",
        });
    }
};

router.get("/", verifyToken, isAdmin, getAllUsers);

export default router;
