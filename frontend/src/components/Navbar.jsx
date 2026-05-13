/* frontend/src/components/Navbar.jsx */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { NotifContext } from '../context/NotifContext';

/**
 * Navbar — Barre de navigation principale avec notifications intégrées.
 * Utilise AuthContext et NotifContext conformément au sujet (§ 8.2).
 */
function Navbar() {
    const { user, logout } = useAuth();
    const [debugMode, setDebugMode] = useState(false);
    const {
        notifications,
        unreadCount,
        showPanel,
        togglePanel,
        markAllRead
    } = useContext(NotifContext);
    const location = useLocation();

    useEffect(() => {
        const checkMode = async () => {
            try {
                const res = await axios.get('/api/config.php');
                setDebugMode(res.data.debug_mode);
            } catch (err) { }
        };
        checkMode();
    }, [location]);

    if (!user) return null;

    const navLinks = getNavLinks(user.role);

    const notifTypeIcons = {
        retard: '⏰',
        absence: '🔴',
        cahier_manquant: '📝',
        conflit: '⚠️',
        vacation: '💰',
        systeme: '🔔'
    };

    return (
        <nav className="main-navbar">
            <div className="navbar-inner">
                <Link to="/dashboard" className="navbar-brand">
                    <span className="brand-icon">📅</span>
                    <span className="brand-text">EduSchedule<strong>Pro</strong></span>
                    {debugMode && (
                        <span style={{ 
                            fontSize: '0.6rem', 
                            background: 'var(--success-color)', 
                            border: '1px solid #000', 
                            padding: '2px 6px', 
                            marginLeft: '8px',
                            fontWeight: 900,
                            borderRadius: '4px'
                        }}>MODE LIBRE</span>
                    )}
                </Link>

                <div className="navbar-links">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span className="nav-label">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    <div className="notif-wrapper">
                        <button onClick={togglePanel} className="notif-btn" aria-label="Notifications">
                            🔔
                            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                        </button>

                        {showPanel && (
                            <div className="notif-dropdown">
                                <div className="notif-header">
                                    <strong>Notifications</strong>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="notif-mark-read">Tout lire</button>
                                    )}
                                </div>
                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">Aucune notification</div>
                                    ) : (
                                        notifications.slice(0, 10).map(n => (
                                            <div key={n.id} className={`notif-item ${n.lue == 0 ? 'unread' : ''}`}>
                                                <span className="notif-icon">{notifTypeIcons[n.type] || '🔔'}</span>
                                                <div className="notif-content">
                                                    <strong>{n.titre}</strong>
                                                    <p>{n.message}</p>
                                                    <span className="notif-time">
                                                        {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="user-pill">
                        <span className="user-role-badge">{user.role}</span>
                        <span className="user-name">{user.prenom}</span>
                    </div>

                    <button onClick={logout} className="logout-btn" title="Déconnexion">
                        ⏏
                    </button>
                </div>
            </div>
        </nav>
    );
}

/**
 * Liens de navigation filtrés par rôle.
 * Ajout de Administration et Rapports (demandés par le sujet §8.1)
 */
function getNavLinks(role) {
    const all = [
        { to: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['admin', 'enseignant', 'delegue', 'surveillant', 'comptable', 'etudiant'] },
        { to: '/schedule', label: 'Emploi du temps', icon: '📅', roles: ['admin', 'enseignant', 'delegue', 'surveillant', 'etudiant'] },
        { to: '/pointage', label: 'Pointage QR', icon: '📱', roles: ['admin', 'enseignant', 'surveillant'] },
        { to: '/vacations', label: 'Vacations', icon: '💰', roles: ['admin', 'enseignant', 'surveillant', 'comptable'] },
        { to: '/rapports', label: 'Rapports', icon: '📈', roles: ['admin', 'surveillant', 'comptable'] },
        { to: '/admin', label: 'Administration', icon: '⚙️', roles: ['admin'] },
    ];
    return all.filter(link => link.roles.includes(role));
}

export default Navbar;
