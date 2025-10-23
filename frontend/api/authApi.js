import apiClient from "./apiClient";

// ✅ Send OTP
export const sendOtp = async (phone) => {
  try {
    const { data } = await apiClient.post("/auth/send-otp", { phone  });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Server error" };
  }
};

// ✅ Verify OTP
export const verifyOtp = async (phone, code) => {
  try {
    const { data } = await apiClient.post("/auth/verify-otp", { phone, code });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Invalid OTP" };
  }
};
