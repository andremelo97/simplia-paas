import { useState, useCallback } from 'react';

interface RepeaterOptions<T> {
  initialItems?: T[];
  generateId?: () => string;
  primaryKey?: keyof T;
  typeKey?: keyof T;
}

export function useRepeater<T extends { id?: string }>({
  initialItems = [],
  generateId = () => `tmp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
  primaryKey = 'is_primary' as keyof T,
  typeKey,
}: RepeaterOptions<T> = {}) {
  const [items, setItems] = useState<T[]>(initialItems);

  const add = useCallback((defaultItem: Partial<T> = {}): void => {
    const newItem = {
      ...defaultItem,
      id: generateId(),
    } as T;

    setItems(prev => [...prev, newItem]);

    // Optional telemetry
    if (window.analytics?.track) {
      window.analytics.track('repeater_add', {
        section: typeKey ? String(newItem[typeKey]) : 'unknown',
        total_items: items.length + 1
      });
    }
  }, [items.length, generateId, typeKey]);

  const remove = useCallback((index: number): void => {
    if (index < 0 || index >= items.length) return;

    const removedItem = items[index];
    setItems(prev => prev.filter((_, i) => i !== index));

    // Optional telemetry
    if (window.analytics?.track) {
      window.analytics.track('repeater_remove', {
        section: typeKey && removedItem ? String(removedItem[typeKey]) : 'unknown',
        index,
        total_items: items.length - 1
      });
    }
  }, [items, typeKey]);

  const update = useCallback((index: number, patch: Partial<T>): void => {
    if (index < 0 || index >= items.length) return;

    setItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, ...patch } : item
      )
    );
  }, [items.length]);

  const setPrimary = useCallback((index: number, byTypeKey?: keyof T): void => {
    if (index < 0 || index >= items.length) return;

    const targetItem = items[index];
    const groupKey = byTypeKey || typeKey;

    setItems(prev => 
      prev.map((item, i) => {
        if (i === index) {
          // Set this item as primary
          return { ...item, [primaryKey]: true } as T;
        } else if (groupKey && targetItem && item[groupKey] === targetItem[groupKey]) {
          // Unset primary for other items of the same type
          return { ...item, [primaryKey]: false } as T;
        }
        return item;
      })
    );
  }, [items, primaryKey, typeKey]);

  const resetItems = useCallback((newItems: T[]): void => {
    setItems(newItems);
  }, []);

  return {
    items,
    add,
    remove,
    update,
    setPrimary,
    resetItems,
  };
}

// Type declaration for analytics tracking (optional)
declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}