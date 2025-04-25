
// payment.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

exports.createPaymentIntent = async (userId, amount, description) => {
  try {
    const user = await User.findById(userId);
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe uses cents
      currency: 'usd',
      description,
      metadata: {
        userId: userId.toString()
      }
    });
    
    // Create a pending transaction
    const transaction = await Transaction.create({
      userId,
      type: 'deposit',
      amount,
      status: 'pending',
      referenceId: paymentIntent.id
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id
    };
  } catch (error) {
    console.error('Payment service error:', error);
    throw error;
  }
};

exports.confirmPayment = async (paymentIntentId) => {
  try {
    // Find the transaction
    const transaction = await Transaction.findOne({ 
      referenceId: paymentIntentId,
      status: 'pending'
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update transaction status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();
      
      // Update user balance
      const user = await User.findById(transaction.userId);
      user.balance += transaction.amount;
      await user.save();
      
      return {
        success: true,
        transaction
      };
    } else {
      throw new Error('Payment not successful');
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw error;
  }
};