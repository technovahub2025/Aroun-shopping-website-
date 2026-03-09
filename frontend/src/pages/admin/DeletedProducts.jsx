import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import productApi from "../../../api/productApi";

const DeletedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getDeleted();
      setProducts((res.data || []).filter((p) => p?.isDeleted === true));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch deleted products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedProducts();
  }, []);

  const handleRestore = async (id) => {
    try {
      setRestoringId(id);
      await productApi.restore(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product restored successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore product");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Deleted Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Restore products from here to make them visible again.
        </p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-[700px] w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Deleted At</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No deleted products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={
                        Array.isArray(p.images) && p.images.length > 0
                          ? p.images[0]
                          : "/placeholder.png"
                      }
                      alt={p.title}
                      className="w-14 h-14 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                  <td className="px-4 py-3">{p.category || "-"}</td>
                  <td className="px-4 py-3">Rs. {p.price}</td>
                  <td className="px-4 py-3">
                    {p.deletedAt ? new Date(p.deletedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRestore(p._id)}
                      disabled={restoringId === p._id}
                      className={`p-2 rounded-md cursor-pointer ${
                        restoringId === p._id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeletedProducts;
