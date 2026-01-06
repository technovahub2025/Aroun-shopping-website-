import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ImagePlus,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Clipboard,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
import { ReactSortable } from "react-sortablejs";
import productApi from "../../../api/productApi";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    type: "",
    rating: "",
    mrp: "",
   
    images: [],
  });

  // Refs for auto-focus
  const titleRef = useRef(null);
  const categoryRef = useRef(null);
  const descriptionRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);
  const ratingRef = useRef(null);
  const mrpRef = useRef(null);

  // Store all refs in an object for easy access
  const fieldRefs = {
    title: titleRef,
    category: categoryRef,
    description: descriptionRef,
    price: priceRef,
    stock: stockRef,
    rating: ratingRef,
    mrp: mrpRef,
  };

  // Ref for handling paste events
  const modalRef = useRef(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      setProducts(res.data || []);
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Setup paste event listener when modal is open
  useEffect(() => {
    if (showModal) {
      // Auto-focus first field when modal opens
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
        }
      }, 100);

      const handlePaste = (e) => {
        // Check if we're pasting images
        const items = e.clipboardData.items;
        if (!items) return;

        const imageFiles = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault(); // Prevent default paste behavior
          handleImageUpload(imageFiles);
          toast.success(`Pasted ${imageFiles.length} image(s)`);
        }
      };

      // Add paste event listener to the entire document when modal is open
      document.addEventListener("paste", handlePaste);

      return () => {
        document.removeEventListener("paste", handlePaste);
      };
    }
  }, [showModal]);

  // Input handler with auto-focus on Enter
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Enter key press to move to next field
  const handleKeyDown = (e, currentField, maxLength) => {
    // If maxLength is reached, move to next field
    if (
      maxLength &&
      e.target.value.length >= maxLength &&
      e.key !== "Backspace" &&
      e.key !== "Delete"
    ) {
      e.preventDefault();
      moveToNextField(currentField);
      return;
    }

    // On Enter key, move to next field
    if (e.key === "Enter") {
      e.preventDefault();
      moveToNextField(currentField);
    }
  };

  // Function to move focus to next field
  const moveToNextField = (currentField) => {
    const fieldOrder = [
      "title",
      "category",
      "description",
      "price",
      "stock",
      "mrp",
      "rating",
    ];
    const currentIndex = fieldOrder.indexOf(currentField);

    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      const nextRef = fieldRefs[nextField];

      if (nextRef && nextRef.current) {
        nextRef.current.focus();
        // For textarea, move cursor to end
        if (nextField === "description" && nextRef.current) {
          setTimeout(() => {
            nextRef.current.selectionStart = nextRef.current.value.length;
            nextRef.current.selectionEnd = nextRef.current.value.length;
          }, 0);
        }
      }
    }
  };

  // Handle Tab key for form navigation
  const handleTabKey = (e) => {
    if (e.key === "Tab") {
      // Allow default tab behavior but add visual feedback
      const activeElement = document.activeElement;
      if (
        (activeElement && activeElement.tagName === "INPUT") ||
        activeElement.tagName === "TEXTAREA"
      ) {
        // Add a subtle highlight effect
        activeElement.classList.add("tab-highlight");
        setTimeout(() => {
          activeElement.classList.remove("tab-highlight");
        }, 300);
      }
    }
  };

  // Image upload (manual + drag + paste)
  const handleImageUpload = (files) => {
    const newPreviews = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newPreviews],
    }));
  };

  // Remove image - FIXED VERSION
