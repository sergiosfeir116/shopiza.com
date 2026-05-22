'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

type CartItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    effectivePriceCents: number;
    mainImage: {
      imageUrl: string;
      altText: string | null;
    } | null;
  };
};

type CartState = {
  sessionId: string | null;
  expiresAt: string | null;
  itemCount: number;
  subtotalCents: number;
  items: CartItem[];
};

type CartContextValue = {
  cart: CartState;
  isReady: boolean;
  isMutating: boolean;
  sessionId: string | null;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
};

const emptyCart: CartState = {
  sessionId: null,
  expiresAt: null,
  itemCount: 0,
  subtotalCents: 0,
  items: [],
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_SESSION_KEY = "shopizaj_cart_session";

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload;
}

function ensureSessionId() {
  const existing = localStorage.getItem(CART_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_KEY, created);
  return created;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [isReady, setIsReady] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      const currentSessionId = ensureSessionId();
      setSessionId(currentSessionId);

      const response = await fetch(`/api/cart?sessionId=${currentSessionId}`, {
        cache: "no-store",
      });
      const payload = await readJson<{ cart: CartState }>(response);
      setCart(payload.cart);
      setIsReady(true);
    };

    void loadCart();
  }, []);

  const refreshCart = async () => {
    const currentSessionId = ensureSessionId();
    setSessionId(currentSessionId);

    const response = await fetch(`/api/cart?sessionId=${currentSessionId}`, {
      cache: "no-store",
    });
    const payload = await readJson<{ cart: CartState }>(response);
    setCart(payload.cart);
    setIsReady(true);
  };

  const mutate = async (
    request: () => Promise<Response>,
    successMessage?: string,
  ): Promise<boolean> => {
    setIsMutating(true);

    try {
      const response = await request();
      const payload = await readJson<{ cart?: CartState }>(response);
      if (payload.cart) {
        setCart(payload.cart);
      }
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        sessionId,
        isReady,
        isMutating,
        refreshCart,
        addItem: async (productId, quantity = 1) =>
          mutate(
            () =>
              fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: ensureSessionId(),
                  productId,
                  quantity,
                }),
              }),
            "Added to cart.",
          ),
        setQuantity: async (productId, quantity) =>
          mutate(
            () =>
              fetch("/api/cart/quantity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: ensureSessionId(),
                  productId,
                  quantity,
                }),
              }),
            "Cart updated.",
          ),
        clearCart: async () =>
          mutate(
            () =>
              fetch("/api/cart/clear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: ensureSessionId(),
                }),
              }),
            "Cart cleared.",
          ),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
