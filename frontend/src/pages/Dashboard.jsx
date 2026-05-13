/* frontend/src/pages/Dashboard.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import axios from 'axios';

/**
 * Dashboard — Tableau de bord statistique par rôle.
 * Utilise useAuth() et useFetch() conformément au sujet (§ 8.2).
 */
function Dashboard() {
    const { user } = useAuth();
    const { data: stats } = useFetch('/api/stats.php');

    React.useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'surveillant')) {
            axios.post('/api/notifications.php?action=check-alerts').catch(() => { });
        }
    }, [user]);

    if (!user) return <div className="app-shell">Chargement du profil...</div>;

    const getCards = () => {
        const allCards = [
            {
                title: 'Emploi du temps',
                text: 'Consultez les plannings hebdomadaires par classe, avec détection automatique des conflits.',
                to: '/schedule',
                bg: 'var(--accent-soft)',
                action: 'Ouvrir',
                roles: ['admin', 'enseignant', 'delegue', 'surveillant', 'etudiant'],
            },
            {
                title: 'Pointage QR',
                text: 'Générez un QR Code sécurisé pour chaque séance et validez la présence enseignant.',
                to: '/pointage',
                bg: 'var(--success-color)',
                action: 'Pointer',
                roles: ['admin', 'enseignant', 'surveillant'],
            },
            {
                title: 'Cahier de texte',
                text: 'Le suivi pédagogique : saisie du contenu, signatures numériques et clôture de séance.',
                to: '/schedule',
                bg: 'var(--primary-color)',
                action: 'Accéder',
                roles: ['admin', 'enseignant', 'delegue', 'surveillant'],
            },
            {
                title: 'Vacations',
                text: 'Générez, contrôlez et validez les fiches de paiement mensuelles des enseignants.',
                to: '/vacations',
                bg: '#ffd6c7',
                action: 'Calculer',
                roles: ['admin', 'enseignant', 'surveillant', 'comptable'],
            },
            {
                title: 'Rapports',
                text: 'Exportez les rapports de présence, d\'avancement et de vacations au format PDF.',
                to: '/rapports',
                bg: '#d5eaff',
                action: 'Consulter',
                roles: ['admin', 'surveillant', 'comptable'],
            },
            {
                title: 'Administration',
                text: 'Gérez les classes, matières, enseignants, salles et utilisateurs de la plateforme.',
                to: '/admin',
                bg: '#f0e6ff',
                action: 'Gérer',
                roles: ['admin'],
            },
        ];
        return allCards.filter(card => {
            const currentRole = user.role.trim().toLowerCase();
            return card.roles.map(r => r.toLowerCase()).includes(currentRole);
        });
    };

    const getStatCards = () => {
        if (user.role === 'admin' || user.role === 'surveillant') {
            return (
                <section className="stat-grid">
                    <div className="neo-card stat-card">
                        <div className="stat-value">{stats?.total_classes || 0}</div>
                        <div className="stat-label">Classes actives</div>
                    </div>
                    <div className="neo-card stat-card" style={{ background: 'var(--primary-color)' }}>
                        <div className="stat-value">{stats?.total_enseignants || 0}</div>
                        <div className="stat-label">Enseignants</div>
                    </div>
                    <div className="neo-card stat-card" style={{ background: 'var(--accent-soft)' }}>
                        <div className="stat-value">{stats?.taux_presence || 0}%</div>
                        <div className="stat-label">Taux présence jour</div>
                    </div>
                    <div className="neo-card stat-card" style={{ background: 'var(--success-color)' }}>
                        <div className="stat-value" style={{ fontSize: '1.4rem' }}>{stats?.vacation_mois_courant || 0} FCFA</div>
                        <div className="stat-label">Budget du mois</div>
                    </div>
                    {stats?.cahiers_en_attente > 0 && (
                        <div className="neo-card stat-card" style={{ background: '#ffc95e' }}>
                            <div className="stat-value">{stats.cahiers_en_attente}</div>
                            <div className="stat-label">Cahiers en attente</div>
                        </div>
                    )}
                    {stats?.notifs_non_lues > 0 && (
                        <div className="neo-card stat-card" style={{ background: '#ff7a59', color: '#fff' }}>
                            <div className="stat-value">{stats.notifs_non_lues}</div>
                            <div className="stat-label">Alertes non lues</div>
                        </div>
                    )}
                </section>
            );
        }

        if (user.role === 'enseignant') {
            return (
                <section className="stat-grid">
                    <div className="neo-card stat-card" style={{ background: 'var(--accent-soft)' }}>
                        <div className="stat-value">{stats?.mes_seances_semaine || 0}</div>
                        <div className="stat-label">Séances cette semaine</div>
                    </div>
                    <div className="neo-card stat-card" style={{ background: 'var(--primary-color)' }}>
                        <div className="stat-value">{stats?.sessions_terminees_mois || 0}</div>
                        <div className="stat-label">Réalisées ce mois</div>
                    </div>
                    <div className="neo-card stat-card" style={{ background: 'var(--success-color)' }}>
                        <div className="stat-value" style={{ fontSize: '1.4rem' }}>{stats?.mon_total_vacation || 0} FCFA</div>
                        <div className="stat-label">Ma vacation du mois</div>
                    </div>
                </section>
            );
        }

        if (user.role === 'delegue') {
            return (
                <section className="stat-grid">
                    <div className="neo-card stat-card" style={{ background: '#ffc95e' }}>
                        <div className="stat-value">{stats?.cahiers_a_remplir || 0}</div>
                        <div className="stat-label">Cahiers à remplir</div>
                    </div>
                </section>
            );
        }

        return null;
    };

    return (
        <div className="app-shell">
            <section className="hero-strip">
                <div className="neo-card highlight-card">
                    <span className="page-kicker">Session active</span>
                    <h1 style={{ fontSize: 'clamp(2.1rem, 4vw, 3.6rem)', marginBottom: '0.9rem' }}>
                        {user.prenom} {user.nom}
                    </h1>
                    <p className="page-intro" style={{ maxWidth: '50ch' }}>
                        Bienvenue, <strong>{user.role === 'admin' ? 'ADMINISTRATEUR' : user.role}</strong>. Utilisez ce tableau de bord comme point d&apos;entrée pour naviguer entre les modules.
                    </p>
                </div>

                <div className="neo-card" style={{ background: '#fff' }}>
                    <span className="page-kicker" style={{ background: 'var(--accent-soft)' }}>Lecture rapide</span>
                    <div className="panel-stack">
                        <div className="info-row">
                            <span>Rôle</span>
                            <strong>{user.role.toUpperCase()}</strong>
                        </div>
                        <div className="info-row">
                            <span>Utilisateur</span>
                            <strong>{user.nom} {user.prenom}</strong>
                        </div>
                        <div className="info-row">
                            <span>Séances du jour</span>
                            <strong>{stats?.sessions_jour || stats?.sessions_en_cours || 0}</strong>
                        </div>
                    </div>
                </div>
            </section>

            {getStatCards()}

            {stats?.chart_data && stats.chart_data.length > 0 && (user.role === 'admin' || user.role === 'surveillant' || user.role === 'comptable') && (
                <section className="neo-card" style={{ background: '#fff', marginBottom: '2rem', padding: '1.5rem' }}>
                    <span className="page-kicker" style={{ background: 'var(--accent-soft)' }}>Analyse financière</span>
                    <h3 style={{ marginBottom: '1.5rem' }}>Évolution des vacations (6 mois)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.chart_data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="periode" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                                    {stats.chart_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === stats.chart_data.length - 1 ? 'var(--primary-color)' : 'var(--accent-soft)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            <section className="action-grid">
                {getCards().map((card) => (
                    <div key={card.title} className="neo-card action-card" style={{ background: card.bg }}>
                        <div>
                            <span className="page-kicker" style={{ background: '#fff' }}>Module</span>
                            <h2>{card.title}</h2>
                            <p>{card.text}</p>
                        </div>
                        <Link to={card.to} className="neo-btn alt">{card.action}</Link>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default Dashboard;
