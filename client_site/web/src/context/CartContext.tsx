import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

const CART_KEY = 'rr_cart_v1';

export type CartItem = {
  toolId: number;
  quantity: number;
  /** Cached label from catalog when available */
  name?: string;
};

type CartState = {
  items: CartItem[];
  rentalDays: number;
};

const emptyCart = (): CartState => ({ items: [], rentalDays: 1 });

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed.items || !Array.isArray(parsed.items)) return emptyCart();
    return {
      items: parsed.items.filter(
        (i) => i.toolId && i.quantity > 0
      ) as CartItem[],
      rentalDays: Math.max(1, Math.min(30, parsed.rentalDays || 1)),
    };
  } catch {
    return emptyCart();
  }
}

type CartContextType = {
  cart: CartState;
  addTool: (toolId: number, qty?: number, name?: string) => void;
  setQty: (toolId: number, quantity: number) => void;
  removeTool: (toolId: number) => void;
  setRentalDays: (d: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartState>(emptyCart);

  useEffect(() => {
    if (user) {
      setCart(loadCart());
    } else {
      setCart(emptyCart());
    }
  }, [user]);

  const addTool = useCallback(
    (toolId: number, qty = 1, name?: string) => {
      if (!user) return;
      setCart((c) => {
        const next = { ...c, items: [...c.items] };
        const existing = next.items.find((i) => i.toolId === toolId);
        if (existing) {
          existing.quantity += qty;
          if (name) existing.name = name;
        } else next.items.push({ toolId, quantity: qty, name });
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [user]
  );

  const setQty = useCallback(
    (toolId: number, quantity: number) => {
      if (!user) return;
      setCart((c) => {
        let items = c.items
          .map((i) =>
            i.toolId === toolId ? { ...i, quantity: Math.max(0, quantity) } : i
          )
          .filter((i) => i.quantity > 0);
        const next = { ...c, items };
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [user]
  );

  const removeTool = useCallback(
    (toolId: number) => {
      setCart((c) => {
        const next = { ...c, items: c.items.filter((i) => i.toolId !== toolId) };
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setRentalDays = useCallback(
    (d: number) => {
      const rentalDays = Math.max(1, Math.min(30, d));
      setCart((c) => {
        const next = { ...c, rentalDays };
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    const next = emptyCart();
    localStorage.removeItem(CART_KEY);
    setCart(next);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      addTool,
      setQty,
      removeTool,
      setRentalDays,
      clearCart,
    }),
    [cart, addTool, setQty, removeTool, setRentalDays, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
}
