import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { StoreFront } from './pages/StoreFront';
import { Stores } from './pages/Stores';
import { Cart } from './pages/Cart';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/seller/Dashboard';
import { Settings } from './pages/seller/Settings';
import { Statistics } from './pages/seller/Statistics';
import { NewProduct } from './pages/seller/NewProduct';
import { EditProduct } from './pages/seller/EditProduct';
import { Profile } from './pages/Profile';
import { Invites } from './pages/admin/Invites';
import { AdminReports } from './pages/admin/Reports';
import { AdminDashboard } from './pages/admin/Dashboard';
import { StoreRegister } from './pages/auth/StoreRegister';
import { Terms } from './pages/legal/Terms';
import { Privacy } from './pages/legal/Privacy';
import { About } from './pages/legal/About';
import { Contact } from './pages/legal/Contact';
import { SellerTerms } from './pages/legal/SellerTerms';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Real Google Client ID from Google Cloud Console or Env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "667223605716-p86n3mh79lv8spo75l63k6198ebod1qr.apps.googleusercontent.com";

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-[#fcfbf8] font-sans">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/store/:slug" element={<StoreFront />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/store-register" element={<StoreRegister />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/seller-terms" element={<SellerTerms />} />
              <Route path="/seller/dashboard" element={<Dashboard />} />
              <Route path="/seller/settings" element={<Settings />} />
              <Route path="/seller/statistics" element={<Statistics />} />
              <Route path="/seller/products/new" element={<NewProduct />} />
              <Route path="/seller/products/:id/edit" element={<EditProduct />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/invites" element={<Invites />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
