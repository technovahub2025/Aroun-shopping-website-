import { useEffect, useState } from "react";
import productApi from "../../api/productApi";

export default function useCatalog() {
  const [snapshot] = useState(() => productApi.getCatalogSnapshot());
  const [products, setProducts] = useState(snapshot || []);
  const [loading, setLoading] = useState(snapshot === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    productApi.getAll().then(({ data }) => {
      if (!active) return;
      setProducts(Array.isArray(data) ? data : data?.products || []);
    }).catch((err) => {
      if (active && snapshot === null) setError(err.response?.data?.message || err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [snapshot]);

  return { products, setProducts, loading, error, setError };
}
