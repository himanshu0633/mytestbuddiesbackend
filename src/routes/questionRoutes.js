import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';  
import { createQuestion, getQuestionsByField, submitAnswers, getUserProgress } from '../Controller/questionController.js';  

const router = express.Router();

// ✅ Create question under a specific field (admin only)


router.post('/fields/:fieldId/questions', isAuthenticated, createQuestion);
// ✅ Get all questions for a specific field (user/admin)
router.get('/fields/que/:fieldId', isAuthenticated, getQuestionsByField);  

// ✅ Submit user answers for a specific field (user only)
router.post('/fields/submit-answer/:fieldId', isAuthenticated, submitAnswers);

// ✅ Get user progress for a field
router.get('/fields/progress/:fieldId', isAuthenticated, getUserProgress);  


export default router;
