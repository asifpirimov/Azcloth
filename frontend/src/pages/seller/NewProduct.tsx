import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export const NewProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock: ''
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/login');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAdditionalImages(prev => [...prev, ...files]);
      setAdditionalImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('azcloth_token');
    if (!token) {
      setError('Sessiya müddəti bitib. Yenidən daxil olun.');
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('category_id', formData.category_id);
    payload.append('price', formData.price);
    payload.append('stock', formData.stock);
    if (image) {
      payload.append('main_image', image);
    }
    
    additionalImages.forEach(img => {
      payload.append('additional_images', img);
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data));
      }

      navigate('/seller/dashboard');
    } catch (err: any) {
      setError(err.message || 'Məhsul əlavə edilərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8]">
      {/* Sidebar - simplified for this page */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-6">
        <h2 className="font-serif font-bold text-2xl tracking-tighter mb-10 cursor-pointer" onClick={() => navigate('/seller/dashboard')}>
          az<span className="text-orange-500">cloth</span> <span className="text-xs text-gray-400">Seller</span>
        </h2>
        <nav className="flex-1 flex flex-col gap-2">
          <button onClick={() => navigate('/seller/dashboard')} className="flex items-center gap-3 text-gray-600 font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition w-full text-left">
            <ArrowLeft size={18} /> Geri qayıt
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 max-w-4xl">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Yeni Məhsul Əlavə Et</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Məhsulun adı</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-900 mb-2">Kateqoriya</label>
              <select 
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                required
              >
                <option value="">Seçin...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-900 mb-2">Qiymət (AZN)</label>
              <input 
                type="number" 
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-900 mb-2">Stok (Ədəd)</label>
              <input 
                type="number" 
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-900 mb-2">Şəkil</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-orange-500 transition"
                required
              />
            </div>
            
            {imagePreview && (
              <div className="col-span-2">
                <p className="text-sm font-bold text-gray-900 mb-2">Önizləmə</p>
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Əlavə Şəkillər (İstəyə bağlı)</label>
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-orange-500 transition"
              />
            </div>

            {additionalImagePreviews.length > 0 && (
              <div className="col-span-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-2">
                {additionalImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img src={preview} alt={`Preview ${idx}`} className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Məhsul haqqında</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto self-end bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-orange-600 transition shadow-sm shadow-orange-200 disabled:opacity-70"
          >
            {loading ? 'Yüklənir...' : 'Yadda Saxla və Dərc Et'}
          </button>
        </form>
      </div>
    </div>
  );
};
