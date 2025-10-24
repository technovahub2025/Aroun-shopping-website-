import React, { useState } from "react";
import { X } from "lucide-react";
import Logo from "../assets/newlogo.jpg";
import { sendOtp, verifyOtp } from "../../api/authApi";
import { toast } from "react-toastify";

const LoginArea = ({ toggleLoginModal, onLogin }) => {
  const [step, setStep] = useState("phone"); 
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Send OTP
  const handleSendOtp = async () => {
    if (!phone || phone.length <= 3) return setMessage("Enter valid phone number");
    try {
      setLoading(true);
      const data = await sendOtp(phone);
      setMessage(data.message || "OTP sent successfully!");
      toast.success("OTP sent successfully!");
      setStep("otp");
    } catch (err) {
      setMessage(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");

    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) return setMessage("OTP is required");
    try {
      setLoading(true);
      const data = await verifyOtp(phone, otp);
      setMessage("Login successful!");
      toast.success("Login successful!");
      toggleLoginModal(); // close modal
      if (onLogin) onLogin(data.user);
    } catch (err) {
      setMessage(err.message || "Invalid OTP");
     
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 backdrop-blur-sm z-50"
        onClick={toggleLoginModal}
      ></div>

      {/* Modal */}
      <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-xl w-11/12 max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 w-auto" />
          <button onClick={toggleLoginModal}>
            <X size={24} className="text-gray-600 hover:text-red-500" />
          </button>
        </div>

        {/* Message */}
        {message && <p className="text-sm text-red-500 mb-4 text-center">{message}</p>}

        {/* Step 1: Enter Phone */}
        {step === "phone" && (
          <div className="flex flex-col gap-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                if (!val.startsWith("+91")) setPhone("+91");
                else setPhone(val);
              }}
              onFocus={() => !phone && setPhone("+91")}
              placeholder="Enter phone number"
              className="border p-3 rounded-lg w-full focus:outline-none"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length <= 3}
              className="bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === "otp" && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-3 rounded-lg w-full focus:outline-none"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length === 0}
              className="bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setMessage("");
              }}
              className="text-blue-500 text-sm mt-2 underline"
            >
              Change Phone Number
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LoginArea;
