// Dummy payment controller to simulate payment gateway
exports.processPayment = async (req, res) => {
  try {
    const { amount, currency = 'INR', paymentMethod = 'card', simulate = 'success' } = req.body;

    // Basic validation
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // Simulate delay
    await new Promise((r) => setTimeout(r, 500));

    if (simulate === 'fail') {
      return res.status(402).json({ status: 'failed', message: 'Payment declined (simulated)' });
    }

    // Return dummy transaction data
    const transaction = {
      id: 'tx_' + Math.random().toString(36).slice(2, 10),
      amount,
      currency,
      method: paymentMethod,
      status: 'success',
      createdAt: new Date(),
    };

    res.json({ status: 'success', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};
