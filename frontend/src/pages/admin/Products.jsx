import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Copy,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
import { ReactSortable } from "react-sortablejs";
import * as XLSX from "xlsx";
import productApi from "../../../api/productApi";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const readRowValue = (row, keys) => {
  const normalized = Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [normalizeHeader(key), value])
  );

  for (const key of keys) {
    const value = normalized[normalizeHeader(key)];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
};

const parseNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseImageList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => parseImageList(entry));
  }

  return String(value)
    .split(/[\n,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeExcelRow = (row, index) => {
  const title = String(readRowValue(row, ["title", "producttitle", "name"])).trim();
  const description = String(
    readRowValue(row, ["description", "details", "about"])
  ).trim();
  const category = String(
    readRowValue(row, ["category", "cat", "categoryname"])
  ).trim();
  const type = String(readRowValue(row, ["type", "subtype", "subcategory"])).trim();

  const price = parseNumber(
    readRowValue(row, ["price", "saleprice", "sellingprice"]),
    null
  );
  const mrp = parseNumber(
    readRowValue(row, ["mrp", "originalprice", "regularprice"]),
    null
  );
  const stock = parseNumber(readRowValue(row, ["stock", "quantity", "qty"]), null);
  const rating = parseNumber(readRowValue(row, ["rating", "stars"]), 0);
  const discount = parseNumber(
    readRowValue(row, ["discount", "discountpercent", "offer"]),
    0
  );
  const images = parseImageList(
    readRowValue(row, ["images", "image", "imageurl", "imageurls", "url"])
  );

  const issues = [];

  if (!title) issues.push("Missing title");
  if (!category) issues.push("Missing category");
  if (price === null) issues.push("Missing price");
  if (stock === null) issues.push("Missing stock");
  if (mrp === null) issues.push("Missing MRP");

  return {
    rowNumber: index + 2,
    title,
    description,
    category,
    type,
    price,
    mrp,
    stock,
    rating,
    discount,
    images,
    issues,
    isValid: issues.length === 0,
  };
};

const downloadTemplate = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([
    {
      title: "Sample Product",
      description: "Short product description",
      category: "Demo Category",
      type: "Demo Type",
      price: 499,
      mrp: 699,
      stock: 25,
      rating: 4.5,
      discount: 10,
      imageUrls: "https://example.com/product-image.jpg",
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, "product-import-template.xlsx");
};

const fieldOrder = [
  "title",
  "category",
  "description",
  "price",
  "stock",
  "mrp",
  "discount",
  "rating",
];

const Products = () => {
  const cachedProducts = productApi.getCachedAll() || [];
  const [products, setProducts] = useState(cachedProducts);
  const [loading, setLoading] = useState(cachedProducts.length === 0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsingExcel, setParsingExcel] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    type: "",
    rating: "",
    mrp: "",
    discount: "",
    images: [],
  });

  const titleRef = useRef(null);
  const categoryRef = useRef(null);
  const descriptionRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);
  const mrpRef = useRef(null);
  const discountRef = useRef(null);
  const ratingRef = useRef(null);
  const importInputRef = useRef(null);
  const modalRef = useRef(null);

  const fieldRefs = {
    title: titleRef,
    category: categoryRef,
    description: descriptionRef,
    price: priceRef,
    stock: stockRef,
    mrp: mrpRef,
    discount: discountRef,
    rating: ratingRef,
  };

  useEffect(() => {
    productApi.prefetchDeleted?.();
    const fetchProducts = async () => {
      try {
        if (cachedProducts.length === 0) {
          setLoading(true);
        }

        const res = await productApi.getAll(undefined, {
          forceRefresh: cachedProducts.length > 0,
        });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cachedProducts.length]);

  useEffect(() => {
    if (!showModal) return undefined;

    const timer = setTimeout(() => {
      titleRef.current?.focus();
    }, 100);

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        handleImageUpload(imageFiles);
        toast.success(`Pasted ${imageFiles.length} image(s)`);
      }
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("paste", handlePaste);
    };
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const moveToNextField = (currentField) => {
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex === -1 || currentIndex >= fieldOrder.length - 1) return;

    const nextField = fieldOrder[currentIndex + 1];
    const nextRef = fieldRefs[nextField];
    nextRef?.current?.focus();
  };

  const handleKeyDown = (e, currentField, maxLength) => {
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

    if (e.key === "Enter") {
      e.preventDefault();
      moveToNextField(currentField);
    }
  };

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

  const removeImage = (index) => {
    setFormData((prev) => {
      const updatedImages = [...prev.images];
      if (updatedImages[index]?.file) {
        URL.revokeObjectURL(updatedImages[index].preview);
      }
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price ?? "",
        stock: product.stock ?? "",
        category: product.category || "",
        type: product.type || "",
        rating: product.rating ?? "",
        mrp: product.mrp ?? "",
        discount: product.discount ?? "",
        images:
          product.images?.map((url) => ({
            preview: url,
            isExisting: true,
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
        discount: "",
        images: [],
      });
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "images") {
        data.append(key, value);
      }
    });

    formData.images.forEach((img) => {
      if (img.file) {
        data.append("images", img.file);
      } else if (img.isExisting) {
        data.append("existingImages", img.preview);
      }
    });

    const config = { headers: { "Content-Type": "multipart/form-data" } };

    try {
      setLoading(true);

      if (editingProduct) {
        const response = await productApi.update(editingProduct._id, data, config);
        setProducts((prev) =>
          prev.map((item) => (item._id === editingProduct._id ? response.data : item))
        );
        toast.success("Product updated successfully!");
      } else {
        const response = await productApi.create(data, config);
        setProducts((prev) => [...prev, response.data]);
        toast.success("Product added successfully!");
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const product = products.find((item) => item?._id === id);
      await productApi.remove(id, { product });
      setProducts((prev) => prev.filter((item) => item._id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleExcelUpload = async (file) => {
    if (!file) return;

    setParsingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("Excel file does not contain any sheets");
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!rows.length) {
        toast.error("No product rows found in the file");
        return;
      }

      const normalized = rows.map((row, index) => normalizeExcelRow(row, index));
      setImportRows(normalized);
      setImportFileName(file.name);
      toast.success(`Loaded ${normalized.length} row(s) from Excel`);
    } catch (error) {
      console.error(error);
      toast.error("Could not read Excel file");
    } finally {
      setParsingExcel(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const handleImportSubmit = async () => {
    const validRows = importRows.filter((row) => row.isValid);
    if (!validRows.length) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    const createdProducts = [];
    let failed = 0;

    try {
      for (const row of validRows) {
        const data = new FormData();
        data.append("title", row.title);
        data.append("description", row.description || "");
        data.append("category", row.category);
        data.append("type", row.type || "");
        data.append("price", row.price);
        data.append("mrp", row.mrp);
        data.append("stock", row.stock);
        data.append("rating", row.rating ?? 0);
        data.append("discount", row.discount ?? 0);
        if (row.images.length > 0) {
          data.append("imageUrls", row.images.join(","));
        }

        try {
          const response = await productApi.create(data, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          createdProducts.push(response.data);
        } catch (error) {
          failed += 1;
          console.error("Failed to import row", row.rowNumber, error);
        }
      }

      if (createdProducts.length > 0) {
        setProducts((prev) => [...prev, ...createdProducts]);
      }

      setImportRows([]);
      setImportFileName("");

      if (failed > 0) {
        toast.warn(`Imported ${createdProducts.length} row(s), ${failed} failed`);
      } else {
        toast.success(`Imported ${createdProducts.length} row(s) successfully`);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClearImport = () => {
    setImportRows([]);
    setImportFileName("");
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  };

  const handleCopyPasteClick = () => {
    toast.info("Click inside the image area and press Ctrl+V to paste images");
  };

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [products, searchTerm]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const importedValidCount = importRows.filter((row) => row.isValid).length;
  const importedIssueCount = importRows.reduce((count, row) => count + row.issues.length, 0);

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: handleImageUpload,
  });

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const copyImageUrl = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Image URL copied to clipboard"))
      .catch(() => toast.error("Failed to copy URL"));
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {totalItems === 0 ? 0 : indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, totalItems)} of {totalItems} products
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-5 h-5" /> Download Excel Format
          </button>
          <button
            onClick={() => openModal()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Add Product Manually
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-red-500" />
                Excel Upload
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a product sheet, preview the rows, then import them into the database.
              </p>
            </div>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={parsingExcel}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition cursor-pointer"
            >
              {parsingExcel ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" /> Reading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Choose File
                </>
              )}
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleExcelUpload(e.target.files?.[0])}
          />

          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-gray-500">Rows loaded</div>
              <div className="text-lg font-semibold text-gray-800">{importRows.length}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-gray-500">Valid rows</div>
              <div className="text-lg font-semibold text-green-600">{importedValidCount}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-gray-500">Issues</div>
              <div className="text-lg font-semibold text-amber-600">{importedIssueCount}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={!importRows.length || importing}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition cursor-pointer ${
                !importRows.length || importing
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {importing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Import Valid Rows
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearImport}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Clear Preview
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 leading-5">
            Accepted columns: <span className="font-medium">title, description, category, type, price, mrp, stock, rating, discount, imageUrls</span>
          </div>

          {importFileName && (
            <div className="mt-3 text-sm text-gray-600">
              Loaded file: <span className="font-medium">{importFileName}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Manual Entry
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use the product form to add a single product with images, paste support, and drag-and-drop.
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Open Manual Form
          </button>
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            Tip: you can also use the Excel template above and paste image URLs directly into the sheet.
          </div>
        </div>
      </div>

      {importRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">Excel Preview</h3>
              <p className="text-sm text-gray-500">
                Review the parsed rows before importing them.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> {importedValidCount} valid
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> {importRows.length - importedValidCount} invalid
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">MRP</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Images</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row) => (
                  <tr key={row.rowNumber} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.rowNumber}</td>
                    <td className="px-4 py-3">{row.title || "-"}</td>
                    <td className="px-4 py-3">{row.category || "-"}</td>
                    <td className="px-4 py-3">Rs. {row.price ?? "-"}</td>
                    <td className="px-4 py-3">Rs. {row.mrp ?? "-"}</td>
                    <td className="px-4 py-3">{row.stock ?? "-"}</td>
                    <td className="px-4 py-3">{row.rating ?? "-"}</td>
                    <td className="px-4 py-3">{row.images.length}</td>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700">
                          <CheckCircle2 className="w-4 h-4" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          {row.issues.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              currentItems.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={
                        Array.isArray(product.images) && product.images.length > 0
                          ? product.images[0]
                          : "/placeholder.png"
                      }
                      alt={product.title}
                      className="w-14 h-14 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{product.title}</td>
                  <td className="px-4 py-3">{product.category || "-"}</td>
                  <td className="px-4 py-3">Rs. {product.price}</td>
                  <td className="px-4 py-3">{product.mrp ? `Rs. ${product.mrp}` : "-"}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    {product.rating ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4" /> {product.rating}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
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

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="Previous Page"
            >
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Prev
              </span>
            </button>

            {getPageNumbers().map((pageNum, index) => (
              <button
                key={`${pageNum}-${index}`}
                onClick={() => pageNum !== "..." && handlePageChange(pageNum)}
                disabled={pageNum === "..."}
                className={`min-w-[40px] h-10 rounded-md px-3 text-sm font-medium ${
                  pageNum === currentPage
                    ? "bg-red-500 text-white"
                    : pageNum === "..."
                    ? "text-gray-400 cursor-default"
                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title="Next Page"
            >
              <span className="flex items-center gap-1">
                Next
                <ChevronRight className="w-4 h-4" />
              </span>
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
                const page = parseInt(e.target.value, 10);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className="w-16 border rounded-md px-2 py-1 text-sm text-center focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              const activeElement = document.activeElement;
              if (
                activeElement &&
                (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
              ) {
                activeElement.classList.add("tab-highlight");
                setTimeout(() => {
                  activeElement.classList.remove("tab-highlight");
                }, 300);
              }
            }
          }}
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
                <span className="text-xs text-gray-500">Press Enter to move to next field</span>
                <button type="button" onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
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
                />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
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
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="0.00"
                  />
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
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount
                  </label>
                  <input
                    ref={discountRef}
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "discount")}
                    min="0"
                    step="0.01"
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rating (0-5)
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Images</label>
                </div>

                <div
                  {...getRootProps()}
                  className="mt-2 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="w-6 h-6 mb-2 text-gray-400" />
                  <p className="text-sm">
                    Drag and drop, click to upload, or paste images
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports paste, drag and drop, and file upload
                  </p>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleCopyPasteClick}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Need help pasting images?
                  </button>
                </div>

                <ReactSortable
                  list={formData.images}
                  setList={(newList) =>
                    setFormData((prev) => ({ ...prev, images: newList }))
                  }
                  animation={200}
                  className="flex flex-wrap gap-3 mt-3"
                >
                  {formData.images.map((img, index) => (
                    <div
                      key={`${img.preview}-${index}`}
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
                          removeImage(index);
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
                  className={`px-4 py-2 rounded-md text-white transition-all duration-200 ${
                    loading
                      ? "bg-red-400 cursor-wait"
                      : "bg-red-500 hover:bg-red-600 cursor-pointer"
                  }`}
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
    </div>
  );
};

export default Products;
