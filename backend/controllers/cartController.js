const Cart = require('../models/Cart');
const Product = require('../models/productModel');

// Get current user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(cart || { items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get cart' });
  }
};

// Add or update item in cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx > -1) {
      // update quantity
      cart.items[idx].quantity = Math.max(1, cart.items[idx].quantity + Number(quantity));
    } else {
      cart.items.push({
        product: product._id,
        name: product.title || product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: Number(quantity),
      });
    }

    await cart.save();
    const populated = await cart.populate('items.product');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add to cart' });
  }
};

// Update item quantity
exports.updateItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx === -1) return res.status(404).json({ message: 'Item not in cart' });

    if (Number(quantity) <= 0) {
      cart.items.splice(idx,1);
    } else {
      cart.items[idx].quantity = Number(quantity);
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

// Remove item
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
};