const removeImage = async (index, imageUrl) => {
  setLoading(true);

  try {
    const image = formData.images[index];

    // 🆕 LOCAL IMAGE (not uploaded yet)
    if (image?.file) {
      URL.revokeObjectURL(image.preview);

      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));

      toast.success("Image removed");
      return;
    }

    // 🌍 EXISTING IMAGE (Cloudinary)
    const response = await productApi.deleteImage(
      editingProduct._id,
      { imageUrl },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to delete image");
    }

    // ✅ Update UI AFTER backend success
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    toast.success("Image deleted successfully!");
  } catch (error) {
    console.error(error);
    toast.error(
      error.response?.data?.message || "Failed to delete image"
    );
  } finally {
    setLoading(false); // ✅ ALWAYS runs
  }
};

  

  // Open modal (add/edit)
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category || "",
        type: product.type || "",
        rating: product.rating || "",
        mrp: product.mrp || "",
       
        images:
          product.images?.map((url) => ({
            preview: url,
            isExisting: true, // Mark as existing image
          })) || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        type: "",
        rating: "",
        mrp: "",
        images: [],
      });
    }
    setShowModal(true);
  };

  // Create / Update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "images") data.append(key, value);
    });

    // Handle images: new files + existing image URLs
    formData.images.forEach((img) => {
      if (img.file) {
        // New image file
        data.append("images", img.file);
      } else if (img.isExisting) {
        // Existing image - keep it
        data.append("existingImages", img.preview);
      }
    });

    const config = { headers: { "Content-Type": "multipart/form-data" } };

    try {
      if (editingProduct) {
        setLoading(true);
        const response = await productApi.update(
          editingProduct._id,
          data,
          config
        );
        toast.success("Product updated successfully!");

        // Update local state without refetching everything
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? response.data : p))
        );

        setLoading(false);
      } else {
        setLoading(true);
        const response = await productApi.create(data, config);
        toast.success("Product added successfully!");

        // Add new product to local state
        setProducts((prev) => [...prev, response.data]);

        // Calculate which page the new product would be on
        const newProducts = [...products, response.data];
        const filtered = newProducts.filter(
          (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Find position of new product in filtered results
        const newIndex = filtered.findIndex((p) => p._id === response.data._id);
        if (newIndex !== -1) {
          const newPage = Math.ceil((newIndex + 1) / itemsPerPage);
          setCurrentPage(newPage);
        }

        setLoading(false);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await productApi.remove(id);
      toast.success("Product deleted");

      // Remove from local state
      setProducts((prev) => prev.filter((p) => p._id !== id));

      // Check if we need to go back a page
      const filtered = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const totalItems = filtered.length;
      const totalPages = Math.ceil((totalItems - 1) / itemsPerPage); // -1 because we're deleting one

      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Filter + unique categories
  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate the items to display on current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }

      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }

      pageNumbers.push(1);

      if (startPage > 2) {
        pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (
      pageNumber < 1 ||
      pageNumber > totalPages ||
      pageNumber === "..."
    )
      return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dropzone hook
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: handleImageUpload,
  });

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Copy image URL to clipboard
  const copyImageUrl = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Image URL copied to clipboard"))
      .catch(() => toast.error("Failed to copy URL"));
  };

  // Handle copy-paste button click
  const handleCopyPasteClick = () => {
    toast.info("Click inside the image area and press Ctrl+V to paste images");
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Product Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, totalItems)} of {totalItems} products
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {/* Controls - Search and Items per page */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm w-full sm:w-80">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="ml-2 outline-none flex-1 text-gray-700"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded-md px-3 py-1 text-sm focus:ring-red-500 focus:border-red-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
        <table className="min-w-[700px] w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">MRP</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              currentItems.map((p) => (
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
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.title}
                  </td>
                  <td className="px-4 py-3">{p.category || "-"}</td>
                  <td className="px-4 py-3">₹{p.price}</td>
                  {p.mrp ? (
                    <td className="px-4 py-3">₹{p.mrp}</td>
                  ) : (
                    <td className="px-4 py-3">-</td>
                  )}
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.rating ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4" /> {p.rating}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal(p)}
                      className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(pageNum)}
                className={`min-w-[40px] h-10 rounded-md text-sm font-medium ${
                  pageNum === currentPage
                    ? "bg-red-500 text-white"
                    : pageNum === "..."
                    ? "text-gray-400 cursor-default"
                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                }`}
                disabled={pageNum === "..."}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className="w-16 border rounded-md px-2 py-1 text-sm text-center focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onKeyDown={handleTabKey}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-lg"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Press Enter to move to next field
                </span>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title + Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (Press Enter for next)
                    </span>
                  </label>
                  <input
                    ref={titleRef}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "title", 100)}
                    required
                    className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter product title"
                  />
                </div>

                {/* Category input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Layers className="w-4 h-4" /> Category{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={categoryRef}
                      list="category-list"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, "category", 50)}
                      placeholder="Select or type new category"
                      required
                      className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <datalist id="category-list">
                      {uniqueCategories.map((cat, index) => (
                        <option key={index} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                  <span className="text-xs text-gray-500 ml-2">
                    (Press Enter for next)
                  </span>
                </label>
                <textarea
                  ref={descriptionRef}
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      moveToNextField("description");
                    }
                  }}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Enter product description"
                ></textarea>
              </div>

              {/* Price, Stock, MRP */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      ref={priceRef}
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, "price")}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 w-full border rounded-md p-2 pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={stockRef}
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "stock")}
                    required
                    min="0"
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      ref={mrpRef}
                      type="number"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, "mrp")}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 w-full border rounded-md p-2 pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rating (0–5)
                  </label>
                  <input
                    ref={ratingRef}
                    type="number"
                    name="rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "rating")}
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="0.0 - 5.0"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Images
                  </label>
                </div>

                <div
                  {...getRootProps()}
                  className="mt-2 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="w-6 h-6 mb-2 text-gray-400" />
                  <p className="text-sm">
                    Drag & drop, click to upload, or paste images
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports: Ctrl+V paste, drag & drop
                  </p>
                </div>

                <ReactSortable
                  list={formData.images}
                  setList={(newList) =>
                    setFormData((prev) => ({ ...prev, images: newList }))
                  }
                  animation={200}
                  className="flex flex-wrap gap-3 mt-3"
                >
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-md overflow-hidden border shadow-sm group"
                    >
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition">
                        Drag to reorder
                      </div>
                      <div className="absolute top-0 left-0 right-0 flex justify-between p-1">
                        {img.isExisting && (
                          <span className="text-xs bg-green-500 text-white px-1 rounded">
                            Existing
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            copyImageUrl(img.preview);
                          }}
                          className="text-xs bg-blue-500 text-white px-1 rounded flex items-center gap-1"
                          title="Copy URL"
                        >
                          <Copy className="w-2 h-2" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeImage(i,img.preview);
                        }}
                       
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl hover:bg-red-600 transition"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </ReactSortable>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-white transition-all duration-200
                              ${
                                loading
                                  ? "bg-red-400 cursor-wait"
                                  : "bg-red-500 hover:bg-red-600 cursor-pointer"
                              }
                            `}
                >
                  {loading
                    ? "Please wait..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tab-highlight {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
          transition: box-shadow 0.2s ease;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Products;