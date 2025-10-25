import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X, ImagePlus, Star } from "lucide-react";
import { toast } from "react-toastify";
import productApi from "../../../api/productApi";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    categories: "",
    type: "",
    rating: "",
    images: [],
  });

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      setProducts(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "categories"
          ? value // keep as string for input field
          : value,
    }));
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...previews],
    }));
  };

  // Remove uploaded image
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Open modal for add/edit
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categories:
          Array.isArray(product.categories)
            ? product.categories.join(", ")
            : product.categories || "",
        type: product.type || "",
        rating: product.rating || "",
        images:
          product.images?.map((url) => ({
            preview: url,
          })) || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        stock: "",
        categories: "",
        type: "",
        rating: "",
        images: [],
      });
    }
    setShowModal(true);
  };

  // Create or update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("type", formData.type);
    data.append("rating", formData.rating);

    // Convert comma-separated categories to array
    const categoryArray = formData.categories
      ? formData.categories
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c)
      : [];
    data.append("categories", JSON.stringify(categoryArray));

    // Add new image files only
    formData.images.forEach((img) => {
      if (img.file) {
        data.append("images", img.file);
      }
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      if (editingProduct) {
        await productApi.update(editingProduct._id, data, config);
        toast.success("Product updated successfully");
      } else {
        await productApi.create(data, config);
        toast.success("Product added successfully");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productApi.remove(id);
        toast.success("Product deleted");
        fetchProducts();
      } catch {
        toast.error("Failed to delete product");
      }
    }
  };

  // Filter products
  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center sm:text-left">
          Products Management
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6 w-full sm:w-80 md:w-96">
        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 outline-none flex-1 text-gray-700 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-[650px] w-full text-xs sm:text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] sm:text-xs">
            <tr>
              <th className="px-3 sm:px-4 py-3">Image</th>
              <th className="px-3 sm:px-4 py-3">Title</th>
              <th className="px-3 sm:px-4 py-3">Type</th>
              <th className="px-3 sm:px-4 py-3">Price</th>
              <th className="px-3 sm:px-4 py-3">Stock</th>
              <th className="px-3 sm:px-4 py-3">Categories</th>
              <th className="px-3 sm:px-4 py-3">Rating</th>
              <th className="px-3 sm:px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p._id}
                  className="border-b hover:bg-gray-50 transition text-xs sm:text-sm"
                >
                  <td className="px-3 sm:px-4 py-3">
                    <img
                      src={
                        Array.isArray(p.images) && p.images.length > 0
                          ? p.images[0]
                          : "/placeholder.png"
                      }
                      alt={p.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 break-words max-w-[120px] sm:max-w-[180px]">
                    {p.title}
                  </td>
                  <td className="px-3 sm:px-4 py-3">{p.type || "-"}</td>
                  <td className="px-3 sm:px-4 py-3">₹{p.price}</td>
                  <td className="px-3 sm:px-4 py-3">{p.stock}</td>
                  <td className="px-3 sm:px-4 py-3">
                    {Array.isArray(p.categories) && p.categories.length > 0
                      ? p.categories.join(", ")
                      : p.categories || "-"}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    {p.rating ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4" /> {p.rating}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal(p)}
                      className="p-1.5 sm:p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 sm:p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg sm:max-w-2xl overflow-y-auto max-h-[90vh] shadow-lg">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Basic Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <input
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                ></textarea>
              </div>

              {/* Numeric Fields */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rating (0–5)
                  </label>
                  <input
                    type="number"
                    name="rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categories (comma separated)
                </label>
                <input
                  name="categories"
                  value={formData.categories}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Images
                </label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border"
                    >
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0 right-0 bg-black/60 text-white p-1 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed flex items-center justify-center rounded-md cursor-pointer hover:bg-gray-50">
                    <ImagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border rounded-md text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm sm:text-base"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
