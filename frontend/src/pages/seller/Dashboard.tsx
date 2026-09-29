import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, Package, TrendingUp, Settings, Shirt } from 'lucide-react';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('azcloth_token');
    
    fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.results && Array.isArray(data.results)) {
          setProducts(data.results);
        } else {
          setProducts([]); // Fallback to empty array if response is an error object
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API error:", err);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-6">
        <h2 className="font-serif font-bold text-2xl tracking-tighter mb-10">
          az<span className="text-orange-500">cloth</span> <span className="text-xs text-gray-400">Seller</span>
        </h2>
        
        <nav className="flex-1 flex flex-col gap-2">
          <a href="/seller/dashboard" className="flex items-center gap-3 bg-orange-50 text-orange-500 font-bold px-4 py-3 rounded-xl transition">
            <Package size={20} /> Məhsullarım
          </a>
          <a href="/seller/statistics" className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            <TrendingUp size={20} /> Statistika
          </a>
          <a href="/seller/settings" className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            <Settings size={20} /> Tənzimləmələr
          </a>
        </nav>
        
        <div className="mt-auto border-t pt-4">
          <p className="text-sm font-bold text-gray-900 mb-4">{user?.username}</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Çıxış Et
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="font-serif text-3xl font-bold text-gray-900">Məhsullarım</h1>
          <div className="flex gap-4">
            {user?.store_slug && (
              <button 
                onClick={() => window.open(`/store/${user.store_slug}`, '_blank')}
                className="bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm flex items-center gap-2"
              >
                <Eye size={18} /> Müştəri gözündən gör
              </button>
            )}
            
            <label className="bg-green-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-600 transition shadow-sm cursor-pointer flex items-center gap-2">
              <Package size={18} /> Excel İlə Yüklə
              <input 
                type="file" 
                accept=".xlsx" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  try {
                    const token = localStorage.getItem('azcloth_token');
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/bulk_import/`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`
                      },
                      body: formData
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      alert(data.message || 'Məhsullar uğurla əlavə edildi.');
                      window.location.reload();
                    } else {
                      alert(data.error || 'Xəta baş verdi.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Fayl göndərilərkən xəta baş verdi.');
                  }
                  
                  // Reset input
                  e.target.value = '';
                }}
              />
            </label>
            
            <button 
              onClick={() => navigate('/seller/products/new')}
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition shadow-sm shadow-orange-200"
            >
              + Yeni Məhsul
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          {loading ? (
            <p className="text-gray-500 text-center py-10">Yüklənir...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 flex justify-center mb-4">
                <Shirt size={48} />
              </div>
              <p className="text-gray-500 font-medium">Hələ heç bir məhsulunuz yoxdur.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-400">
                  <th className="pb-4 font-bold uppercase tracking-wider">Məhsul</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Kateqoriya</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Baza Qiyməti</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-4 text-gray-600">{p.category?.name || '-'}</td>
                    <td className="py-4 font-medium">{p.base_price} ₼</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'PUBLISHED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => navigate(`/seller/products/${p.id}/edit`)} className="text-orange-500 font-bold hover:underline">Düzəliş Et</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
