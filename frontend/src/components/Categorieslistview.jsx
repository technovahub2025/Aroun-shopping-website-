import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productApi from "../../api/productApi";
import { Loader2 } from "lucide-react";
import Title from "./Title";

import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const CategoryListView = () => {
  const [groupedCategories, setGroupedCategories] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll();

      let newProducts = res.data;

      if (!Array.isArray(newProducts)) {
        newProducts = newProducts?.products || [];
      }

      setProducts(newProducts);

      const grouped = newProducts.reduce((acc, product) => {
        const categoryName = product.category || "Uncategorized";

        if (!acc[categoryName]) acc[categoryName] = [];

        acc[categoryName].push(product);

        return acc;
      }, {});

      setGroupedCategories(grouped);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="px-4 md:px-10 py-8 max-w-7xl mx-auto">

      <Title text="List of Categories" />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
        </div>
      ) : (
        <div className="space-y-12">

          {Object.entries(groupedCategories).map(([categoryName, products]) => (

            <div key={categoryName}>

              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-5">
                {categoryName}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">

                {products.map((product) => (

                  <Link
                    to={`/products/${product._id}`}
                    key={product._id}
                    className="group rounded-xl overflow-hidden"
                  >

                    <div className="w-full h-32 sm:h-36 bg-gray-100 overflow-hidden flex items-center justify-center">

                      <LazyLoadImage
                        src={
                          (product.images && product.images[0]) ||
                          "/placeholder.jpg"
                        }
                        alt={product.title}
                        effect="blur"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />

                    </div>

                    <div className="p-3 text-center">

                      <h3 className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                        {product.title}
                      </h3>

                    </div>

                  </Link>

                ))}

              </div>

            </div>

          ))}

        </div>
      )}


    </div>
  );
};

export default CategoryListView;


