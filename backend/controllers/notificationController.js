const Product = require('../models/productModel');
const twilio = require('../utils/twilio');

// Store WhatsApp subscribed numbers (In production, use a database)
const subscribedNumbers = new Set();

// Subscribe a number to notifications
exports.subscribeToNotifications = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Add to subscribed numbers
        subscribedNumbers.add(phoneNumber);
        
        // Send confirmation message
        await twilio.sendWhatsAppMessage(
            phoneNumber,
            'Thank you for subscribing to low stock alerts! You will receive notifications when products are running low.'
        );

        res.json({ message: 'Successfully subscribed to notifications' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

// Check for low stock items and notify subscribers
exports.checkAndNotifyLowStock = async () => {
    try {
        // Find products with stock less than 100
        const lowStockProducts = await Product.find({ stock: { $lt: 100 } });

        if (lowStockProducts.length > 0) {
            // Prepare message
            const message = `🚨 Low Stock Alert!\n\nThe following products are running low:\n${
                lowStockProducts.map(product => 
                    `• ${product.name}: ${product.stock} items remaining`
                ).join('\n')
            }\n\nOrder soon to avoid stockouts!`;

            // Send to all subscribers
            for (const number of subscribedNumbers) {
                await twilio.sendWhatsAppMessage(number, message);
            }
        }
    } catch (error) {
        console.error('Low stock notification error:', error);
    }
};

// Unsubscribe from notifications
exports.unsubscribeFromNotifications = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Remove from subscribed numbers
        subscribedNumbers.delete(phoneNumber);
        
        // Send confirmation message
        await twilio.sendWhatsAppMessage(
            phoneNumber,
            'You have been unsubscribed from low stock alerts. Thank you for using our service!'
        );

        res.json({ message: 'Successfully unsubscribed from notifications' });
    } catch (error) {
        console.error('Unsubscription error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
};