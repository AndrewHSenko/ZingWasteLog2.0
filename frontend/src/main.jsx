import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap'
import './custom.scss'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>
)
