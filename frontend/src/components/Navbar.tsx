import { Search, ShoppingBag, User, Box } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { cartCount } = useCart();
  const { isAuthenticated, user } = useAuth();

  const profileHref = isAuthenticated ? '/profile' : '/login';

  return (
    <nav className="flex items-center justify-between px-12 py-6 bg-[#fcfbf8]">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-serif font-bold text-2xl tracking-tighter">
          az<span className="text-orange-500">cloth</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-500">
          <Link to="/" className="text-gray-900 hover:text-orange-500 transition">Kəşf et</Link>
          <Link to="/stores" className="hover:text-orange-500 transition">Mağazalar</Link>
        </div>
        <div className="flex bg-gray-100 rounded-full p-1 text-xs font-medium">
          <button className="px-4 py-1.5 bg-white rounded-full shadow-sm text-gray-900 cursor-pointer">Pərakəndə</button>
          <button className="px-4 py-1.5 text-gray-500 cursor-pointer">Topdan</button>
        </div>
      </div>
      <div className="flex items-center gap-6 text-gray-600">
        <Search size={20} className="cursor-pointer hover:text-gray-900" />
        <Box size={20} className="cursor-pointer hover:text-gray-900" />
        {(!isAuthenticated || user?.role === 'BUYER') && (
          <Link to="/cart" className="relative bg-orange-500 text-white p-2.5 rounded-full cursor-pointer hover:bg-orange-600 shadow-sm shadow-orange-200">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        )}
        <Link to={profileHref} className="relative border border-gray-200 rounded-full p-2.5 cursor-pointer hover:bg-gray-50 flex items-center justify-center w-10 h-10">
          {isAuthenticated && user?.username ? (
            <span className="text-xs font-bold text-gray-900 uppercase">
              {user.username.slice(0, 2)}
            </span>
          ) : (
            <User size={20} />
          )}
        </Link>
      </div>
    </nav>
  );
};
