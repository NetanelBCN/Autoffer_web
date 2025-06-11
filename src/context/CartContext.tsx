import React, { createContext, useContext, useState } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  amount: number;
  supplier: string;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "amount">, amount: number) => void;
  getTotalCount: () => number;
  clearCart: () => void;
  removeItem: (id: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, "amount">, amount: number) => {
    setCart(prev =>
      {
        const existing = prev.find(ci => ci.id === item.id);
        if (existing) {
          return prev.map(ci =>
            ci.id === item.id ? { ...ci, amount: ci.amount + amount } : ci
          );
        }
        return [...prev, { ...item, amount }];
      }
    );
  };

  const getTotalCount = () => cart.reduce((sum, i) => sum + i.amount, 0);

  const clearCart = () => setCart([]);

  const removeItem = (id: number) =>
    setCart(prev => prev.filter(i => i.id !== id));

  return (
    <CartContext.Provider value={{ cart, addToCart, getTotalCount, clearCart, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};