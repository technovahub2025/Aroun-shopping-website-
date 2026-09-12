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

export const normalizeExcelRow = (row, index) => {
  const title = String(readRowValue(row, ["title", "producttitle", "name", "product"])).trim();
  const description = String(
    readRowValue(row, ["description", "details", "about"])
  ).trim();
  const category = String(
    readRowValue(row, ["category", "cat", "categoryname"])
  ).trim();
  const type = String(readRowValue(row, ["type", "subtype", "subcategory"])).trim();

  const price = parseNumber(
    readRowValue(row, ["price", "saleprice", "salesprice", "sellingprice"]),
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


export const parseProductSheet = (cells) => {
  const headerIndex = cells.findIndex(row => {
    const headers = row.map(normalizeHeader);
    return ["product", "title", "producttitle", "name"].some(key => headers.includes(key)) &&
      ["price", "saleprice", "salesprice", "sellingprice"].some(key => headers.includes(key));
  });
  if (headerIndex < 0) throw new Error("Could not find product and price column headings.");
  const headers = cells[headerIndex];
  const rows = [];
  cells.slice(headerIndex + 1).forEach((cellsRow, offset) => {
    const row = Object.fromEntries(headers.map((header, index) => [header, cellsRow[index] ?? ""]).filter(([header]) => String(header).trim()));
    const name = String(readRowValue(row, ["product", "title", "producttitle", "name"])).trim();
    const category = readRowValue(row, ["category", "cat", "categoryname"]);
    const price = readRowValue(row, ["price", "saleprice", "salesprice", "sellingprice"]);
    const mrp = readRowValue(row, ["mrp", "originalprice", "regularprice"]);
    const stock = readRowValue(row, ["stock", "quantity", "qty"]);
    if (!name && !category && price === "" && mrp === "" && stock === "") return;
    if (/^(grand\s*)?total$/i.test(name) && !category) return;
    rows.push({ ...normalizeExcelRow(row, headerIndex + offset), imageFiles: [] });
  });
  return { rows, isSalesReport: cells.slice(0, headerIndex).some(row => row.some(cell => /sales summary/i.test(String(cell)))) };
};
