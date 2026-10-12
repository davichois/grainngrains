"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import CartDrawer from "./CartDrawer";
import QuickAddDialog from "./QuickAddDialog";
import {
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
  findProduct,
} from "@/src/components/product-showcase/data";
import {
  DEFAULT_GRIND,
  DEFAULT_SIZE,
  type GrindId,
  type SizeId,
} from "@/src/lib/shop";

const priceFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

/** Formatea un monto en soles: "S/ 45.00" */
export const formatPrice = (amount: number) => priceFormatter.format(amount);

export interface CartItem {
  /** Clave única: edición + producto + presentación + molienda */
  key: string;
  /** Edición del producto (i18n: editions.<categoryId>); "combo" para combos */
  categoryId: string;
  /** Producto (i18n: editions.<categoryId>.products.<productId>) o id del combo */
  productId: string;
  image?: string;
  /** Presentación (en combos, la de cada café del combo) */
  size: SizeId;
  grind: GrindId;
  /** Precio unitario en soles (se toma del catálogo en data.ts) */
  price: number;
  qty: number;
}

export type NewCartItem = Omit<CartItem, "key" | "qty">;

/** Producto o combo para el que se abre el selector de opciones */
export type QuickAddTarget =
  | { kind: "product"; categoryId: string; productId: string }
  | { kind: "combo"; comboId: string };

const itemKey = (i: NewCartItem) =>
  [i.categoryId, i.productId, i.size, i.grind].join(".");

/* ───────────────────────────────────────────────────────────────
   Store del carrito persistido en localStorage. Se lee con
   useSyncExternalStore para que el render del servidor (carrito vacío)
   y la hidratación coincidan, y se sincroniza entre pestañas.
─────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "gg-cart";
const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    /* Carritos guardados antes de existir presentación/molienda */
    return parsed.map((i: CartItem) => {
      const item = {
        ...i,
        size: i.size ?? DEFAULT_SIZE,
        grind: i.grind ?? DEFAULT_GRIND,
      };
      return { ...item, key: itemKey(item) };
    });
  } catch {
    return [];
  }
}

function getSnapshot() {
  if (cache === null) cache = readStorage();
  return cache;
}

const getServerSnapshot = () => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setItems(update: (items: CartItem[]) => CartItem[]) {
  cache = update(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* Sin almacenamiento disponible: el carrito vive solo en memoria */
  }
  listeners.forEach((l) => l());
}

/** Precio vigente según data.ts (el guardado es respaldo si ya no existe) */
function currentPrice(item: CartItem) {
  if (item.categoryId === COMBO_CATEGORY) {
    const combo = findCombo(item.productId);
    return combo ? comboDetails(combo).price : item.price;
  }
  return (
    findProduct(item.categoryId, item.productId)?.prices[item.size] ??
    item.price
  );
}

/** Cafés que representa una línea del carrito (un combo trae varios) */
function coffeesIn(item: CartItem) {
  if (item.categoryId !== COMBO_CATEGORY) return 1;
  return findCombo(item.productId)?.items.length ?? 1;
}

interface CartValue {
  items: CartItem[];
  /** Cantidad total de cafés */
  count: number;
  /** Precio total en soles */
  total: number;
  addItem: (item: NewCartItem, qty?: number) => void;
  /** Cambia la cantidad; con 0 o menos elimina el producto */
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  /** Vacía el carrito (tras un pago exitoso) */
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Abre el selector de presentación/molienda antes de agregar */
  openQuickAdd: (target: QuickAddTarget) => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<QuickAddTarget | null>(null);

  const addItem = useCallback((item: NewCartItem, qty = 1) => {
    const key = itemKey(item);
    setItems((prev) =>
      prev.some((i) => i.key === key)
        ? prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { ...item, key, qty }],
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems(() => []), []);

  const value = useMemo<CartValue>(() => {
    /* El precio vigente es el del catálogo; el guardado solo es respaldo
       por si el producto ya no existe en data.ts */
    const priced = items.map((i) => ({ ...i, price: currentPrice(i) }));
    return {
      items: priced,
      count: priced.reduce((sum, i) => sum + i.qty * coffeesIn(i), 0),
      total: priced.reduce((sum, i) => sum + i.qty * i.price, 0),
      addItem,
      setQty,
      removeItem,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      openQuickAdd: setQuickAdd,
    };
  }, [items, isOpen, addItem, setQty, removeItem, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Fuera del <header>: su transform rompería el position: fixed del panel */}
      <CartDrawer />
      <QuickAddDialog target={quickAdd} onClose={() => setQuickAdd(null)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
