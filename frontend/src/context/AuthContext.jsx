/* frontend/src/context/AuthContext.jsx */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * AuthContext — Contexte global d'authentification React.
 * Gère le token JWT, l'utilisateur connecté, le rôle et les opérations login/logout.
 * Requis par le sujet (§ 8.2 — Hooks et Services React).
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('jwt'));
    const [loading, setLoading] = useState(true);

    // Restauration automatique de session à partir du localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('jwt');
        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            axios.get('/api/auth/me.php')
                .then(res => setUser(res.data.user))
                .catch(() => {
                    localStorage.removeItem('jwt');
                    setToken(null);
                    delete axios.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Connexion — stocke le JWT et met à jour l'utilisateur
    const login = useCallback(async (email, password) => {
        const res = await axios.post('/api/auth/login.php', { email, password });
        const { jwt, user: userData } = res.data;
        localStorage.setItem('jwt', jwt);
        setToken(jwt);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
        setUser(userData);
        return userData;
    }, []);

    // Déconnexion — nettoie le token et redirige
    const logout = useCallback(() => {
        localStorage.removeItem('jwt');
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    }, []);

    // Vérification du rôle courant
    const hasRole = useCallback((roles) => {
        if (!user) return false;
        return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
    }, [user]);

    const value = {
        user,
        token,
        setUser,
        loading,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
