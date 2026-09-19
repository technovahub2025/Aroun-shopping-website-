import React from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import usePagedCatalog from "../hooks/usePagedCatalog";
import productApi from "../../api/productApi";
import CatalogLoadMore from "./CatalogLoadMore";
import Title from "./Title";

const gradientPalette = [
  "from-red-100 via-rose-50 to-white",
  "from-orange-100 via-yellow-50 to-white",
  "from-pink-100 via-pink-50 to-white",
  "from-yellow-100 via-orange-50 to-white",
  "from-purple-100 via-violet-50 to-white",
  "from-red-50 via-orange-50 to-white",
];

const CategoriesCarousel = () => {
  const page = usePagedCatalog(productApi.getCategoryPreviews, { limit: 6 });
  const categories = page.items;
  const navigate = useNavigate();
  const loadNext = swiper => {
    if (swiper.activeIndex >= categories.length - 6 && page.hasMore && !page.error) page.loadMore();
  };

  const handleViewMore = (catName) => {
    navigate(`/product?category=${encodeURIComponent(catName)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
      <Title text="Shop by Categories" />

      <Swiper
        onReachEnd={loadNext}
        onSlideChange={loadNext}
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
        loop={false}
        modules={[Autoplay]}
      >
        {categories.map((cat, index) => (
          <SwiperSlide key={cat.name}>
            <div
              className={`flex flex-col items-center justify-between mb-10 min-h-[270px] md:min-h-[290px] bg-gradient-to-br ${
                gradientPalette[index % gradientPalette.length]
              } rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden text-center cursor-pointer`}
            >
              <div className="mt-6 w-28 h-28 rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center border border-gray-100 p-4">
                <img
                  src={cat.products[0]?.images?.[0] || "/placeholder.png"}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="flex flex-col items-center flex-1 mt-4 px-3">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1">
                  {cat.name}
                </h3>

                <ul className="text-gray-600 text-xs md:text-sm mt-1 space-y-0.5 line-clamp-2">
                  {cat.products.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item.title}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleViewMore(cat.name)}
                className="mb-4 text-red-600 font-semibold text-xs md:text-sm hover:underline"
              >
                View More
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <CatalogLoadMore {...page} shown={categories.length} label="categories" auto={false} />
    </div>
  );
};

export default CategoriesCarousel;

