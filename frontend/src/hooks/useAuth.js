/* frontend/src/hooks/useAuth.js */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — Hook personnalisé pour faciliter l'accès au contexte d'authentification.
 * Expose l'utilisateur, le token, et les fonctions login/logout.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
    }
    return context;
}
