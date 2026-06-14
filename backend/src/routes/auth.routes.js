import { Router } from "express";
import {
    registerUser,
    loginUser,
} from "../controllers/auth.controller.js";

import {
    validate
}
from "../middleware/validation.middleware.js";

import {
    loginSchema,
    registerSchema
}
from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

export default router;