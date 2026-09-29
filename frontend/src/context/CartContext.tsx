import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  product: any; // The full product object
  variant: any; // The selected variant object (size/color/price)
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, variant: any, quantity: number) => void;
  removeFromCart: (productId: number, variantId: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('azcloth_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('azcloth_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, variant: any, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.variant.id === variant.id);
      if (existing) {
        return prev.map(i => 
          i.product.id === product.id && i.variant.id === variant.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, variant, quantity }];
    });
  };

  const removeFromCart = (productId: number, variantId: number) => {
    setItems(prev => prev.filter(i => !(i.product.id === productId && i.variant.id === variantId)));
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within CartProvider');
  return context;
};
