import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, Save, Image as ImageIcon, CheckCircle, AlertTriangle, LogOut, Package, TrendingUp, Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    whatsapp_number: '',
    instagram_url: '',
    theme: 'modern'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/login');
      return;
    }

    fetchStoreData();
  }, [user, navigate]);

  const fetchStoreData = () => {
    const token = localStorage.getItem('azcloth_token');
    fetch(`${import.meta.env.VITE_API_URL}/api/seller/store/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            whatsapp_number: data.whatsapp_number || '',
            instagram_url: data.instagram_url || '',
            theme: data.theme || 'modern'
          });
          setPreviewLogo(data.logo ? (data.logo.startsWith('http') ? data.logo : `${import.meta.env.VITE_API_URL}${data.logo}`) : null);
          setPreviewCover(data.cover_image ? (data.cover_image.startsWith('http') ? data.cover_image : `${import.meta.env.VITE_API_URL}${data.cover_image}`) : null);

        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') {
        setLogoFile(file);
        setPreviewLogo(URL.createObjectURL(file));
      } else {
        setCoverFile(file);
        setPreviewCover(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('whatsapp_number', formData.whatsapp_number);
    data.append('instagram_url', formData.instagram_url);
    data.append('theme', formData.theme);

    if (logoFile) data.append('logo', logoFile);
    if (coverFile) data.append('cover_image', coverFile);

    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/store/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Məlumatlar uğurla yadda saxlanıldı!' });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Xəta baş verdi.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Serverlə əlaqə yaradıla bilmədi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Mağazanızı deaktiv etmək istədiyinizə əminsiniz? Müştərilər artıq mağazanızı görməyəcək.")) {
      return;
    }

    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/store/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'INACTIVE' })
      });

      if (res.ok) {
        alert("Mağaza deaktiv edildi.");
        logout();
        navigate('/');
      }
    } catch (err) {
      alert("Xəta baş verdi.");
    }
  };

  if (loading) return <div className="p-10 text-center">Yüklənir...</div>;

  return (
    <div className="flex min-h-screen bg-[#fcfbf8]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full z-10">
        <h2 className="font-serif font-bold text-2xl tracking-tighter mb-10">
          az<span className="text-orange-500">cloth</span> <span className="text-xs text-gray-400">Seller</span>
        </h2>
        
        <nav className="flex-1 flex flex-col gap-2">
          <a href="/seller/dashboard" className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            <Package size={20} /> Məhsullarım
          </a>
          <a href="/seller/statistics" className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition">
            <TrendingUp size={20} /> Statistika
          </a>
          <a href="/seller/settings" className="flex items-center gap-3 bg-orange-50 text-orange-500 font-bold px-4 py-3 rounded-xl transition">
            <SettingsIcon size={20} /> Tənzimləmələr
          </a>
        </nav>
        
        <div className="mt-auto border-t pt-4">
          <p className="text-sm font-bold text-gray-900 mb-4">{user?.username}</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Çıxış Et
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 ml-64">
        <div className="max-w-4xl">
          <div className="flex justify-between items-center mb-10">
            <h1 className="font-serif text-3xl font-bold text-gray-900">Mağaza Tənzimləmələri</h1>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Logo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center group">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://api.dicebear.com/9.x/initials/svg?seed=" + encodeURIComponent(formData.name || 'Store'); }} />
                    ) : (
                      <Store size={40} className="text-gray-300" />
                    )}
                    <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <ImageIcon size={24} />
                      <span className="text-xs font-bold mt-1">Dəyiş</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                    </label>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mağaza Loqosu</span>
                </div>

                {/* Cover Upload */}
                <div className="flex-1 w-full">
                  <div className="relative w-full h-40 rounded-2xl border-4 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center group">
                    {previewCover ? (
                      <img src={previewCover} alt="Cover" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"; }} />
                    ) : (
                      <span className="text-gray-400 font-medium flex items-center gap-2"><ImageIcon /> Qapaq şəkli yüklə</span >
                    )}
                    <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition gap-2">
                      <ImageIcon size={24} /> <span className="font-bold">Yeni qapaq şəkli seç</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mağaza Adı</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mağaza Şablonu</label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={(e: any) => handleChange(e)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition appearance-none"
                  >
                    <option value="modern">Modern (Canlı və müasir)</option>
                    <option value="minimal">Minimal (Sadə və təmiz)</option>
                    <option value="boutique">Boutique (Zərif və lüks)</option>
                    <option value="classic">Classic (Ənənəvi stil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Açıqlama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition resize-none"
                  placeholder="Mağazanız haqqında məlumat..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">WhatsApp Nömrəsi</label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Instagram Linki</label>
                  <input
                    type="url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-orange-600 transition shadow-sm shadow-orange-200 flex items-center gap-2"
                >
                  {saving ? 'Yadda saxlanılır...' : <><Save size={20} /> Yadda Saxla</>}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-12">
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-red-800 font-bold text-lg mb-1">Mağazanı Deaktiv Et</h3>
                <p className="text-red-600/80 text-sm">Bu əməliyyat mağazanızı və məhsullarınızı platformadan müvəqqəti gizlədəcək.</p>
              </div>
              <button 
                onClick={handleDeactivate}
                className="w-full md:w-auto bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition whitespace-nowrap"
              >
                Deaktiv Et
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
