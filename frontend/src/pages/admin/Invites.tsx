import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Copy, Plus, Store } from 'lucide-react';

export const Invites = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [invites, setInvites] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    fetchInvites();
  }, [isAuthenticated, user, navigate]);

  const fetchInvites = async () => {
    const token = localStorage.getItem('azcloth_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/invites/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInvites(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    setLoading(true);
    setError('');
    const token = localStorage.getItem('azcloth_token');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/invites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ store_name: storeName })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dəvət yaradılarkən xəta baş verdi.');
      }

      setStoreName('');
      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/store-register?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Link kopyalandı!');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-10">
        <Store size={32} className="text-orange-500" />
        <h1 className="font-serif text-3xl font-bold text-gray-900">Mağaza Dəvətləri</h1>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-10">
        <h2 className="font-bold text-gray-900 mb-6">Yeni Dəvət Yarat</h2>
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateInvite} className="flex gap-4">
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Mağazanın adı (məs. ZARA Baku)"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-70"
          >
            <Plus size={20} />
            {loading ? 'Yaradılır...' : 'Dəvət Yarat'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-6">Aktiv Dəvətlər</h2>
        
        {invites.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Hələ heç bir aktiv dəvət yoxdur.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {invites.map((invite, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">{invite.store_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Yaradılıb: {new Date(invite.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleCopyLink(invite.token)}
                  className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg transition"
                >
                  <Copy size={16} /> Linki Kopyala
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
