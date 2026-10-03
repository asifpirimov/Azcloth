import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfbf8] px-4">
      <SEO title="Səhifə Tapılmadı" noindex={true} />
      <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center shadow-sm">
        <h1 className="font-serif text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">
          Axtardığınız səhifə tapılmadı.
        </p>
        <Link to="/" className="inline-block bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition shadow-sm">
          Ana Səhifəyə Qayıt
        </Link>
      </div>
    </div>
  );
};
