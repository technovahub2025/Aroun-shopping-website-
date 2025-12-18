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


// ✅ Register with Password
export const registerWithPassword = async ({ name, phone, password }) => {
  try {
    const { data } = await apiClient.post("/auth/register", {
      name,
      phone,
      password,
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

// ✅ Login with Password
export const loginWithPassword = async ({ phone, password }) => {
  try {
    const { data } = await apiClient.post("/auth/login", {
      phone,
      password,
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};
