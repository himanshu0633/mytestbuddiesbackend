import { Router } from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import Payment from '../models/payment.model.js';
import Attempt from '../models/attempt.model.js';

const router = Router();

router.get('/payments/pending', auth, adminOnly, async (req, res) => {
  const rows = await Payment.find({ status: 'pending' })
    .sort({ created_at: -1 })
    .populate('user_id', 'name email')
    .populate('quiz_id', 'title');
  const data = rows.map(r => ({
    id: r._id,
    order_id: r.order_id,
    amount: r.amount,
    utr: r.utr,
    screenshot_url: r.screenshot_url,
    name: r.user_id?.name,
    email: r.user_id?.email,
    quiz_title: r.quiz_id?.title,
  }));
  res.json(data);
});

router.post('/payments/:id/verify', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // success | failed

  const p = await Payment.findById(id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  if (p.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

  p.status = (action === 'success') ? 'success' : 'failed';
  await p.save();

  if (p.status === 'success') {
    await Attempt.updateOne(
      { user_id: p.user_id, quiz_id: p.quiz_id },
      { $setOnInsert: { status: 'not_started' } },
      { upsert: true }
    );
  }

  res.json({ message: `Payment marked ${p.status}` });
});

export default router;
