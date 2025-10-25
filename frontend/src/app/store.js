import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/userSlice";
import cartReducer from "../redux/cartSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
  },
});