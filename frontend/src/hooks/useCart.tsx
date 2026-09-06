import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface CartItem {
  id: number
  name: string
  nameRu: string | null
  price: number
  pachkaNarx: number
  manufacturer: string
  dorixona: { id: number; name: string } | null
  soni: number
  tur: 'dona' | 'pachka'
}

interface CartContextType {
  items: CartItem[]
  count: number
  add: (item: CartItem) => void
  remove: (index: number) => void
  updateQty: (index: number, delta: number) => void
  clear: () => void
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  add: () => {},
  remove: () => {},
  updateQty: () => {},
  clear: () => {},
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

function loadCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('savatcha') || '[]')
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('savatcha', JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setOpen] = useState(false)

  const update = useCallback((fn: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = fn(prev)
      saveCart(next)
      return next
    })
  }, [])

  const add = useCallback(
    (item: CartItem) => {
      update((prev) => {
        const existing = prev.find((it) => it.id === item.id)
        if (existing) {
          return prev.map((it) =>
            it.id === item.id ? { ...it, soni: it.soni + 1 } : it
          )
        }
        return [...prev, { ...item, soni: 1 }]
      })
      setOpen(true)
    },
    [update]
  )

  const remove = useCallback(
    (index: number) => update((prev) => prev.filter((_, i) => i !== index)),
    [update]
  )

  const updateQty = useCallback(
    (index: number, delta: number) =>
      update((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, soni: Math.max(1, it.soni + delta) } : it
        )
      ),
    [update]
  )

  const clear = useCallback(() => update(() => []), [update])

  const count = items.reduce((s, it) => s + it.soni, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        add,
        remove,
        updateQty,
        clear,
        isOpen,
        toggle: () => setOpen((v) => !v),
        close: () => setOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
