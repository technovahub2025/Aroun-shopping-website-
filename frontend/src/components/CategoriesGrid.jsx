import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import productApi from "../../api/productApi";

const gradientPalette = [
  "from-pink-100 via-pink-50 to-white",
  "from-yellow-100 via-orange-50 to-white",
  "from-green-100 via-emerald-50 to-white",
  "from-blue-100 via-sky-50 to-white",
  "from-purple-100 via-violet-50 to-white",
  "from-red-100 via-rose-50 to-white",
];

const CategoriesCarousel = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productApi.getAll();
        const products = res.data;

        // Group products by categories
        const categoryMap = {};
        products.forEach((p) => {
          if (Array.isArray(p.categories)) {
            p.categories.forEach((cat) => {
              if (!categoryMap[cat]) {
                categoryMap[cat] = {
                  name: cat,
                  image: p.images?.[0] || "/placeholder.png",
                  items: [],
                };
              }
              categoryMap[cat].items.push(p.title || p.name);
            });
          }
        });

        const categoryList = Object.values(categoryMap);
        setCategories(categoryList);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleViewMore = (catName) => {
    navigate(`/product?category=${encodeURIComponent(catName)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
        Categories
      </h2>

      <Swiper
        spaceBetween={20}
        slidesPerView={2.2}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
        autoplay={{
          delay: 2800,
          disableOnInteraction: false,
        }}
        loop={true}
        modules={[Autoplay]}
      >
        {categories.map((cat, index) => (
          <SwiperSlide key={index}>
            <div
              className={`flex flex-col items-center justify-between h-72 w-full bg-gradient-to-br ${
                gradientPalette[index % gradientPalette.length]
              } rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden text-center cursor-pointer`}
            >
              {/* Category Image */}
              <div className="mt-6 w-28 h-28 rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center border border-gray-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Category Info */}
              <div className="flex flex-col items-center flex-1 mt-4 px-3">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1">
                  {cat.name}
                </h3>
                <ul className="text-gray-600 text-xs md:text-sm mt-1 space-y-0.5 line-clamp-2">
                  {cat.items.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* View More */}
              <button
                onClick={() => handleViewMore(cat.name)}
                className="mb-4 text-green-700 font-semibold text-xs md:text-sm hover:underline"
              >
                View More →
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default CategoriesCarousel;
