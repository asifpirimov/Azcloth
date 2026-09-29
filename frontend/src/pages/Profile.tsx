import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, LogOut, ChevronRight } from 'lucide-react';

export const Profile = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Pre-fill form with current user data
    const token = localStorage.getItem('azcloth_token');
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
        }));
      });
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setError('Yeni şifrələr üst-üstə düşmür.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('azcloth_token');
    const payload: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
    };
    if (formData.new_password) {
      payload.old_password = formData.old_password;
      payload.new_password = formData.new_password;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Yeniləmə zamanı xəta baş verdi.');
      }

      // Update auth context with new user data
      login({ user: data, access: token!, refresh: '' });
      setSuccess('Məlumatlarınız uğurla yeniləndi!');
      setFormData(prev => ({ ...prev, old_password: '', new_password: '', confirm_password: '' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
          {initials}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{user?.username}</h1>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            user?.role === 'SELLER' ? 'bg-orange-100 text-orange-600' :
            user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {user?.role === 'SELLER' ? 'Satıcı' : user?.role === 'ADMIN' ? 'Admin' : 'Alıcı'}
          </span>
        </div>
        {user?.role === 'SELLER' && (
          <Link
            to="/seller/dashboard"
            className="ml-auto flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition"
          >
            Satıcı Paneli <ChevronRight size={16} />
          </Link>
        )}
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="ml-auto flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition"
          >
            Admin Paneli <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <User size={18} className="text-gray-400" />
            <h2 className="font-bold text-gray-900">Şəxsi məlumatlar</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Ad</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
                placeholder="Adınız"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Soyad</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
                placeholder="Soyadınız"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Mail size={18} className="text-gray-400" />
            <h2 className="font-bold text-gray-900">E-poçt ünvanı</h2>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">E-poçt</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={18} className="text-gray-400" />
            <h2 className="font-bold text-gray-900">Şifrəni yenilə</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mövcud şifrə</label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Yeni şifrə</label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Təkrarla</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 font-medium hover:text-red-500 transition"
          >
            <LogOut size={16} /> Çıxış et
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-70"
          >
            {loading ? 'Yüklənir...' : 'Yadda Saxla'}
          </button>
        </div>
      </form>
    </div>
  );
};
