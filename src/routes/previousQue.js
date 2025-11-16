// routes/fieldRoutes.js
import express from "express";
import {
  createField,
  getFields,
  getFieldById,
  updateField,
  deleteField,
  getFieldWithQuestions
} from "../Controller/perContoller.js";

import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();
router.get("/questions/:id", isAuthenticated, getFieldWithQuestions);

router.post("/", isAuthenticated, createField);

router.get("/", isAuthenticated, getFields);

router.get("/:id", isAuthenticated, getFieldById);

router.put("/:id", isAuthenticated,  updateField);

router.delete("/:id", isAuthenticated, deleteField);

export default router;
