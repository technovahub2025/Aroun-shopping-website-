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
  const cached = fetchPage.getCached?.({ ...JSON.parse(paramsKey), page: current.page });
  const [result, setResult] = useState({ key: null, filterKey: null, items: [], total: 0, totalPages: 1, page: 1, error: '', pending: true });
  const visible = result.key === requestKey ? result : cached;
  const loading = (result.key !== requestKey || result.pending) && !visible?.items?.length;
  const items = visible?.items || [];
  const error = result.key === requestKey ? result.error : '';
  const totalPages = visible?.totalPages || (result.filterKey === filterKey ? result.totalPages : 1);
  const page = !loading && !error ? (visible?.page || current.page) : current.page;
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { params, page } = JSON.parse(requestKey);
    const snapshot = fetchPage.getCached?.({ ...params, page });
    setResult(previous => ({ ...previous, ...snapshot, key: requestKey, filterKey, items: snapshot?.items || [], error: '', pending: true }));
    const timer = setTimeout(async () => {
      try {
        const { data } = await fetchPage({ ...params, page }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.items) || !Number.isInteger(data.totalPages) || data.totalPages < 1 || !Number.isInteger(data.page)) throw new Error('Invalid pagination response');
        setResult({ ...data, key: requestKey, filterKey, error: '', pending: false });
      } catch (err) {
        if (!controller.signal.aborted) setResult(previous => ({ ...previous, key: requestKey,
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
    total: visible?.total || 0, goToPage };
}
