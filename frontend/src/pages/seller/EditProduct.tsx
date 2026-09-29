import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, ImagePlus, X, Save, ArrowLeft } from 'lucide-react';

interface Variant {
  id?: number;
  size: string;
  color: string;
  price: string;
  stock: string;
}

interface ExistingImage {
  id: number;
  image: string;
}

const PREDEFINED_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];
const PREDEFINED_COLORS = ['Qara', 'Ağ', 'Qırmızı', 'Göy', 'Yaşıl', 'Sarı', 'Boz', 'Qəhvəyi', 'Çəhrayı', 'Bənövşəyi', 'Narıncı', 'Bej', 'Çoxrəngli'];

export const EditProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [newMainImage, setNewMainImage] = useState<File | null>(null);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [customColorMode, setCustomColorMode] = useState<Record<number, boolean>>({});

  // Images
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('azcloth_token');

    // Fetch categories
    fetch(`${import.meta.env.VITE_API_URL}/api/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    // Fetch product detail
    fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setName(data.name);
        setDescription(data.description || '');
        setCategoryId(data.category?.id?.toString() || '');
        setStatus(data.status || 'PUBLISHED');
        setMainImage(data.main_image);
        setVariants(
          (data.variants || []).map((v: any) => ({
            id: v.id,
            size: v.size || '',
            color: v.color || '',
            price: v.price?.toString() || '0',
            stock: v.stock?.toString() || '0',
          }))
        );
        setExistingImages(data.images || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Məhsul yüklənərkən xəta baş verdi.');
        setLoading(false);
      });
  }, [user, navigate, id]);

  // Variant handlers
  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', price: '0', stock: '0' }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Image handlers
  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDelete = (imgId: number) => {
    setDeleteImageIds(prev => [...prev, imgId]);
    setExistingImages(prev => prev.filter(img => img.id !== imgId));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMainImage(e.target.files[0]);
      setMainImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('azcloth_token');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('status', status);
    if (categoryId) formData.append('category_id', categoryId);
    if (newMainImage) formData.append('main_image', newMainImage);

    // Variants as JSON
    formData.append('variants', JSON.stringify(variants.map(v => ({
      id: v.id || undefined,
      size: v.size,
      color: v.color,
      price: v.price,
      stock: v.stock,
    }))));

    // Images to delete
    if (deleteImageIds.length > 0) {
      formData.append('delete_images', JSON.stringify(deleteImageIds));
    }

    // New images
    for (const img of newImages) {
      formData.append('new_images', img);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/${id}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data));
      }

      const data = await res.json();
      // Update state with response
      setVariants(
        (data.variants || []).map((v: any) => ({
          id: v.id,
          size: v.size || '',
          color: v.color || '',
          price: v.price?.toString() || '0',
          stock: v.stock?.toString() || '0',
        }))
      );
      setExistingImages(data.images || []);
      setNewImages([]);
      setNewImagePreviews([]);
      setDeleteImageIds([]);
      setSuccess('Məhsul uğurla yeniləndi!');
    } catch (err: any) {
      setError(err.message || 'Yeniləmə zamanı xəta baş verdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(status === 'PUBLISHED' ? "Məhsulu deaktiv etmək istədiyinizə əminsiniz? Məhsul mağazanızda görünməyəcək." : "Məhsulu yenidən aktiv etmək istədiyinizə əminsiniz?")) {
      return;
    }
    setSaving(true);
    const token = localStorage.getItem('azcloth_token');
    const newStatus = status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    
    const formData = new FormData();
    formData.append('status', newStatus);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/${id}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setStatus(newStatus);
        setSuccess(`Məhsul ${newStatus === 'PUBLISHED' ? 'aktiv' : 'deaktiv'} edildi.`);
      } else {
        throw new Error('Xəta baş verdi');
      }
    } catch (err) {
      setError('Məhsul statusunu dəyişmək mümkün olmadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu məhsulu birdəfəlik silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.")) {
      return;
    }
    
    setSaving(true);
    const token = localStorage.getItem('azcloth_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/products/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/seller/dashboard');
      } else {
        throw new Error('Xəta baş verdi');
      }
    } catch (err) {
      setError('Məhsulu silmək mümkün olmadı.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#fcfbf8] items-center justify-center">
        <p className="text-gray-500 font-medium">Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fcfbf8]">
      {/* Sidebar */}
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
      <div className="flex-1 p-10 max-w-5xl">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Məhsulu Redaktə Et</h1>
        <p className="text-gray-500 mb-8">Məhsulun bütün detallarını buradan dəyişə bilərsiniz.</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">✓ {success}</div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          {/* Basic Info */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-6">Əsas Məlumatlar</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Məhsulun adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Kateqoriya</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                >
                  <option value="">Seçin...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
                >
                  <option value="DRAFT">Qaralama</option>
                  <option value="PUBLISHED">Dərc edilib (Public)</option>
                  <option value="HIDDEN">Gizlədilib (Hidden)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Açıqlama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-6">Əsas Şəkil</h2>
            <div className="flex items-start gap-6">
              {mainImage && (
                <img src={mainImage} alt="Main" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Yeni əsas şəkil seç</label>
                <input type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" />
              </div>
            </div>
          </div>

          {/* Additional Images */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900">Əlavə Şəkillər</h2>
              <label className="flex items-center gap-2 text-sm font-bold text-orange-500 cursor-pointer hover:text-orange-600 transition">
                <ImagePlus size={18} /> Şəkil əlavə et
                <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.image} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => markImageForDelete(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {newImagePreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img src={preview} alt="" className="w-full aspect-square object-cover rounded-xl border-2 border-dashed border-orange-300" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={14} />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">Yeni</span>
                </div>
              ))}
            </div>
            {existingImages.length === 0 && newImagePreviews.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">Hələ əlavə şəkil yoxdur.</p>
            )}
          </div>

          {/* Variants */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900">Variantlar (Ölçü / Rəng / Qiymət / Stok)</h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition"
              >
                <Plus size={18} /> Yeni Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Heç bir variant yoxdur. Ən azı bir variant əlavə edin.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                  <span>Bədən Ölçüsü</span>
                  <span>Rəng</span>
                  <span>Qiymət (₼)</span>
                  <span>Stok</span>
                  <span className="w-10"></span>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    <select
                      value={PREDEFINED_SIZES.includes(variant.size) ? variant.size : (variant.size ? 'custom' : '')}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition text-sm"
                    >
                      <option value="">Ölçü seçin...</option>
                      {PREDEFINED_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      {!PREDEFINED_SIZES.includes(variant.size) && variant.size && <option value={variant.size}>{variant.size}</option>}
                    </select>

                    {customColorMode[index] ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => updateVariant(index, 'color', e.target.value)}
                          placeholder="Rəng yazın..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition text-sm pr-8"
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={() => setCustomColorMode(prev => ({...prev, [index]: false}))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={PREDEFINED_COLORS.includes(variant.color) ? variant.color : (variant.color ? variant.color : '')}
                        onChange={(e) => {
                          if (e.target.value === 'custom_add') {
                            setCustomColorMode(prev => ({...prev, [index]: true}));
                            updateVariant(index, 'color', '');
                          } else {
                            updateVariant(index, 'color', e.target.value);
                          }
                        }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition text-sm"
                      >
                        <option value="">Rəng seçin...</option>
                        {PREDEFINED_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                        {!PREDEFINED_COLORS.includes(variant.color) && variant.color && <option value={variant.color}>{variant.color}</option>}
                        <option value="custom_add" className="font-bold text-orange-500">+ Yeni Rəng Yaz...</option>
                      </select>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition text-sm"
                    />
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end border-b border-gray-100 pb-10">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-orange-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-orange-600 transition shadow-sm shadow-orange-200 disabled:opacity-70"
            >
              <Save size={20} />
              {saving ? 'Saxlanılır...' : 'Dəyişiklikləri Saxla'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Təhlükəli Əməliyyatlar</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-yellow-50 border border-yellow-100 rounded-3xl p-8 flex flex-col items-start justify-between">
              <div className="mb-6">
                <h3 className="text-yellow-800 font-bold text-lg mb-1">Məhsulu Deaktiv/Aktiv Et</h3>
                <p className="text-yellow-700/80 text-sm">
                  {status === 'PUBLISHED' 
                    ? 'Bu əməliyyat məhsulunuzu platformadan müvəqqəti gizlədəcək, amma silməyəcək.'
                    : 'Bu əməliyyat məhsulunuzu yenidən platformada görünür edəcək.'}
                </p>
              </div>
              <button 
                type="button"
                onClick={handleDeactivate}
                disabled={saving}
                className="bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-yellow-600 transition disabled:opacity-70"
              >
                {status === 'PUBLISHED' ? 'Məhsulu Deaktiv Et' : 'Məhsulu Aktivləşdir'}
              </button>
            </div>

            <div className="flex-1 bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-start justify-between">
              <div className="mb-6">
                <h3 className="text-red-800 font-bold text-lg mb-1">Məhsulu Sil</h3>
                <p className="text-red-600/80 text-sm">Bu əməliyyat məhsulunuzu və bütün bağlı məlumatları verilənlər bazasından tamamilə siləcək.</p>
              </div>
              <button 
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                <Trash2 size={18} /> Birdəfəlik Sil
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
