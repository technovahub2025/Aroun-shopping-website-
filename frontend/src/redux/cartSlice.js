import { createSlice } from "@reduxjs/toolkit";

// Load from localStorage
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load cart from localStorage", e);
    return [];
  }
};

// Save to localStorage
const saveToStorage = (items) => {
  try {
    localStorage.setItem("cart", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
};

const initialState = {
  items: loadFromStorage(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, qty = 1 } = action.payload;
      const id = product._id || product.id;
      const existing = state.items.find((i) => i.id === id);

      // Only add if it doesn’t exist already
      if (!existing) {
        state.items.push({
          id,
          title: product.title || product.name,
          price: product.price || 0,
          image:
            (product.images && product.images[0]) ||
            product.image ||
            "/placeholder.png",
          quantity: qty,
        });
        saveToStorage(state.items);
      }
    },

    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => i.id !== id);
      saveToStorage(state.items);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) item.quantity = Math.max(1, quantity);
      saveToStorage(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      saveToStorage(state.items);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
