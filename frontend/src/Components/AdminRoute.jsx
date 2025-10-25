import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.user.user);

  // Not logged in → redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but not admin → block access
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Valid admin → allow access
  return children;
};

export default AdminRoute;
