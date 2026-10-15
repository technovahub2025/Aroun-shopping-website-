const Product = require('../models/productModel');

// The application can support a Drive-backed store in deployments that provide
// it. This checkout currently uses MongoDB, so expose the same interface the
// controllers expect and keep the provider decision in one place.
const provider = () => process.env.STORAGE_PROVIDER || 'mongodb';

const store = {
  async mutate() {
    throw Object.assign(new Error('Direct store mutations are unavailable for MongoDB.'), {
      code: 'STORAGE_UNAVAILABLE', status: 503, expose: true,
    });
  },
};

module.exports = { Products: Product, provider, store };
