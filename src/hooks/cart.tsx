import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketplace:products');

      if (response) {
        setProducts(JSON.parse(response));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const modifiedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(modifiedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(modifiedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const existingProduct = products.find(item => item.id === product.id);
      if (existingProduct) {
        increment(product.id);
      } else {
        const newProduct = {
          ...product,
          quantity: 1,
        };

        const newProducts = [...products, newProduct];
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );

        setProducts(newProducts);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const modifiedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      setProducts(modifiedProducts.filter(product => product.quantity !== 0));

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(modifiedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
