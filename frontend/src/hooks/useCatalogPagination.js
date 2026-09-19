import { useCallback, useEffect, useState } from "react";

export default function useCatalogPagination(fetchPage, params = {}) {
  const paramsKey = JSON.stringify(params);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const filterKey = JSON.stringify([paramsKey, revision]);
  const [navigation, setNavigation] = useState({ key: filterKey, page: 1 });
  const current = navigation.key === filterKey ? navigation : { key: filterKey, page: 1 };
  if (navigation.key !== filterKey) setNavigation(current);
  const requestKey = JSON.stringify({ params: JSON.parse(paramsKey), page: current.page, revision, attempt });
  const [result, setResult] = useState({ key: null, filterKey: null, items: [], total: 0, totalPages: 1, page: 1, error: '', pending: true });
  const loading = result.key !== requestKey || result.pending;
  const items = result.key === requestKey ? result.items : [];
  const error = result.key === requestKey ? result.error : '';
  const totalPages = result.filterKey === filterKey ? result.totalPages : 1;
  const page = !loading && !error ? result.page : current.page;
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { params, page } = JSON.parse(requestKey);
    setResult(previous => ({ ...previous, key: requestKey, items: [], error: '', pending: true }));
    const timer = setTimeout(async () => {
      try {
        const { data } = await fetchPage({ ...params, page }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.items) || !Number.isInteger(data.totalPages) || data.totalPages < 1 || !Number.isInteger(data.page)) throw new Error('Invalid pagination response');
        setResult({ ...data, key: requestKey, filterKey, error: '', pending: false });
      } catch (err) {
        if (!controller.signal.aborted) setResult(previous => ({ ...previous, key: requestKey, items: [],
          error: err.response?.data?.message || 'Could not load products. Please retry.', pending: false }));
      }
    }, params.search ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [fetchPage, requestKey, filterKey]);

  const goToPage = value => {
    if (loading || !Number.isInteger(value) || value < 1 || value > totalPages) return;
    setNavigation({ key: filterKey, page: value });
  };
  const setError = message => setResult(previous => ({ ...previous, error: message }));
  return { items, loading, error, setError, reload, retry, page, totalPages,
    total: result.filterKey === filterKey ? result.total : 0, goToPage };
}
