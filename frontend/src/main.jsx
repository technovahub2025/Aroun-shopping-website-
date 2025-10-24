
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'
 import { ToastContainer} from 'react-toastify';
 import { Provider } from "react-redux";
import { store } from "./app/store.js";

createRoot(document.getElementById('root')).render(
<Provider store={store}>
    <App />
     <ToastContainer />
   </Provider>
)
