/* frontend/src/context/NotifContext.jsx */
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

/**
 * NotifContext — Gestion centralisée des notifications en temps réel.
 * Polling toutes les 30 secondes du compteur non-lu.
 * Requis par le sujet (§ 8.2 — Contextes globaux React).
 */
export const NotifContext = createContext(null);

export function NotifProvider({ children }) {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);

    // Charger le compteur de notifications non lues
    const loadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axios.get('/api/notifications.php?action=count');
            setUnreadCount(res.data.count || 0);
        } catch { /* silently fail */ }
    }, [user]);

    // Charger la liste complète des notifications
    const loadNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axios.get('/api/notifications.php');
            setNotifications(res.data);
        } catch { /* silently fail */ }
    }, [user]);

    // Marquer toutes comme lues
    const markAllRead = useCallback(async () => {
        try {
            await axios.put('/api/notifications.php?action=read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, lue: 1 })));
        } catch { /* silently fail */ }
    }, []);

    // Basculer le panneau
    const togglePanel = useCallback(() => {
        setShowPanel(prev => {
            if (!prev) loadNotifications();
            return !prev;
        });
    }, [loadNotifications]);

    // Polling toutes les 30s
    useEffect(() => {
        if (!user) return;
        loadCount();
        const interval = setInterval(loadCount, 30000);
        return () => clearInterval(interval);
    }, [user, loadCount]);

    const value = {
        notifications,
        unreadCount,
        showPanel,
        togglePanel,
        markAllRead,
        loadCount,
        loadNotifications,
    };

    return (
        <NotifContext.Provider value={value}>
            {children}
        </NotifContext.Provider>
    );
}
