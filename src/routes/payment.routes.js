import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Quiz from '../models/quiz.model.js';
import Payment from '../models/payment.model.js';
import { buildUpiUri, generateQrDataUrl } from '../services/qr.service.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// multer local disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.post('/order', auth, async (req, res) => {
  const { quiz_id } = req.body;
  const userId = req.user.id;
  const quiz = await Quiz.findById(quiz_id);
  if (!quiz || quiz.status !== 'published') return res.status(404).json({ error: 'Quiz not available' });
  const ts = Date.now();
  const orderId = `Q${quiz_id}-U${userId}-${ts}`;
  await Payment.create({ user_id: userId, quiz_id, order_id: orderId, amount: quiz.price, status: 'pending' });
  res.json({ order_id: orderId, amount: quiz.price, status: 'pending' });
});

router.get('/:orderId/qr', auth, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const p = await Payment.findOne({ order_id: orderId, user_id: userId });
  if (!p) return res.status(404).json({ error: 'Order not found' });
  const upi = buildUpiUri({ pa: process.env.UPI_VPA, pn: process.env.UPI_PN, am: p.amount, orderId });
  const dataUrl = await generateQrDataUrl(upi);
  res.json({ upi_uri: upi, qr_data_url: dataUrl });
});

router.post('/:orderId/utr', auth, upload.single('screenshot'), async (req, res) => {
  const { orderId } = req.params;
  const { utr } = req.body;
  const userId = req.user.id;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const p = await Payment.findOne({ order_id: orderId, user_id: userId });
  if (!p) return res.status(404).json({ error: 'Order not found' });
  if (p.status !== 'pending') return res.status(400).json({ error: 'Payment already processed' });

  if (!utr || utr.length < 8) return res.status(400).json({ error: 'Invalid UTR' });
  const dup = await Payment.findOne({ utr, status: 'success' });
  if (dup) return res.status(400).json({ error: 'UTR already used' });

  p.utr = utr;
  if (fileUrl) p.screenshot_url = fileUrl;
  await p.save();
  res.json({ message: 'UTR submitted. Waiting for admin verification.', screenshot_url: fileUrl });
});

export default router;
