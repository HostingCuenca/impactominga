import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  raffleId: string;
  raffleTitle: string;
  packageId: string;
  packageName: string;
  quantity: number;
  price: number;
  ticketCount: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (packageId: string) => void;
  updateQuantity: (packageId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  subtotal: number;
  tax: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Load cart from localStorage on mount
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(
        (item) => item.packageId === newItem.packageId && item.raffleId === newItem.raffleId
      );

      if (existingItemIndex > -1) {
        // Item exists, increase quantity
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return updatedItems;
      } else {
        // New item, add with quantity 1
        return [...currentItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  const removeItem = (packageId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.packageId !== packageId));
  };

  const updateQuantity = (packageId: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(packageId);
    } else {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.packageId === packageId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const tax = subtotal * 0.15; // 15% IVA

  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        subtotal,
        tax,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
