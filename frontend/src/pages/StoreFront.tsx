import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Link2, Phone, MapPin, Star, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StoreFront = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Report state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportImages, setReportImages] = useState<File[]>([]);
  const [reportImagePreviews, setReportImagePreviews] = useState<string[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    // Fetch store
    fetch(`${import.meta.env.VITE_API_URL}/api/stores/${slug}/`)
      .then(res => res.json())
      .then(data => {
        setStore(data);
        if (data.id) {
          // Fetch store products
          fetch(`${import.meta.env.VITE_API_URL}/api/products/?search=${data.name}`)
            .then(res => res.json())
            .then(pData => setProducts(pData.results || pData))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="p-20 text-center font-bold">Yüklənir...</div>;
  if (!store || !store.id) return <div className="p-20 text-center font-bold text-red-500">Mağaza tapılmadı və ya dayandırılıb.</div>;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const token = localStorage.getItem('azcloth_token');
      const formData = new FormData();
      formData.append('reason', reportReason);
      formData.append('description', reportDesc);
      reportImages.forEach(img => {
        formData.append('images', img);
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stores/${store.id}/report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => setReportModalOpen(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const getImageUrl = (path: string | null, placeholder: string) => {
    if (!path) return placeholder;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const coverImage = getImageUrl(store.cover_image, "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200");
  const logoImage = getImageUrl(store.logo, "https://ui-avatars.com/api/?name=" + store.name + "&background=random");

  // Modern Theme
  const renderModern = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="relative h-64 md:h-80 w-full">
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="max-w-7xl mx-auto px-6 relative -mt-20">
        <div className="bg-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center">
          <img src={logoImage} alt="Logo" className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white bg-white object-cover" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">{store.name}</h1>
            <p className="text-gray-600 max-w-2xl">{store.description || 'Bu mağaza haqqında məlumat daxil edilməyib.'}</p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="flex items-center gap-2 text-gray-700 bg-gray-100 px-4 py-2 rounded-xl font-medium">
              <Star className="text-orange-500" size={18} fill="currentColor" /> {store.avg_rating?.toFixed(1) || 0} Reytinq
            </div>
            {store.instagram_url && (
              <a href={store.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-pink-600 bg-pink-50 hover:bg-pink-100 transition px-4 py-2 rounded-xl font-medium">
                <Link2 size={18} /> Instagram
              </a>
            )}
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-green-600 bg-green-50 hover:bg-green-100 transition px-4 py-2 rounded-xl font-medium">
                <Phone size={18} /> {store.whatsapp_number}
              </a>
            )}
          </div>
        </div>
        
        <div className="mt-12 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Kolleksiya ({products.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </div>
  );

  // Minimal Theme
  const renderMinimal = () => (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/3">
          <div className="aspect-[4/5] overflow-hidden rounded-sm relative">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-1000" />
            <div className="absolute inset-0 border border-black/10"></div>
          </div>
        </div>
        <div className="w-full md:w-2/3 flex flex-col">
          <img src={logoImage} alt="Logo" className="w-20 h-20 rounded-full object-cover mb-6 border border-gray-200 p-1" />
          <h1 className="text-5xl font-light text-gray-900 tracking-widest uppercase mb-6">{store.name}</h1>
          <p className="text-gray-500 font-light text-lg leading-relaxed max-w-2xl mb-10">{store.description || 'Minimalist dizayn və xüsusi kolleksiya.'}</p>
          
          <div className="flex flex-wrap gap-6 text-sm tracking-widest uppercase font-medium">
            <div className="flex items-center gap-2 border-b border-black pb-1">
              <Star size={16} /> {store.avg_rating?.toFixed(1) || 0} Reytinq
            </div>
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-black pb-1 hover:text-gray-500 transition">
                <Phone size={16} /> Əlaqə
              </a>
            )}
            {store.instagram_url && (
              <a href={store.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-black pb-1 hover:text-gray-500 transition">
                <Link2 size={16} /> Instagram
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400">Yeni Kolleksiya</h2>
          <span className="text-sm text-gray-400">{products.length} məhsul</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );

  // Boutique Theme
  const renderBoutique = () => (
    <div className="bg-[#FAF7F2] min-h-screen font-serif">
      <div className="relative h-[50vh] min-h-[400px] w-full">
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#FAF7F2]/40 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="bg-white/80 p-8 rounded-full shadow-2xl backdrop-blur-md mb-6 border border-rose-100">
            <img src={logoImage} alt="Logo" className="w-24 h-24 rounded-full object-cover" />
          </div>
          <h1 className="text-5xl md:text-7xl text-rose-950 mb-4 drop-shadow-sm">{store.name}</h1>
          <div className="flex items-center gap-4 text-rose-900/80 font-medium tracking-widest text-sm uppercase">
            <span>Boutique</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Star size={14} fill="currentColor"/> {store.avg_rating?.toFixed(1) || 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-rose-950/70 text-xl leading-loose italic mb-10">
          "{store.description || 'Bizim hər bir geyimimiz xüsusi diqqət və zövqlə seçilir.'}"
        </p>
        <div className="flex justify-center gap-6">
          {store.whatsapp_number && (
            <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="px-8 py-3 bg-rose-900 text-rose-50 rounded-full hover:bg-rose-950 transition tracking-wider text-sm">
              Bizimlə Əlaqə
            </a>
          )}
          {store.instagram_url && (
            <a href={store.instagram_url} target="_blank" rel="noreferrer" className="px-8 py-3 bg-white border border-rose-200 text-rose-900 rounded-full hover:bg-rose-50 transition tracking-wider text-sm">
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl text-center text-rose-950 mb-12">Eksklüziv Məhsullar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );

  // Classic Theme
  const renderClassic = () => (
    <div className="bg-[#f4f4f4] min-h-screen">
      <div className="bg-[#1a202c] text-white">
        <div className="max-w-7xl mx-auto px-6 h-80 relative flex items-end pb-12">
          <div className="absolute inset-0 opacity-30">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a202c] via-[#1a202c]/50 to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 w-full text-center md:text-left">
            <img src={logoImage} alt="Logo" className="w-32 h-32 rounded-lg border-4 border-[#1a202c] shadow-xl object-cover bg-white" />
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold font-serif mb-2 tracking-wide">{store.name}</h1>
              <p className="text-gray-300 max-w-2xl text-lg">{store.description || 'Keyfiyyət və güvənin ünvanı.'}</p>
            </div>
            <div className="flex flex-row md:flex-col gap-3 mt-6 md:mt-0">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded border border-white/20">
                <Star className="text-yellow-500" size={16} fill="currentColor" /> 
                <span className="font-bold">{store.avg_rating?.toFixed(1) || 0}</span>
              </div>
              {store.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded border border-white/20 hover:bg-white/20 transition">
                  <Phone size={16} /> <span>Əlaqə</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-12 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#1a202c] pl-4">Bütün Məhsullar ({products.length})</h2>
          {store.instagram_url && (
            <a href={store.instagram_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#1a202c] font-medium flex items-center gap-2">
              <Link2 size={18}/> Bizi izləyin
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );

  const renderTheme = () => {
    if (store.theme === 'minimal') return renderMinimal();
    if (store.theme === 'boutique') return renderBoutique();
    if (store.theme === 'classic') return renderClassic();
    return renderModern();
  };

  return (
    <>
      {renderTheme()}

      {user?.role === 'BUYER' && (
        <button
          onClick={() => setReportModalOpen(true)}
          className="fixed bottom-6 right-6 bg-red-50 text-red-500 font-bold px-4 py-3 rounded-2xl shadow-lg border border-red-100 flex items-center gap-2 hover:bg-red-100 transition z-40"
        >
          <AlertTriangle size={18} /> Mağazanı Şikayət Et
        </button>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setReportModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <X size={24} />
            </button>
            
            {reportSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Şikayət Göndərildi</h2>
                <p className="text-gray-500">Təşəkkür edirik. Adminlərimiz qısa zamanda incələyəcək.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Şikayət Et</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  <strong className="text-gray-900">{store.name}</strong> mağazası haqqında şikayətinizi qeyd edin. Adminlərimiz qısa zamanda incələyəcək.
                </p>

                <form onSubmit={handleReportSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Səbəb</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition"
                      required
                    >
                      <option value="">Seçin...</option>
                      <option value="Dələduzluq (Scam)">Dələduzluq (Scam)</option>
                      <option value="Təhqiramiz davranış">Təhqiramiz davranış</option>
                      <option value="Saxta / Replik məhsullar">Saxta / Replik məhsullar</option>
                      <option value="Digər">Digər</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Əlavə Açıqlama</label>
                    <textarea 
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition resize-none"
                      placeholder="Problemi detallı yazın..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Şəkillər / Sübutlar (İstəyə bağlı)</label>
                    <input 
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          setReportImages(prev => [...prev, ...files]);
                          setReportImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                        }
                      }}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                    />
                    
                    {reportImagePreviews.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                        {reportImagePreviews.map((src, idx) => (
                          <div key={idx} className="relative flex-shrink-0">
                            <img src={src} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                            <button 
                              type="button"
                              onClick={() => {
                                setReportImages(prev => prev.filter((_, i) => i !== idx));
                                setReportImagePreviews(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingReport || !reportReason || !reportDesc}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition disabled:opacity-50 mt-2"
                  >
                    {submittingReport ? 'Göndərilir...' : 'Şikayəti Göndər'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
