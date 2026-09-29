import React from 'react';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../context/CartContext';
import { Trash2, ShoppingCart, Store as StoreIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export const Cart = () => {
  usePageTitle('Səbət');
  const { items, removeFromCart, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-12 text-center bg-white mt-12 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-center mb-6 text-gray-300">
          <ShoppingCart size={64} />
        </div>
        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4">Səbətiniz boşdur</h2>
        <p className="text-gray-500 mb-8">Hələ heç bir məhsul əlavə etməmisiniz. Yeni geyimlər kəşf etməyə başlayın!</p>
        <Link to="/" className="inline-block bg-orange-500 text-white font-medium px-8 py-3 rounded-full hover:bg-orange-600 transition">
          Alış-verişə Davam Et
        </Link>
      </div>
    );
  }

  // Qruplaşdırma məntiqi (Mağazalara görə)
  const groupedByStore = items.reduce((acc: any, item: CartItem) => {
    const storeId = item.product.store.id;
    if (!acc[storeId]) {
      acc[storeId] = {
        store: item.product.store,
        items: []
      };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  const generateWhatsAppLink = (storeGroup: any) => {
    const { store, items } = storeGroup;
    let message = `Salam, mən AzCloth-dan aşağıdakı məhsulları sifariş etmək istəyirəm:\n\n`;
    
    let total = 0;
    items.forEach((item: CartItem, index: number) => {
      const price = parseFloat(item.variant.price) * item.quantity;
      total += price;
      message += `${index + 1}. *${item.product.name}*\n   Ölçü: ${item.variant.size} | Say: ${item.quantity} | Qiymət: ${price} ₼\n   Link: ${window.location.origin}/product/${item.product.slug}\n\n`;
    });
    
    message += `Ümumi məbləğ: *${total.toFixed(2)} ₼*\nZəhmət olmasa sifarişi təsdiqləyin.`;
    
    // Nömrəni düzəltmək (+ işarəsini və boşluqları silmək URL üçün)
    const phone = store.whatsapp_number ? store.whatsapp_number.replace(/\D/g, '') : '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-12">
      <h1 className="font-serif text-4xl font-bold text-gray-900 mb-8">Səbətiniz</h1>
      
      <div className="flex flex-col gap-8">
        {Object.values(groupedByStore).map((group: any) => (
          <div key={group.store.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center">
                  <StoreIcon size={16} />
                </span>
                {group.store.name}
              </h2>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase">
                {group.items.length} Məhsul
              </span>
            </div>

            <div className="flex flex-col gap-6 mb-8">
              {group.items.map((item: CartItem) => (
                <div key={`${item.product.id}-${item.variant.id}`} className="flex items-center gap-6">
                  <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={!item.product.main_image ? "https://images.unsplash.com/photo-1594938298598-70f70df95c9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" : item.product.main_image.startsWith('http') ? item.product.main_image : `${import.meta.env.VITE_API_URL}${item.product.main_image}`} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">Ölçü: <span className="font-medium text-gray-900">{item.variant.size}</span></p>
                    <div className="text-orange-500 font-bold">{item.variant.price} ₼ <span className="text-gray-400 text-xs font-normal">x {item.quantity}</span></div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="text-xl font-bold text-gray-900">
                      {(parseFloat(item.variant.price) * item.quantity).toFixed(2)} ₼
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id, item.variant.id)}
                      className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-full transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#fcfbf8] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Mağaza üzrə cəmi</p>
                <p className="font-serif text-3xl font-bold text-gray-900">
                  {group.items.reduce((sum: number, item: CartItem) => sum + (parseFloat(item.variant.price) * item.quantity), 0).toFixed(2)} ₼
                </p>
              </div>
              <a 
                href={generateWhatsAppLink(group)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  group.items.forEach((item: CartItem) => {
                    fetch(`${import.meta.env.VITE_API_URL}/api/products/${item.product.slug}/track_whatsapp/`, { method: 'POST' }).catch(console.error);
                  });
                }}
                className="w-full md:w-auto bg-[#25D366] text-white font-bold py-3.5 px-8 rounded-xl hover:bg-[#20bd5a] transition text-center flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                WhatsApp ilə Sifariş Et
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
