import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Settings, Eye, MessageCircle, Star } from 'lucide-react';
import { SEO } from '../../components/SEO';

export const Statistics = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('azcloth_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/statistics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8]">
      <SEO title="Statistika" noindex={true} />
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-6">
        <h2 className="font-serif font-bold text-2xl tracking-tighter mb-10">
          az<span className="text-orange-500">cloth</span> <span className="text-xs text-gray-400">Seller</span>
        </h2>
        
        <nav className="flex-1 flex flex-col gap-2">
          <a href="/seller/dashboard" className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            <Package size={20} /> Məhsullarım
          </a>
          <a href="/seller/statistics" className="flex items-center gap-3 bg-orange-50 text-orange-500 font-bold px-4 py-3 rounded-xl transition">
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
          <h1 className="font-serif text-3xl font-bold text-gray-900">Mağaza Statistikası</h1>
        </div>

        {loading ? (
          <div className="text-center p-20 text-gray-500">Yüklənir...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Package size={32} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Aktiv Məhsullar</p>
                <h3 className="font-serif text-3xl font-bold text-gray-900">{stats?.active_products || 0} <span className="text-sm text-gray-400 font-sans">/ {stats?.total_products || 0}</span></h3>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                <Eye size={32} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Ümumi Baxışlar</p>
                <h3 className="font-serif text-3xl font-bold text-gray-900">{stats?.total_views || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                <MessageCircle size={32} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">WhatsApp Sifariş Cəhdləri</p>
                <h3 className="font-serif text-3xl font-bold text-gray-900">{stats?.total_whatsapp_clicks || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                <Star size={32} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Ortalama Reytinq</p>
                <h3 className="font-serif text-3xl font-bold text-gray-900">{stats?.avg_rating || 0} <span className="text-sm text-gray-400 font-sans">({stats?.total_reviews || 0} rəy)</span></h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
