import { Router } from 'express';
import Quiz from '../models/quiz.model.js';
import Payment from '../models/payment.model.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const rows = await Quiz.find({ status: 'published' }).sort({ _id: -1 }).select('title tags price duration_minutes status');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const q = await Quiz.findById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Quiz not found' });
  res.json(q);
});

router.get('/:id/access', auth, async (req, res) => {
  const ok = await Payment.exists({ user_id: req.user.id, quiz_id: req.params.id, status: 'success' });
  res.json({ allowed: !!ok, reason: ok ? 'paid' : 'payment_pending' });
});

export default router;
