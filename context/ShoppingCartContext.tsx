import { createContext, useContext, useState, ReactNode } from "react";

interface ShoppingCartContextType {
  cart: string[];
  addToCart: (items: string[]) => void;
  clearCart: () => void;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export function ShoppingCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<string[]>([]);

  const addToCart = (items: string[]) => {
    setCart((prevCart) => [...prevCart, ...items]);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <ShoppingCartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </ShoppingCartContext.Provider>
  );
}

export function useShoppingCart() {
  const context = useContext(ShoppingCartContext);
  if (!context) {
    throw new Error("useShoppingCart must be used within a ShoppingCartProvider");
  }
  return context;
}
