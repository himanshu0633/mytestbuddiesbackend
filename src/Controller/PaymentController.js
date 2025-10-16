import Payment from '../models/payment.model.js';

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const { user_id, utr } = req.body;

    if (!user_id || !utr) {
      return res.status(400).json({ message: "User ID and UTR are required." });
    }

    // Create a new payment
    const newPayment = new Payment({
      user_id,
      utr,
      paymentstatus: 'pending', // Default status
    });

    await newPayment.save();
    return res.status(201).json({ message: 'Payment created successfully', data: newPayment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update payment status (for a specific utr)
export const updatePayStatus = async (req, res) => {
  try {
    const { utr } = req.params;  // UTR as route param
    const { paymentstatus } = req.body;  // Status to be updated (success/failed)

    if (!paymentstatus || !['success', 'failed'].includes(paymentstatus)) {
      return res.status(400).json({ message: "Invalid payment status. It should be 'success' or 'failed'." });
    }

    const payment = await Payment.findOne({ utr });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    payment.paymentstatus = paymentstatus;  // Update the status
    await payment.save();

    return res.status(200).json({ message: 'Payment status updated successfully', data: payment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getPaymentsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find payments by user_id
    const payments = await Payment.find({ user_id });

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found for this user.' });
    }

    return res.status(200).json({ payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller: PaymentController.js

export const getAllPayments = async (req, res) => {
  try {
    // Fetch all payments and populate the user details (user_id)
    const payments = await Payment.find()
      .populate('user_id', 'name')  // Populate the name field from the User model
      .exec();

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found.' });
    }

    return res.status(200).json({ payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
