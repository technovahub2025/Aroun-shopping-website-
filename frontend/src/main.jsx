
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Provider } from "react-redux";
import { store } from "./app/store.js";

createRoot(document.getElementById('root')).render(
<Provider store={store}>
    <App />
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{
        "--toastify-toast-width": "calc(100% - 32px)",
        "--toastify-toast-min-height": "64px",
        "--toastify-toast-max-height": "800px",
      }}
      className="!max-w-[90vw] !w-full sm:!max-w-md"
    />
   </Provider>
)
