export const getSessionCache = (key, ttlMs) => {
  try {
    const rawValue = sessionStorage.getItem(key);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue?.timestamp || !("payload" in parsedValue)) {
      sessionStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsedValue.timestamp > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsedValue.payload;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

export const setSessionCache = (key, payload) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        payload,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
};

export const clearSessionCache = (keys) => {
  keys.forEach((key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore cache clear failures.
    }
  });
};
