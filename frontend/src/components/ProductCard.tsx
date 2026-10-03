import React from 'react';
import { ShoppingBag, Star, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: any;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (path: string | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const imageUrl = getImageUrl(product.main_image);
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert("Səbətə məhsul əlavə etmək üçün zəhmət olmasa daxil olun və ya qeydiyyatdan keçin.");
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'BUYER') {
      alert("Yalnız müştərilər səbətə məhsul əlavə edə bilər.");
      return;
    }
    
    const defaultVariant = product.variants?.[0];
    if (defaultVariant && defaultVariant.stock > 0) {
      addToCart(product, defaultVariant, 1);
      navigate('/cart');
    } else {
      navigate(`/product/${product.slug}`);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block cursor-pointer">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-100">
        <img 
          src={imageUrl} 
          alt={product.name}
          width={600}
          height={800}
          loading={priority ? undefined : "lazy"}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        
        {/* Hover overlay with Add to Cart button */}
        {(!isAuthenticated || user?.role === 'BUYER') && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <button 
              onClick={handleAddToCartClick}
              className="w-full bg-white/90 backdrop-blur-sm text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition transform translate-y-4 group-hover:translate-y-0 duration-300"
            >
              <ShoppingBag size={18} /> Səbətə at
            </button>
          </div>
        )}

        {/* Store badge */}
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.preventDefault()}>
          <Link to={`/store/${product.store?.slug}`} className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1.5 hover:bg-white hover:text-orange-500 transition">
            <Store size={12} className="text-orange-500" />
            {product.store?.name}
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-orange-500 transition">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 font-medium">{product.category?.name}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-gray-900">{product.base_price} ₼</div>
        </div>
      </div>
    </Link>
  );
};
