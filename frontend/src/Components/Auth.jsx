import React, { useState, useRef, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import Logo from "../assets/newlogo.png";
import { sendOtp, verifyOtp } from "../../api/authApi";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";

const Auth = ({ toggleLoginModal }) => {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState(["", "", "", ""]); // ✅ 4 digits
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0);

  const dispatch = useDispatch();
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (isResend = false) => {
    if (phone.length < 10) return setMessage("Enter a valid phone number");

    try {
      setLoading(true);
      const data = await sendOtp(phone);
      setMessage(data.message || "OTP sent successfully!");
      toast.success(isResend ? "OTP resent!" : "OTP sent successfully!");
      setStep("otp");
      setTimer(30);
    } catch (err) {
      setMessage(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length < 4) return setMessage("Enter full 4-digit OTP");

    try {
      setLoading(true);
      const data = await verifyOtp(phone, otpCode);

      dispatch(setUser(data.user));
      if (data.token) localStorage.setItem("token", data.token);

      toast.success("Login successful!");
      toggleLoginModal();
    } catch (err) {
      setMessage(err.message || "Invalid OTP");
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box
    if (value && index < 3) otpRefs.current[index + 1]?.focus();

    // Auto submit on last digit
    if (index === 3 && value) handleVerifyOtp();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={toggleLoginModal}
      ></div>

      {/* Modal */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-2xl w-11/12 max-w-md p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 w-auto" />
          <button onClick={toggleLoginModal}>
            <X size={24} className="text-gray-600 hover:text-red-500 transition" />
          </button>
        </div>

        {message && (
          <p className="text-sm text-center text-red-500 mb-4">{message}</p>
        )}

        {/* Step 1: Phone */}
        {step === "phone" && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-gray-700">
              Enter Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-green-400 outline-none transition"
            />
            <button
              onClick={() => handleSendOtp(false)}
              disabled={loading}
              className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <div className="flex flex-col gap-6">
            <label className="text-sm font-semibold text-gray-700 text-center">
              Enter the 4-digit OTP sent to your number
            </label>

            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl font-semibold border rounded-lg border-gray-300 focus:ring-2 focus:ring-red-400 outline-none transition"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length < 4}
              className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center mt-2 text-sm text-gray-600">
              {timer > 0 ? (
                <span>
                  Resend OTP in <b>{timer}s</b>
                </span>
              ) : (
                <button
                  onClick={() => handleSendOtp(true)}
                  className="text-red-500 font-semibold hover:text-red-600 flex items-center justify-center gap-1 mx-auto"
                >
                  <RotateCcw size={16} /> Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", ""]); // Reset
                setMessage("");
              }}
              className="text-red-500 text-sm mt-3 underline text-center"
            >
              Change Phone Number
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Auth;
