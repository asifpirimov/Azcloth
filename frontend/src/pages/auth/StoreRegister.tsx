import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { OtpStep } from '../../components/OtpStep';

const ThemePreview = ({ theme, storeName }: { theme: string, storeName: string }) => {
  const cover = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600";
  const logo = "https://ui-avatars.com/api/?name=" + (storeName || 'Mağaza') + "&background=random";

  return (
    <div className="w-full h-[600px] bg-gray-100 rounded-[2rem] border-[12px] border-gray-900 overflow-hidden relative shadow-2xl hidden lg:block">
      {/* Top browser bar */}
      <div className="h-6 bg-gray-900 w-full flex items-center px-4 gap-1.5 absolute top-0 z-50">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
      </div>
      <div className="pt-6 w-full h-full overflow-y-auto overflow-x-hidden bg-white no-scrollbar pointer-events-none select-none">
        
        {theme === 'modern' && (
          <div className="bg-gray-50 min-h-full pb-10">
            <div className="h-40 w-full relative">
              <img src={cover} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="px-6 -mt-16 relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
                <img src={logo} className="w-20 h-20 rounded-xl shadow-lg border-4 border-white bg-white object-cover -mt-12 mb-3" />
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{storeName}</h1>
                <p className="text-xs text-gray-500 mt-2">Dəbdəbəli və müasir stil</p>
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-24 bg-gray-100 rounded-xl"></div>
                  <div className="h-8 w-24 bg-pink-50 rounded-xl"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl aspect-[3/4] shadow-sm overflow-hidden">
                    <div className="w-full h-[70%] bg-gray-200"></div>
                    <div className="p-3"><div className="h-3 w-2/3 bg-gray-200 rounded"></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {theme === 'minimal' && (
          <div className="bg-white min-h-full px-6 py-10">
            <div className="flex flex-col items-center">
              <img src={logo} className="w-16 h-16 rounded-full object-cover mb-6 border border-gray-200 p-1" />
              <h1 className="text-3xl font-light tracking-widest uppercase mb-6 text-center text-gray-900">{storeName}</h1>
              <div className="w-full aspect-video overflow-hidden mb-8 rounded-sm">
                <img src={cover} className="w-full h-full object-cover grayscale" />
              </div>
              <div className="flex gap-6 border-t border-gray-100 pt-6 w-full justify-center">
                <div className="h-3 w-16 bg-gray-200"></div>
                <div className="h-3 w-16 bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                {[1,2].map(i => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {theme === 'boutique' && (
          <div className="bg-[#FAF7F2] min-h-full font-serif text-center pb-10">
            <div className="relative h-64 w-full">
              <img src={cover} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#FAF7F2]/40 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <div className="bg-white/80 p-4 rounded-full shadow-xl mb-4">
                  <img src={logo} className="w-16 h-16 rounded-full object-cover" />
                </div>
                <h1 className="text-4xl text-rose-950 drop-shadow-sm">{storeName}</h1>
              </div>
            </div>
            <div className="px-6 py-8">
              <p className="text-rose-950/70 italic text-sm mb-6">"Xüsusi kolleksiya"</p>
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white aspect-[3/4] rounded-t-full shadow-sm border border-rose-100"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {theme === 'classic' && (
          <div className="bg-[#f4f4f4] min-h-full">
            <div className="bg-[#1a202c] text-white p-8 relative flex flex-col items-center">
              <div className="absolute inset-0 opacity-30">
                <img src={cover} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a202c] to-transparent"></div>
              </div>
              <div className="relative z-10 text-center flex flex-col items-center pt-4">
                <img src={logo} className="w-20 h-20 rounded-lg border-4 border-[#1a202c] shadow-lg bg-white mb-4 object-cover" />
                <h1 className="text-3xl font-bold font-serif tracking-wide">{storeName}</h1>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-24 bg-white/20 rounded border border-white/20"></div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="h-5 w-40 bg-gray-200 rounded mb-6 border-l-4 border-[#1a202c]"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[1,2].map(i => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const StoreRegister = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [storeName, setStoreName] = useState('');
  
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    whatsapp_number: '',
    instagram_url: '',
    theme: 'modern',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }

    // Verify token validity
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/store-token-verify/?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setValid(true);
          setStoreName(data.store_name);
        } else {
          setError(data.error);
        }
      })
      .catch(() => setError('Serverlə əlaqə yaradıla bilmədi.'))
      .finally(() => setValidating(false));
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/store-register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          token
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Handle DRF validation errors (which are objects)
        if (typeof data === 'object' && !data.error) {
          const firstKey = Object.keys(data)[0];
          throw new Error(`${firstKey}: ${data[firstKey][0]}`);
        }
        throw new Error(data.error || 'Qeydiyyat zamanı xəta baş verdi.');
      }

      setStep('otp');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'OTP xətası.');
      }

      login(data);
      navigate('/seller/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf8]">
        <p className="text-gray-500 font-medium">Link yoxlanılır...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf8] px-4">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center shadow-sm">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-4">Etibarsız Link</h1>
          <p className="text-gray-600 mb-8">
            {error || 'Bu dəvət linki etibarsızdır və ya artıq istifadə edilib.'}
          </p>
          <Link to="/" className="text-orange-500 font-bold hover:underline">
            Ana səhifəyə qayıt
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <OtpStep
        email={formData.email}
        error={error}
        setError={setError}
        loading={loading}
        otp={otp}
        setOtp={setOtp}
        onSubmit={handleOtpSubmit}
        apiBase={import.meta.env.VITE_API_URL}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf8] px-4 py-12 flex justify-center items-center">
      <div className="max-w-6xl w-full flex gap-12 items-center">
        
        {/* Left Side: Form */}
        <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-xl w-full shadow-xl flex-1">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store size={32} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Mağaza Qeydiyyatı</h1>
            <p className="text-gray-600">
              Siz <strong className="text-gray-900">{storeName}</strong> mağazası üçün dəvət edilmisiniz.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">İstifadəçi adı</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  placeholder="zara_baku"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Şifrə</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">E-poçt ünvanı</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                placeholder="shop@example.com"
                required
              />
            </div>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-bold uppercase tracking-wider text-xs">Mağaza Dizaynı</span>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'modern', name: 'Modern', desc: 'Canlı və müasir', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { id: 'minimal', name: 'Minimal', desc: 'Sadə və təmiz', color: 'bg-gray-50 border-gray-200 text-gray-700' },
                  { id: 'boutique', name: 'Boutique', desc: 'Zərif və lüks', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                  { id: 'classic', name: 'Classic', desc: 'Ənənəvi stil', color: 'bg-amber-50 border-amber-200 text-amber-700' }
                ].map(theme => (
                  <div 
                    key={theme.id}
                    onClick={() => setFormData({...formData, theme: theme.id})}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition text-left relative ${
                      formData.theme === theme.id 
                        ? `border-orange-500 shadow-md ring-2 ring-orange-500/20 bg-orange-50/30`
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {formData.theme === theme.id && (
                      <div className="absolute top-3 right-3 text-orange-500">
                        <CheckCircle size={18} fill="currentColor" className="text-white" />
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-lg mb-3 ${theme.color} border flex items-center justify-center font-bold text-xs uppercase`}>
                      {theme.id.slice(0, 1)}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{theme.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{theme.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center flex items-center justify-center gap-1">
                <Eye size={14}/> Seçdiyiniz şablonun ilkin görünüşü sağda göstərilir.
              </p>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-bold uppercase tracking-wider text-xs">Əlaqə Məlumatları</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">WhatsApp</label>
                <input
                  type="text"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  placeholder="+994501234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Instagram</label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  placeholder="Link"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl mt-6 hover:bg-orange-600 transition shadow-sm shadow-orange-200 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? 'Yüklənir...' : (
                <>Mağazanı Yarat <Store size={22} /></>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Live Preview */}
        <div className="flex-1 hidden lg:flex flex-col items-center sticky top-12">
          <div className="mb-4 text-center">
            <span className="bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 inline-block">Canlı Baxış</span>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Seçilmiş Şablon</h2>
          </div>
          <ThemePreview theme={formData.theme} storeName={storeName} />
        </div>
        
      </div>
    </div>
  );
};
