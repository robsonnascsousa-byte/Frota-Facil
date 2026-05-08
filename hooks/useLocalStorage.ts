import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para persistir estado no localStorage
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial caso não exista no storage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Função para ler o valor inicial
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Função para atualizar o valor
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // Permite passar uma função como no useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Erro ao salvar localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Sincronizar ao montar e entre abas
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  // Listener para sincronizar entre abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          console.warn(`Erro ao parsear storage event para key "${key}"`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
