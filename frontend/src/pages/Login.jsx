/* frontend/src/pages/Login.jsx */
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

/**
 * Login — Page de connexion avec formulaire.
 * Utilise le AuthContext via useAuth() (§ 8.2).
 */
function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showQuickAccess, setShowQuickAccess] = useState(false);
    const { login } = useAuth();

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get('/api/config.php');
                setShowQuickAccess(res.data.debug_mode);
            } catch (err) {
                console.error('Erreur config:', err);
            }
        };
        fetchConfig();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion');
        }
    };

    return (
        <div className="auth-shell">
            <div className="neo-card auth-hero" style={{ padding: '3rem' }}>
                <span className="page-kicker">Projet TP — Dr BÉRÉ</span>
                <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: '1.2rem' }}>
                    EduSchedule<strong>Pro</strong>
                </h1>
                <p className="page-intro" style={{ maxWidth: '40ch' }}>
                    Gestion complète de l&apos;emploi du temps, pointage QR, cahier de texte et suivi des vacations.
                </p>
                <div className="auth-grid">
                    <div className="auth-grid-item">📅 Emploi du temps intelligent</div>
                    <div className="auth-grid-item">📱 Pointage QR sécurisé</div>
                    <div className="auth-grid-item">📝 Cahier de texte numérique</div>
                    <div className="auth-grid-item">💰 Gestion des vacations</div>
                </div>
            </div>

            <div className="neo-card" style={{ padding: '3rem' }}>
                <span className="page-kicker" style={{ background: 'var(--primary-color)' }}>Connexion</span>
                <h2 style={{ marginBottom: '0.5rem' }}>Se connecter</h2>
                <p className="page-intro" style={{ marginBottom: '2rem' }}>
                    Entrez vos identifiants pour accéder à la plateforme.
                </p>

                {error && (
                    <div className="status-banner warning" style={{ marginBottom: '1rem' }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <label className="label">Email</label>
                    <input
                        className="neo-input"
                        type="email"
                        placeholder="exemple@itrst.bf"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label className="label">Mot de passe</label>
                    <input
                        className="neo-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="neo-btn block" style={{ marginTop: '1rem' }}>
                        Connexion
                    </button>
                </form>

                {showQuickAccess && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Accès rapides (Mode Test)
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Admin', email: 'admin@itrst.bf' },
                                { label: 'Professeur', email: 'prof1@itrst.bf' },
                                { label: 'Délégué', email: 'delegue1@itrst.bf' },
                                { label: 'Surveillant', email: 'surveillant@itrst.bf' },
                                { label: 'Comptable', email: 'comptable@itrst.bf' }
                            ].map((devUser) => (
                                <button
                                    key={devUser.email}
                                    type="button"
                                    className="neo-btn"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', minWidth: 'auto' }}
                                    onClick={() => {
                                        setEmail(devUser.email);
                                        setPassword('password');
                                    }}
                                >
                                    {devUser.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
