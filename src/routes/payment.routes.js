import express from 'express';
import { createPayment, updatePayStatus,getPaymentsByUser, getAllPayments } from '../Controller/PaymentController.js'; // Adjust the path

const router = express.Router();

// Create a new payment
router.post('/create', createPayment);

// Update payment status
router.put('/status/:utr', updatePayStatus);
// Assuming this is in your routes file
router.get('/pay/:user_id', getPaymentsByUser);  // Fetch payments for a user
router.get('/all-payments', getAllPayments);
export default router;
