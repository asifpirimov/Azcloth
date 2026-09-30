import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/">
            <img src="/logo.svg" alt="AzCloth" className="h-8" />
          </Link>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Azərbaycanın ən sərfəli onlayn geyim mağazaları şəbəkəsi.
          </p>
        </div>
        
        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-widest text-xs">Şirkət</h3>
          <ul className="space-y-3">
            <li><Link to="/about" className="text-sm text-gray-600 hover:text-orange-500 transition">Haqqımızda</Link></li>
            <li><Link to="/contact" className="text-sm text-gray-600 hover:text-orange-500 transition">Əlaqə</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-widest text-xs">Hüquqi</h3>
          <ul className="space-y-3">
            <li><Link to="/terms" className="text-sm text-gray-600 hover:text-orange-500 transition">İstifadə Qaydaları</Link></li>
            <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-orange-500 transition">Məxfilik Siyasəti</Link></li>
            <li><Link to="/seller-terms" className="text-sm text-gray-600 hover:text-orange-500 transition">Satıcı Qaydaları</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-widest text-xs">Satıcılar Üçün</h3>
          <ul className="space-y-3">
            <li><Link to="/store-register" className="text-sm text-gray-600 hover:text-orange-500 transition">Mağaza Yarat</Link></li>
            <li><Link to="/login" className="text-sm text-gray-600 hover:text-orange-500 transition">Satıcı Girişi</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} AzCloth. Bütün hüquqlar qorunur.</p>
        <p className="text-xs text-gray-400">Design with ♥ for Local Boutiques</p>
      </div>
    </footer>
  );
};
