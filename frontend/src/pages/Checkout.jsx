import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import orderApi from "../../api/orderApi";
import paymentApi from "../../api/paymentApi";
import { clearCart } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart?.items || []);
  const user = useSelector((state) => state.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phoneNumber: user?.phone || "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod, upi, card
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFees = subtotal > 500 ? 0 : 10;
  const total = subtotal + shippingFees;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildItems = () =>
    cartItems.map((item) => ({
      product: item.id,
      name: item.title,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    }));

  const buildShipping = () => ({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    street: formData.street,
    city: formData.city,
    zipcode: formData.zipCode,
    phone: formData.phoneNumber,
    country: formData.country,
    state: formData.state,
  });

  const createFinalOrder = async (paymentResult = null, method = paymentMethod) => {
    const items = buildItems();
    const shipping = buildShipping();

    const payload = {
      items,
      shipping,
      paymentMethod: method,
      paymentResult,
    };

    return orderApi.create(payload);
  };

  const placeCodOrder = async () => {
    const orderResp = await createFinalOrder(null, "cod");
    return orderResp;
  };

  const startRazorpayFlow = async () => {
    const amount = Math.round(subtotal * 100);
    const receipt = `rcpt_${Date.now()}`;
    const notes = {
      customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phoneNumber,
      city: formData.city,
      state: formData.state,
      pincode: formData.zipCode,
      cart_items: String(cartItems.length),
      shipping_fee: String(shippingFees),
    };

    const orderResponse = await paymentApi.createOrder({
      amount,
      currency: "INR",
      receipt,
      notes,
    });

    const razorpayOrder = orderResponse.data?.order || orderResponse.data;
    const orderId = razorpayOrder?.id || razorpayOrder?.order_id;
    if (!orderId) {
      throw new Error("Unable to create Razorpay order");
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error("Failed to load Razorpay checkout");
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error("Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID.");
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: "INR",
        name: "Aroun Stores",
        description: "Order payment",
        order_id: orderId,
        notes,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phoneNumber,
        },
        theme: {
          color: "#16a34a",
        },
        handler: async (response) => {
          try {
            const verifyResponse = await paymentApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const verificationPayload =
              verifyResponse.data?.data ||
              verifyResponse.data?.payment ||
              verifyResponse.data ||
              null;

            await createFinalOrder(
              verificationPayload || {
                ...response,
                verified: true,
              },
              "razorpay"
            );

            dispatch(clearCart());
            toast.success("Payment verified and order placed successfully!");
            navigate("/orders");
            resolve();
          } catch (error) {
            console.error("Razorpay verification error:", error);
            toast.error(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed"
            );
            reject(error);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            const cancelError = new Error("Payment cancelled by user");
            cancelError.name = "RazorpayPaymentCancelled";
            reject(cancelError);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        const failureMessage =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed";
        toast.error(
          failureMessage
        );
        const paymentError = new Error(failureMessage);
        paymentError.name = "RazorpayPaymentFailed";
        reject(paymentError);
      });
      razorpay.open();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in your delivery details");
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === "cod") {
        await placeCodOrder();
        dispatch(clearCart());
        toast.success("Order placed successfully!");
        navigate("/orders");
        return;
      }

      await startRazorpayFlow();
    } catch (error) {
      console.error("Order error:", error);
      if (
        error?.name === "RazorpayPaymentCancelled" ||
        error?.name === "RazorpayPaymentFailed"
      ) {
        return;
      }
      toast.error(error.response?.data?.message || error.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">DELIVERY INFORMATION</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="FirstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="LastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Your Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  name="street"
                  placeholder="Street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="PhoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">ORDER SUMMARY</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-gray-600 text-sm">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-red-600">₹ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">SubTotal</span>
                <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping Fees</span>
                <span className="font-medium">₹ {shippingFees.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="font-semibold">₹ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">PAYMENT METHOD</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio text-red-500"
                />
                <div>
                  <div className="font-medium">UPI Payment</div>
                  <div className="text-sm text-gray-500">
                    Pay using UPI apps like GPay, PhonePe, Paytm
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio text-red-500"
                />
                <div>
                  <div className="font-medium">Credit/Debit Card</div>
                  <div className="text-sm text-gray-500">
                    Pay securely using your card
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio text-red-500"
                />
                <div>
                  <div className="font-medium">Cash on Delivery</div>
                  <div className="text-sm text-gray-500">
                    Pay when your order is delivered
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full text-white py-3 rounded-md transition ${
              isProcessing
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
