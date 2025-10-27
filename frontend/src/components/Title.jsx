import React from "react";

const Title = ({ text }) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent inline-block">
        {text}
      </h1>
      <div className="mt-2 w-16 h-1 bg-gradient-to-r from-green-600 to-lime-500 mx-auto rounded-full"></div>
    </div>
  );
};

export default Title;