import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { removeFromCart, updateQuantity, clearCart } from "../redux/cartSlice";
import { Link } from "react-router-dom";

const Cartpages = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart?.items || []);

  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const shipping = items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  return (
    <div className="cart-page max-w-7xl mx-auto px-4 py-10">
      <p className="eyebrow">A FEW GOOD FINDS</p><h1 className="page-title">Your shopping bag.</h1><p className="page-description">Your everyday favorites, ready to come home.</p>
      {items.length === 0 ? (
        <div className="empty-bag text-center py-20">
          <p className="mb-4">Your bag is waiting for a little everyday joy.</p>
          <Link to="/product" className="primary-button">Shop products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              {items.map((it) => (
                <div key={it.id} className="cart-row p-4 border-b last:border-b-0 flex items-center gap-4">
                  <img src={it.image} alt={it.title} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{it.title}</h3>
                    <p className="text-red-600 font-semibold">₹{(it.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch(updateQuantity({ id: it.id, quantity: (it.quantity || 1) - 1 }))}
                      className="px-3 py-1 border rounded"
                    >
                      -
                    </button>
                    <div className="px-3 py-1 border rounded">{it.quantity}</div>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: it.id, quantity: (it.quantity || 1) + 1 }))}
                      className="px-3 py-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-medium">₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}</p>
                    <button onClick={() => dispatch(removeFromCart(it.id))} className="text-sm text-gray-500 mt-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="border p-5 rounded-lg bg-white">
              <h3 className="text-xl font-bold mb-4">A little recap</h3>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Shipping Fees</span>
                <span>₹{shipping}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="mt-6">
                <Link to="/checkout" className="block w-full">
                  <button className="primary-button w-full">Proceed to Checkout</button>
                </Link>
              </div>
              <div className="mt-3 text-center">
                <button onClick={() => dispatch(clearCart())} className="text-sm text-red-500">Clear cart</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cartpages;