import React from "react";
import heroImage from "../assets/imglog.avif";

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-r from-green-50 via-white to-red-50 overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply opacity-30 animate-pulse"></div>

      <div className="max-w-7xl   mx-auto px-4 md:px-10 py-20 md:py-32 flex flex-col md:flex-row items-center gap-10 relative z-10">
        
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Discover <span className="text-green-600">Amazing Products</span>
          </h1>
          <p className="text-gray-700 text-lg md:text-xl max-w-md mx-auto md:mx-0">
            Explore a wide range of electronics, fashion, beauty, and home products at the best prices. New arrivals every week!
          </p>

          <div className="flex justify-center md:justify-start gap-4 mt-6">
            <button className="bg-green-500 text-white px-7 py-3 rounded-full font-semibold shadow-lg hover:bg-green-600 transform hover:scale-105 transition">
              Shop Now
            </button>
            <button className="bg-white border border-red-500 text-red-500 px-7 py-3 rounded-full font-semibold shadow hover:bg-red-100 transform hover:scale-105 transition">
              Learn More
            </button>
          </div>

          {/* Optional Badge */}
          <div className="hidden md:flex mt-6 items-center space-x-3">
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
              New Arrival
            </span>
            <span className="text-gray-500">Check out the latest collection!</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="flex-1 relative">
          <div className="relative w-full max-w-lg mx-auto md:mx-0">
            <img
              src={heroImage}
              alt="Hero"
              className="w-full animate-float rounded-xl shadow-2xl"
            />
            {/* Floating effect */}
            <div className="absolute -top-10 -right-10 bg-red-100 rounded-full w-16 h-16 opacity-50 animate-bounce-slow"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
