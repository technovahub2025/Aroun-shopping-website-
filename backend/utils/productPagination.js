exports.parsePage = (page, cursor) => {
  if (page === undefined) return null;
  if (cursor !== undefined || typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page))) {
    throw Object.assign(new Error('Invalid page number'), { status: 400 });
  }
  return Number(page);
};

exports.getProductPage = async (Product, query, sort, limit, requestedPage, projection) => {
  const total = await Product.countDocuments(query).setOptions({ strictQuery: false });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, totalPages);
  let request = Product.find(query).setOptions({ strictQuery: false }).sort(sort).skip((page - 1) * limit).limit(limit);
  if (projection) request = request.select(projection);
  const items = await request.lean();
  return { items, page, total, totalPages, hasMore: page < totalPages };
};
