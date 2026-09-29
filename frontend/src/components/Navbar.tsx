import { Search, ShoppingBag, User, Box, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { cartCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileHref = isAuthenticated ? '/profile' : '/login';

  return (
    <>
      <nav className="flex items-center justify-between px-4 md:px-12 py-4 md:py-6 bg-[#fcfbf8] sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            className="md:hidden text-gray-900" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="font-serif font-bold text-xl md:text-2xl tracking-tighter">
            az<span className="text-orange-500">cloth</span>
          </Link>
          
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
            <Link to="/" className="text-gray-900 hover:text-orange-500 transition">Kəşf et</Link>
            <Link to="/stores" className="hover:text-orange-500 transition">Mağazalar</Link>
          </div>
          
          <div className="hidden lg:flex bg-gray-100 rounded-full p-1 text-xs font-medium">
            <button className="px-4 py-1.5 bg-white rounded-full shadow-sm text-gray-900 cursor-pointer">Pərakəndə</button>
            <button className="px-4 py-1.5 text-gray-500 cursor-pointer">Topdan</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 text-gray-600">
          <Search size={20} className="cursor-pointer hover:text-gray-900 hidden sm:block" />
          <Box size={20} className="cursor-pointer hover:text-gray-900 hidden sm:block" />
          
          {(!isAuthenticated || user?.role === 'BUYER') && (
            <Link to="/cart" className="relative bg-orange-500 text-white p-2 md:p-2.5 rounded-full cursor-pointer hover:bg-orange-600 shadow-sm shadow-orange-200">
              <ShoppingBag size={18} className="md:w-5 md:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          
          <Link to={profileHref} className="relative border border-gray-200 rounded-full p-2 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 cursor-pointer hover:bg-gray-50">
            {isAuthenticated && user?.username ? (
              <span className="text-[10px] md:text-xs font-bold text-gray-900 uppercase">
                {user.username.slice(0, 2)}
              </span>
            ) : (
              <User size={18} className="md:w-5 md:h-5" />
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-white z-40 p-6 flex flex-col gap-6 border-t border-gray-100">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
            Kəşf et
          </Link>
          <Link to="/stores" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
            Mağazalar
          </Link>
          
          <div className="flex bg-gray-100 rounded-xl p-1 mt-4 text-sm font-medium">
            <button className="flex-1 py-3 bg-white rounded-xl shadow-sm text-gray-900">Pərakəndə</button>
            <button className="flex-1 py-3 text-gray-500">Topdan</button>
          </div>
          
          <div className="mt-auto pb-8 flex gap-4">
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex-1 bg-orange-500 text-white py-4 rounded-full font-bold flex justify-center items-center gap-2">
              <ShoppingBag size={20} /> Səbət
            </Link>
            <Link to={profileHref} onClick={() => setMobileMenuOpen(false)} className="flex-1 bg-gray-900 text-white py-4 rounded-full font-bold flex justify-center items-center gap-2">
              <User size={20} /> Profil
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

