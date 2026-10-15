const statusCodes = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  STORAGE_UNAVAILABLE: 503,
};

const error = (code, status = statusCodes[code] || 500, message = code) =>
  Object.assign(new Error(message), { code, status, expose: status < 500 });

const respond = (res, err) => {
  const status = Number.isInteger(err?.status) ? err.status : (statusCodes[err?.code] || 500);
  const code = err?.code || (statusCodes[Object.keys(statusCodes).find(key => statusCodes[key] === status)] || 'REQUEST_FAILED');
  if (status >= 500) console.error(err);
  return res.status(status).json({ message: err?.expose || status < 500 ? err.message : 'Request failed.', code });
};

module.exports = { error, respond };
