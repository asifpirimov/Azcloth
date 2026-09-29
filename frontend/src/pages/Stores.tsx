import React, { useState, useEffect } from 'react';
import { Store, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Stores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/stores/`)
      .then(res => res.json())
      .then(data => setStores(data.results || data))
      .catch(err => console.error("Error fetching stores:", err))
      .finally(() => setLoading(false));
  }, []);

  const getImageUrl = (path: string | null, placeholder: string) => {
    if (!path) return placeholder;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  return (
    <div className="bg-[#fcfbf8] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bütün Mağazalar
          </h1>
          <p className="text-gray-500 text-lg">
            Platformamızdakı ən yaxşı butikləri və brendləri kəşf edin.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Mağazalar yüklənir...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Mağaza yoxdur</h3>
            <p className="text-gray-500 font-medium">Hələ ki, platformada heç bir aktiv mağaza yoxdur.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map(store => (
              <Link key={store.id} to={`/store/${store.slug}`} className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition duration-300 group flex flex-col">
                <div className="h-48 relative">
                  <img 
                    src={getImageUrl(store.cover_image, "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600")} 
                    alt="Cover" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
                </div>
                <div className="p-6 relative flex-1 flex flex-col">
                  <img 
                    src={getImageUrl(store.logo, "https://ui-avatars.com/api/?name=" + store.name + "&background=random")} 
                    alt="Logo" 
                    className="w-20 h-20 rounded-2xl shadow-lg border-4 border-white absolute -top-10 left-6 bg-white object-cover"
                  />
                  <div className="mt-10 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition">{store.name}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">{store.description || 'Bu mağaza haqqında məlumat daxil edilməyib.'}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                      <Star className="text-orange-500" size={16} fill="currentColor" /> 
                      {store.avg_rating?.toFixed(1) || 0}
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                      {store.product_count || 0} məhsul
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
