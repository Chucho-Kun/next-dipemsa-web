import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItem = {
    id: string
    titulo: string
    descripcion: string
    precioant: string
    precio: string
    cantidad: number
    imagen: string
    clave: string
}

type CartStore = {
  items: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product) => {

        console.log(product);

        set((state) => {
          const existing = state.items.find(item => item.id === product.id);
          
          if (existing) {
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? { ...item, cantidad: item.cantidad + 1 }
                  : item
              )
            };
          } else {
            return {
              items: [...state.items, { ...product, cantidad: 1 }]
            };
          }
        });
      },

      removeFromCart: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },

      updateQuantity: (id, cantidad) => {
        if (cantidad < 1) return;
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, cantidad } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0);
      },

      totalPrice: () => {
        return get().items.reduce((sum, item) => {
          const price = parseFloat(item.precio.replace(/[$,]/g, '')) || 0;
          return sum + price * item.cantidad;
        }, 0);
      },
    }),
    {
      name: 'dipemsa-cart', // Guarda en localStorage
    }
  )
);