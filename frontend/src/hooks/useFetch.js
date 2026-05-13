/* frontend/src/hooks/useFetch.js */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useFetch() — Hook personnalisé pour les appels API REST.
 * Gère le loading, les données et les erreurs automatiquement.
 * Requis par le sujet (§ 8.2 — Hooks React Requis).
 * 
 * Usage: const { data, loading, error, refetch } = useFetch('/api/classes.php');
 */
export function useFetch(url, options = {}) {
    const [data, setData] = useState(options.initialData ?? null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!url) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(url);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData, setData };
}
