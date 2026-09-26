import React, { useCallback, useEffect, useState } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  Trash2,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminRoutes from "./Routes";

// CHANGE THIS PATH ONLY IF YOUR API FILE IS IN A DIFFERENT LOCATION
import apiClient from "../../../api/apiClient";
const LayoutDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [storageStatus, setStorageStatus] = useState({
    loading: true,
    unavailable: false,
    connected: false,
    email: null,
    folderAccessible: false,
  });

  const [refreshing, setRefreshing] = useState(false);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  /*
   * Check storage connection status
   *
   * Uses the existing apiClient.
   * No backend URL is hard-coded here.
   */
  const checkStorageStatus = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await apiClient.get("/google-drive/status", {
        params: {
          _: Date.now(),
        },
      });

      const data = response.data;

      setStorageStatus({
        loading: false,
        unavailable: false,
        connected: Boolean(data?.connected),
        email: data?.email || null,
        folderAccessible: Boolean(data?.folderAccessible),
      });
    } catch (error) {
      console.error(
        "Storage connection check failed:",
        error?.response?.data || error?.message || error
      );

      setStorageStatus((previous) => ({
        ...previous,
        loading: false,
        unavailable: true,
      }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  /*
   * Check status when Admin opens
   * and periodically refresh it.
   */
  useEffect(() => {
    checkStorageStatus();

    const interval = setInterval(() => {
      checkStorageStatus();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [checkStorageStatus]);

  /*
   * Reconnect
   *
   * apiClient.defaults.baseURL already contains:
   * <existing API URL>/api
   *
   * So we remove /api before opening the OAuth endpoint.
   */
  const reconnectStorage = () => {
    const baseURL = apiClient.defaults.baseURL;

    if (!baseURL) {
      console.error("API base URL is not configured.");
      return;
    }

    const apiRoot = baseURL.replace(/\/api\/?$/, "");

    window.location.href = `${apiRoot}/api/google-drive/auth`;
  };

  const isConnected = storageStatus.connected;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-40 inset-y-0 left-0 h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out bg-white w-64 shadow-lg md:translate-x-0 md:static md:shadow-none`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0">
            <Link to="/">
              <h2 className="text-xl font-semibold text-gray-800">
                ← Back to website
              </h2>
            </Link>

            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded hover:bg-gray-100"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex flex-col space-y-1 px-4 flex-shrink-0">
            <Link
              to="/admin"
              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Products</span>
            </Link>

            <Link
              to="/admin/deleted-products"
              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
            >
              <Trash2 className="w-5 h-5" />
              <span>Deleted Products</span>
            </Link>
          </nav>

          {/* Push status to bottom */}
          <div className="flex-1" />

          {/* Connection Status */}
          <div className="border-t bg-white flex-shrink-0">
            <div className="px-4 py-4">
              {/* Status Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <HardDrive className="w-4 h-4 text-gray-600 flex-shrink-0" />

                  {/* Loading */}
                  {storageStatus.loading ? (
                    <span className="text-sm text-gray-500">
                      Checking...
                    </span>
                  ) : storageStatus.unavailable ? (
                    <span className="text-sm text-amber-600">Status unavailable</span>
                  ) : isConnected ? (
                    /* Connected */
                    <>
                      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />

                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>

                      <span className="text-sm font-medium text-green-600">
                        Connected
                      </span>

                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </>
                  ) : (
                    /* Not Connected */
                    <>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 flex-shrink-0" />

                      <span className="text-sm font-medium text-red-600">
                        Not Connected
                      </span>

                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    </>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={checkStorageStatus}
                  disabled={refreshing}
                  title="Refresh connection status"
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-500 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Connected Email */}
              {!storageStatus.loading && storageStatus.email && (
                <p
                  className="text-xs text-gray-500 mt-2 truncate"
                  title={storageStatus.email}
                >
                  {storageStatus.email}
                </p>
              )}

              {/* Folder Ready */}
              {!storageStatus.loading && !storageStatus.unavailable && isConnected && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />

                  <span className="text-xs text-green-600">
                    {storageStatus.folderAccessible ? "Storage folder ready" : "Storage folder unavailable"}
                  </span>
                </div>
              )}

              {/* Reconnect */}
              {!storageStatus.loading && !storageStatus.unavailable && !isConnected && (
                <button
                  type="button"
                  onClick={reconnectStorage}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />

                  <span>Reconnect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Navbar */}
        <header className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-gray-100"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>

        {/* Admin Pages */}
        <main data-admin-scroll className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <AdminRoutes />
        </main>
      </div>
    </div>
  );
};

export default LayoutDashboard;
