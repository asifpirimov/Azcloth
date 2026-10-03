import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-redirect SELLER/ADMIN to their panels
  useEffect(() => {
    if (isAuthenticated && user?.role === 'SELLER') {
      navigate('/seller/dashboard', { replace: true });
    } else if (isAuthenticated && user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch Categories
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/categories/`)
      .then(res => res.json())
      .then(data => {
        const arr = data.results || data;
        setCategories(Array.isArray(arr) ? arr : []);
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        setCategories([]);
      });
  }, []);

  // Fetch Products based on filters
  useEffect(() => {
    setLoading(true);
    let url = `${import.meta.env.VITE_API_URL}/api/products/?`;
    if (activeCategory) url += `category=${activeCategory}&`;
    if (searchQuery) url += `search=${searchQuery}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const arr = data.results || data;
        setProducts(Array.isArray(arr) ? arr : []);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect watching searchQuery, 
    // but having a form prevents default reload on enter.
  };

  return (
    <div className="bg-[#fcfbf8] min-h-screen pb-20">
      <SEO fullTitle="AzCloth | Azərbaycanın yerli butikləri" />
      {/* Hero Section */}
      <section className="pt-12 md:pt-20 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-4 md:mb-6">
            Yeni tərzini <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
              kəşf et.
            </span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium mb-8 md:mb-10 max-w-2xl mx-auto">
            Yerli butiklər, eksklüziv kolleksiyalar və hər zövqə uyğun geyimlər bir arada.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-orange-500 transition" size={22} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Məhsul və ya mağaza axtar..."
              className="w-full bg-white border border-gray-200 rounded-full py-4 pl-14 pr-6 text-lg outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition shadow-sm"
            />
          </form>
        </div>
      </section>

      {/* Category Pills */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition ${
              activeCategory === null 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Hamısı
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition ${
                activeCategory === cat.slug
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Məhsullar yüklənir...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Heç nə tapılmadı</h3>
            <p className="text-gray-500 font-medium">Bu axtarışa uyğun məhsul yoxdur.</p>
            {(activeCategory || searchQuery) && (
              <button 
                onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
                className="mt-6 font-bold text-orange-500 hover:underline"
              >
                Filtrləri təmizlə
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
