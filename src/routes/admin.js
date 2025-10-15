import express from 'express';
import Field from '../models/Field.js';
import Question from '../models/Question.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create field (admin only)
router.post('/fields', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, description, defaultTimePerQuestion } = req.body;
    const field = new Field({
      name,
      description,
      defaultTimePerQuestion,
      createdBy: req.user._id
    });
    await field.save();
    return res.status(201).json(field);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
});

// List fields (auth required)
router.get('/fields', isAuthenticated, async (req, res) => {
  try {
    const fields = await Field.find().sort({ createdAt: -1 });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create question under a field (admin only)
router.post('/fields/:fieldId/questions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { type, text, options, correctAnswer, solution, timeAllocated } = req.body;

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const q = new Question({
      field: fieldId,
      type,
      text,
      options,
      correctAnswer,
      solution,
      timeAllocated,
      createdBy: req.user._id
    });
    await q.save();
    res.status(201).json(q);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get questions for a field
router.get('/fields/:fieldId/questions', isAuthenticated, async (req, res) => {
  try {
    const questions = await Question.find({ field: req.params.fieldId }).lean();
    // If not admin, strip sensitive fields
    if (!req.user?.isAdmin) {
      const safe = questions.map(({ correctAnswer, solution, ...rest }) => rest);
      return res.json(safe);
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update question (admin)
router.put('/questions/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(q);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete question (admin)
router.delete('/questions/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
