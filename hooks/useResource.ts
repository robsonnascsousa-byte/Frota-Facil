
import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/database';
import { TableName } from '../services/database';

interface UseResourceOptions {
    selectQuery?: string;
}

export function useResource<T extends { id: number | string }>(tableName: TableName, options?: UseResourceOptions) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const selectQuery = options?.selectQuery || '*';

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const items = await db.getAll<T>(tableName, 'created_at', false, selectQuery);
            setData(items);
            setError(null);
        } catch (err) {
            console.error(`Error fetching ${tableName}:`, err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [tableName, selectQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const add = async (item: Partial<T>) => {
        try {
            // Strip array fields (relations) before inserting
            const payload = stripRelationFields(item);
            const newItem = await db.create<T>(tableName, payload);

            // If we have a selectQuery with relations, re-fetch to get complete data
            if (selectQuery !== '*') {
                await fetchData();
                return newItem;
            }

            setData(prev => [newItem, ...prev]);
            return newItem;
        } catch (err) {
            console.error(`Error creating in ${tableName}:`, err);
            throw err;
        }
    };

    const update = async (item: T) => {
        try {
            // Strip array fields (relations like 'pagamentos') before updating
            const payload = stripRelationFields(item);
            // @ts-ignore
            const updatedItem = await db.update<T>(tableName, item.id, payload);

            if (selectQuery !== '*') {
                // Re-fetch to get complete data with relations
                await fetchData();
                return updatedItem;
            }

            setData(prev => prev.map(i => i.id === item.id ? updatedItem : i));
            return updatedItem;
        } catch (err) {
            console.error(`Error updating in ${tableName}:`, err);
            throw err;
        }
    };

    const remove = async (id: number | string) => {
        try {
            await db.remove(tableName, id);
            setData(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(`Error removing from ${tableName}:`, err);
            throw err;
        }
    };

    return {
        data,
        loading,
        error,
        add,
        update,
        remove,
        refresh: fetchData,
        setData // Expose setData if manual manipulation is needed (e.g. undo)
    };
}

/**
 * Strips array and nested object fields from an item before sending to DB.
 * This prevents relation data (e.g. pagamentos[]) from being sent as columns.
 */
function stripRelationFields<T>(item: Partial<T>): Partial<T> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        if (Array.isArray(value)) continue; // Skip arrays (relations)
        if (value !== null && typeof value === 'object' && !(value instanceof Date)) continue; // Skip nested objects
        cleaned[key] = value;
    }
    return cleaned as Partial<T>;
}
