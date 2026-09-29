import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star, AlertTriangle, X } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  usePageTitle(product ? product.name : 'Məhsul Detalları');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const getImageUrl = (path: string | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1594938298598-70f70df95c9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState('');

  // Report state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'STORE' | 'PRODUCT'>('PRODUCT');
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportImages, setReportImages] = useState<File[]>([]);
  const [reportImagePreviews, setReportImagePreviews] = useState<string[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Auth Prompt state
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products/`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((p: any) => p.slug === slug);
        setProduct(found);
        if (found?.main_image) {
          setCurrentImage(getImageUrl(found.main_image));
        }
        if (found?.variants?.length > 0) {
          setSelectedVariant(found.variants[0]);
        }
        setLoading(false);
        
        // Track view
        fetch(`${import.meta.env.VITE_API_URL}/api/products/${slug}/track_view/`, { method: 'POST' }).catch(console.error);
      })
      .catch(err => {
        console.error("API error:", err);
        setLoading(false);
      });

    // Fetch reviews
    fetch(`${import.meta.env.VITE_API_URL}/api/products/${slug}/reviews/`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error("Reviews API error:", err));

  }, [slug]);

  if (loading) return <div className="p-20 text-center">Yüklənir...</div>;
  if (!product) return <div className="p-20 text-center">Məhsul tapılmadı.</div>;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    if (selectedVariant) {
      addToCart(product, selectedVariant, quantity);
      navigate('/cart');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('azcloth_token');
      const formData = new FormData();
      formData.append('rating', reviewRating.toString());
      formData.append('comment', reviewComment);
      reviewImages.forEach(img => {
        formData.append('images', img);
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${slug}/reviews/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setReviewComment('');
        setReviewRating(5);
        setReviewImages([]);
        setReviewImagePreviews([]);
      } else {
        alert('Rəy əlavə edilərkən xəta baş verdi. Bəlkə artıq rəy yazmısınız?');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Rəyinizi silmək istədiyinizə əminsiniz?')) return;
    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        alert('Rəy silinərkən xəta baş verdi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminReviewAction = async (reviewId: number, action: 'hide' | 'delete') => {
    if (!window.confirm(`Rəyi ${action === 'hide' ? 'gizlətmək' : 'silmək'} istədiyinizə əminsiniz?`)) return;
    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${reviewId}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        alert('Əməliyyat xətası.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReviewSubmit = async (reviewId: number) => {
    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${reviewId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: editReviewRating,
          comment: editReviewComment
        })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews(reviews.map(r => r.id === reviewId ? updatedReview : r));
        setEditingReviewId(null);
      } else {
        alert('Rəy yenilənərkən xəta baş verdi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

      const url = reportType === 'STORE' 
        ? `${import.meta.env.VITE_API_URL}/api/stores/${product.store.id}/report/`
        : `${import.meta.env.VITE_API_URL}/api/products/${slug}/report/`;

      const res = await fetch(url, {
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

  return (
    <div className="max-w-6xl mx-auto py-12 px-12">
      <div className="flex flex-col md:flex-row gap-12 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-12">
        
        {/* Image Gallery */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 rounded-2xl aspect-[4/5] overflow-hidden mb-4 relative group">
            <img 
              src={currentImage || getImageUrl(product.main_image)} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
            />
          </div>
          {/* Thumbnails */}
          {(product.main_image || product.images?.length > 0) && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {product.main_image && (
                <button 
                  onClick={() => setCurrentImage(getImageUrl(product.main_image))}
                  className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition ${currentImage === getImageUrl(product.main_image) ? 'border-orange-500' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={getImageUrl(product.main_image)} className="w-full h-full object-cover" />
                </button>
              )}
              {product.images?.map((img: any) => (
                <button 
                  key={img.id}
                  onClick={() => setCurrentImage(getImageUrl(img.image))}
                  className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition ${currentImage === getImageUrl(img.image) ? 'border-orange-500' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={getImageUrl(img.image)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <Link to={`/store/${product.store?.slug}`} className="text-xs font-bold tracking-widest text-orange-500 uppercase hover:underline">
              {product.store?.name}
            </Link>
            {isAuthenticated && user?.role === 'BUYER' && (
              <div className="flex gap-4">
                <button 
                  onClick={() => { setReportType('PRODUCT'); setReportModalOpen(true); }}
                  className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline"
                >
                  <AlertTriangle size={14} /> Məhsulu Şikayət Et
                </button>
              </div>
            )}
          </div>

          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-orange-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(product.avg_rating || 5) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">({product.review_count || 0} rəy)</span>
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-6">
            {selectedVariant ? selectedVariant.price : product.base_price} ₼
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description || "Mükəmməl kəsimi və yüksək keyfiyyətli parçası ilə hər fəslin imtinaedilməz parçası. Yerli dizaynerlərimiz tərəfindən xüsusi olaraq sizin üçün hazırlanıb."}
          </p>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-3">ÖLÇÜ SEÇİN</h3>
            <div className="flex gap-3">
              {product.variants?.map((v: any) => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl text-sm font-bold transition ${
                    selectedVariant?.id === v.id 
                      ? 'border-orange-500 text-orange-500 bg-orange-50' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className={`text-xs mt-3 font-bold ${selectedVariant.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                {selectedVariant.stock > 0 ? `Anbarda ${selectedVariant.stock} ədəd qalıb` : 'Bu ölçü tükənib (Out of stock)'}
              </p>
            )}
          </div>

          {(!isAuthenticated || user?.role === 'BUYER') && (
            <div className="flex gap-4 mb-6">
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-4 w-32">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="text-gray-500 hover:text-gray-900 w-full text-center font-bold text-lg"
                >-</button>
                <span className="font-bold text-gray-900 w-full text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(selectedVariant?.stock || 1, q + 1))}
                  className="text-gray-500 hover:text-gray-900 w-full text-center font-bold text-lg"
                >+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 bg-gray-900 text-white font-medium py-4 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedVariant || selectedVariant.stock === 0 ? 'Tükənib' : 'Səbətə Əlavə Et'}
              </button>
            </div>
          )}
          
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">Məhsul Rəyləri</h2>
        
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3">
            <h3 className="font-bold text-gray-900 mb-4">Rəy Yazın</h3>
            {!isAuthenticated ? (
              <div className="bg-gray-50 p-6 rounded-2xl text-center">
                <p className="text-gray-600 mb-4">Rəy yazmaq üçün sistemə daxil olmalısınız.</p>
                <button onClick={() => navigate('/login')} className="bg-gray-900 text-white font-bold py-2 px-6 rounded-xl text-sm">Daxil ol</button>
              </div>
            ) : user?.role !== 'BUYER' ? (
              <div className="bg-gray-50 p-6 rounded-2xl text-center">
                <p className="text-gray-600">Yalnız müştərilər rəy yaza bilər.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Qiymətləndirmə</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star size={24} fill={star <= reviewRating ? "#fb923c" : "none"} className={star <= reviewRating ? "text-orange-400" : "text-gray-300"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Şərhiniz</label>
                  <textarea 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 transition resize-none h-24"
                    placeholder="Məhsul haqqında fikirləriniz..."
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Şəkillər (İstəyə bağlı)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setReviewImages(prev => [...prev, ...files]);
                        setReviewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-orange-500 transition text-sm"
                  />
                  {reviewImagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {reviewImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-16 h-16">
                          <img src={preview} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => {
                              setReviewImages(prev => prev.filter((_, i) => i !== idx));
                              setReviewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"
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
                  disabled={submittingReview}
                  className="bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {submittingReview ? 'Göndərilir...' : 'Göndər'}
                </button>
              </form>
            )}
          </div>

          <div className="w-full md:w-2/3 flex flex-col gap-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500">Bu məhsul üçün hələ heç bir rəy yazılmayıb. İlk rəyi siz yazın!</p>
            ) : (
              reviews.map((rev: any) => (
                <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-900">{rev.user.username}</span>
                      <span className="text-gray-400 text-xs ml-3">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {user && user.id === rev.user.id && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingReviewId(rev.id);
                              setEditReviewRating(rev.rating);
                              setEditReviewComment(rev.comment);
                            }}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Redaktə et
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                      {user && user.role === 'ADMIN' && (
                        <div className="flex gap-2 mr-4 border-r pr-4 border-gray-200">
                          <span className="text-xs font-bold text-gray-400">Admin:</span>
                          <button 
                            onClick={() => handleAdminReviewAction(rev.id, 'hide')}
                            className="text-xs text-yellow-500 hover:underline"
                          >
                            Gizlət
                          </button>
                          <button 
                            onClick={() => handleAdminReviewAction(rev.id, 'delete')}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {editingReviewId === rev.id ? (
                    <div className="mt-2 bg-gray-50 p-4 rounded-xl">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            onClick={() => setEditReviewRating(star)}
                            className={star <= editReviewRating ? 'text-orange-400' : 'text-gray-300'}
                          >
                            <Star size={18} fill={star <= editReviewRating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                      <textarea 
                        value={editReviewComment}
                        onChange={(e) => setEditReviewComment(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 resize-none mb-2 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditReviewSubmit(rev.id)}
                          className="bg-orange-500 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-orange-600"
                        >
                          Yadda Saxla
                        </button>
                        <button 
                          onClick={() => setEditingReviewId(null)}
                          className="bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg hover:bg-gray-300"
                        >
                          Ləğv Et
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                  )}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {rev.images.map((img: any) => (
                        <a key={img.id} href={getImageUrl(img.image)} target="_blank" rel="noopener noreferrer">
                          <img src={getImageUrl(img.image)} alt="Review" className="w-20 h-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setReportModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900">Şikayət Et</h2>
            </div>

            {reportSuccess ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl font-medium text-center">
                Şikayətiniz uğurla adminlərə göndərildi. Təşəkkür edirik!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
                <p className="text-gray-600 text-sm mb-2">
                  {reportType === 'STORE' ? (
                    <><strong className="text-gray-900">{product.store?.name}</strong> mağazası haqqında şikayətinizi qeyd edin.</>
                  ) : (
                    <><strong className="text-gray-900">{product.name}</strong> məhsulu haqqında şikayətinizi qeyd edin.</>
                  )} Adminlərimiz qısa zamanda incələyəcək.
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Səbəb</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-red-500"
                    required
                  >
                    <option value="">Seçin...</option>
                    {reportType === 'STORE' ? (
                      <>
                        <option value="fake_store">Saxta mağaza</option>
                        <option value="scam">Dələduzluq / Pulu mənimsəmə</option>
                      </>
                    ) : (
                      <>
                        <option value="fake_product">Saxta / Replik məhsul</option>
                        <option value="wrong_price">Yanlış qiymət</option>
                        <option value="wrong_stock">Yanlış stok məlumatı</option>
                        <option value="spam">Spam</option>
                      </>
                    )}
                    <option value="inappropriate">Uyğunsuz məzmun</option>
                    <option value="other">Digər</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Əlavə Açıqlama</label>
                  <textarea 
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-red-500 resize-none h-24"
                    placeholder="Problemi detallı yazın..."
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Şəkillər / Sübutlar (İstəyə bağlı)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setReportImages(prev => [...prev, ...files]);
                        setReportImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-red-500 transition text-sm"
                  />
                  {reportImagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {reportImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-16 h-16">
                          <img src={preview} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => {
                              setReportImages(prev => prev.filter((_, i) => i !== idx));
                              setReportImagePreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"
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
                  disabled={submittingReport}
                  className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-red-600 transition disabled:opacity-50"
                >
                  {submittingReport ? 'Göndərilir...' : 'Şikayəti Göndər'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {authPromptOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl text-center">
            <button onClick={() => setAuthPromptOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Qeydiyyat tələb olunur</h2>
            <p className="text-gray-600 mb-6">
              Səbətə məhsul əlavə etmək və alış-verişə davam etmək üçün hesabınıza daxil olun və ya qeydiyyatdan keçin.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/login')} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition">
                Daxil Ol
              </button>
              <button onClick={() => navigate('/register')} className="w-full bg-orange-50 text-orange-500 font-bold py-3.5 rounded-xl hover:bg-orange-100 transition">
                Qeydiyyatdan Keç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
