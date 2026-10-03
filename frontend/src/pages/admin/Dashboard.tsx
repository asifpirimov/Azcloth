import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Store, Package, Banknote, Copy, Plus, ShieldAlert, ChevronRight, Ban, CheckCircle } from 'lucide-react';
import { SEO } from '../../components/SEO';

export const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Invite state
  const [invites, setInvites] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchDashboard();
    fetchInvites();
  }, [isAuthenticated, user]);

  const fetchDashboard = async () => {
    const token = localStorage.getItem('azcloth_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    const token = localStorage.getItem('azcloth_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/invites/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setInvites(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    setInviteLoading(true);
    setInviteError('');
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
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi.');
      setStoreName('');
      fetchInvites();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/store-register?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Link kopyalandı!');
  };

  if (loading) return <div className="p-20 text-center text-gray-500">Yüklənir...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <SEO title="Admin Paneli" noindex={true} />
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
          <LayoutDashboard size={28} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-gray-500 text-sm">Bütün mağazalar və məhsulların ümumi icmalı</p>
        </div>
        <button
          onClick={() => navigate('/admin/reports')}
          className="ml-auto flex items-center gap-2 bg-red-50 text-red-600 font-bold px-5 py-3 rounded-xl hover:bg-red-100 transition text-sm"
        >
          <ShieldAlert size={18} /> Şikayətlər <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
              <Store size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Mağazalar</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats?.total_stores || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ümumi Məhsullar</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats?.total_products || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Banknote size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ümumi Dəyər</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats?.total_value?.toFixed(2) || '0.00'} <span className="text-lg">₼</span></p>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-10 overflow-hidden">
        <div className="p-8 pb-0">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">Mağazalar</h2>
        </div>
        {stats?.stores?.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Hələ heç bir aktiv mağaza yoxdur.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4">Mağaza</th>
                <th className="px-6 py-4">Sahib</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Məhsul Sayı</th>
                <th className="px-6 py-4 text-right">Ümumi Dəyər</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.stores?.map((store: any) => (
                <tr key={store.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-5">
                    <span className="font-bold text-gray-900">{store.name}</span>
                    <span className="text-xs text-gray-400 ml-2">/{store.slug}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600">{store.owner}</td>
                  <td className="px-6 py-5">
                    {store.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle size={12} /> Aktiv
                      </span>
                    ) : store.status === 'SUSPENDED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <Ban size={12} /> Dondurulub
                      </span>
                    ) : store.status === 'INVITED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                        Dəvət edilib
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        Qeydiyyatdan keçib
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-gray-900">{store.product_count}</td>
                  <td className="px-6 py-5 text-right font-bold text-gray-900">{store.total_value.toFixed(2)} ₼</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
            <Store size={20} />
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-900">Mağaza Dəvəti Yarat</h2>
        </div>

        {inviteError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{inviteError}</div>
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
            disabled={inviteLoading}
            className="flex items-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-70"
          >
            <Plus size={20} />
            {inviteLoading ? 'Yaradılır...' : 'Dəvət Yarat'}
          </button>
        </form>
      </div>

      {/* Active Invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-6">Aktiv Dəvətlər</h2>
          <div className="flex flex-col gap-3">
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
        </div>
      )}
    </div>
  );
};
