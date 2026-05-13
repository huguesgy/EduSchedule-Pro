import React from 'react';
import { Link } from 'react-router-dom';

/**
 * RoleGate — Composant de protection des routes par rôle.
 * Si l'utilisateur n'a pas le rôle requis, un message d'accès refusé est affiché.
 * 
 * Props:
 *   - user: objet utilisateur avec { role }
 *   - allowedRoles: tableau de rôles autorisés (ex: ['admin', 'enseignant'])
 *   - children: contenu à afficher si autorisé
 */
function RoleGate({ user, allowedRoles, children }) {
    if (!user || !allowedRoles.includes(user.role)) {
        return (
            <div className="app-shell">
                <div className="neo-card" style={{ textAlign: 'center', background: '#ffded5', maxWidth: '600px', margin: '4rem auto' }}>
                    <span className="eyebrow" style={{ background: '#ff7a59', color: '#fff' }}>Accès refusé</span>
                    <h2 style={{ marginTop: '1rem' }}>Permissions insuffisantes</h2>
                    <p className="page-intro" style={{ margin: '1rem 0' }}>
                        Votre rôle <strong>({user?.role || 'inconnu'})</strong> ne permet pas d&apos;accéder à cette page.
                        <br />
                        Rôles autorisés : <strong>{allowedRoles.join(', ')}</strong>
                    </p>
                    <Link to="/dashboard" className="neo-btn alt" style={{ marginTop: '1rem' }}>
                        Retour au tableau de bord
                    </Link>
                </div>
            </div>
        );
    }

    return children;
}

export default RoleGate;
