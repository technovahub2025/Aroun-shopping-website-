import { useState } from "react";
import productApi from "../../../api/productApi";
import useCatalogPagination from "../../hooks/useCatalogPagination";

export default function useAdminProducts({ search = '', deleted = false } = {}) {
  const [pageSize, setPageSize] = useState(20);
  const result = useCatalogPagination(productApi.getAdminBatch, { search, deleted, limit: pageSize });
  return { ...result, products: result.items, pageSize, setPageSize };
}
