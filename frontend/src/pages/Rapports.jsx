/* frontend/src/pages/Rapports.jsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';

/**
 * Rapports — Page de génération de rapports : présence, avancement, vacations.
 * Requis par le sujet (§ 8.1 — RapportsPage.jsx).
 */
function Rapports() {
    const { user, token } = useAuth();
    const { data: classes } = useFetch('/api/classes.php');

    const [reportType, setReportType] = useState('presence');
    const [classeId, setClasseId] = useState('');
    const [mois, setMois] = useState(new Date().getMonth() + 1);
    const [annee, setAnnee] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const reportTypes = [
        { key: 'presence', label: '📊 Rapport de présence', desc: 'Taux de pointage par enseignant et par classe sur une période donnée.' },
        { key: 'avancement', label: '📝 Avancement programme', desc: 'État d\'avancement des matières à partir des cahiers de texte.' },
        { key: 'vacations', label: '💰 Synthèse des vacations', desc: 'Récapitulatif financier des heures effectuées et montants.' },
        { key: 'emploi_temps', label: '📅 Emploi du temps PDF', desc: 'Export PDF de l\'emploi du temps hebdomadaire d\'une classe.' },
    ];

    const handleGenerateReport = async () => {
        setLoading(true);
        setMessage('');
        try {
            const params = new URLSearchParams({
                action: 'rapport',
                type: reportType,
                mois: mois,
                annee: annee,
            });
            if (classeId) params.append('classe_id', classeId);

            // Téléchargement direct du PDF
            params.append('token', token);
            const url = `/api/rapports.php?${params.toString()}`;
            window.open(`http://localhost:8000${url}`, '_blank');
            setMessage('Le rapport a été généré. Vérifiez la fenêtre ouverte.');
        } catch {
            setMessage('Erreur lors de la génération du rapport.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Analyses</span>
                    <h1>Rapports et exports</h1>
                    <p className="page-intro">
                        Générez des rapports PDF de présence, d&apos;avancement pédagogique et de synthèse financière.
                    </p>
                </div>
                <Link to="/dashboard" className="neo-btn alt">Retour</Link>
            </header>

            <div className="split-grid">
                <div className="neo-card" style={{ background: '#d5eaff' }}>
                    <span className="eyebrow" style={{ background: '#fff' }}>Configuration</span>
                    <h3>Paramètres du rapport</h3>

                    <label className="label">Type de rapport</label>
                    <select className="neo-input" value={reportType} onChange={e => setReportType(e.target.value)}>
                        {reportTypes.map(r => (
                            <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                    </select>

                    <label className="label">Classe</label>
                    <select className="neo-input" value={classeId} onChange={e => setClasseId(e.target.value)}>
                        <option value="">Toutes les classes</option>
                        {(classes || []).map(c => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                    </select>

                    <label className="label">Mois</label>
                    <input type="number" className="neo-input" value={mois} onChange={e => setMois(e.target.value)} min="1" max="12" />

                    <label className="label">Année</label>
                    <input type="number" className="neo-input" value={annee} onChange={e => setAnnee(e.target.value)} />

                    <button
                        onClick={handleGenerateReport}
                        className="neo-btn block"
                        style={{ marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Génération...' : 'Générer le PDF'}
                    </button>

                    {message && <div className="status-banner success" style={{ marginTop: '1rem' }}>{message}</div>}
                </div>

                <div className="panel-stack">
                    {reportTypes.map(r => (
                        <div
                            key={r.key}
                            className="neo-card"
                            style={{
                                background: reportType === r.key ? 'var(--primary-color)' : '#fff',
                                cursor: 'pointer',
                            }}
                            onClick={() => setReportType(r.key)}
                        >
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{r.label}</h3>
                            <p className="page-intro" style={{ margin: 0, fontSize: '0.85rem' }}>{r.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Rapports;
