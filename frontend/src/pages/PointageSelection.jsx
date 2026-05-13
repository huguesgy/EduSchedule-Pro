/* frontend/src/pages/PointageSelection.jsx */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PointageSelection — Sélection de la séance pour générer le QR Code.
 * Accessible aux administrateurs, enseignants et surveillants.
 */
function PointageSelection() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClasse, setSelectedClasse] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/api/classes.php').then((res) => setClasses(res.data));
    }, []);

    useEffect(() => {
        if (!selectedClasse) return;

        setLoading(true);
        axios.get(`/api/emploi_temps.php?id_classe=${selectedClasse}`)
            .then((res) => {
                // On ne garde que les créneaux qui ont une séance associée (id_seance non nul)
                setSessions(res.data.filter((session) => session.seance_id));
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedClasse]);

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Pointage enseignant</span>
                    <h1>Séances du jour</h1>
                    <p className="page-intro">
                        Sélectionnez une classe pour afficher les séances disponibles et générer le QR Code de pointage.
                    </p>
                </div>
                <Link to="/dashboard" className="neo-btn alt">Retour</Link>
            </header>

            <div className="container-fluid px-0 mt-4">
                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="neo-card" style={{ background: '#fff' }}>
                            <span className="eyebrow" style={{ background: 'var(--primary-color)' }}>Filtre</span>
                            <h3>Choisir une classe</h3>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Classe concernée</label>
                                <select
                                    className="form-select neo-input"
                                    value={selectedClasse}
                                    onChange={(e) => {
                                        setSelectedClasse(e.target.value);
                                        setSessions(null);
                                    }}
                                >
                                    <option value="">-- Sélectionnez --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nom}</option>
                                    ))}
                                </select>
                            </div>

                            <Link to="/scan" className="btn btn-info text-white w-100 fw-bold py-2 mt-2">
                                📷 Ouvrir le scanner mobile
                            </Link>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        <div className="neo-card" style={{ background: 'var(--success-color)' }}>
                            <span className="eyebrow" style={{ background: '#fff' }}>Résultats</span>
                            <h3>Séances exploitables</h3>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-white" role="status"></div>
                                </div>
                            ) : !selectedClasse ? (
                                <p className="text-white opacity-75">Sélectionnez une classe à gauche pour voir les séances générées.</p>
                            ) : sessions && sessions.length > 0 ? (
                                <div className="row g-3">
                                    {sessions.map((session) => (
                                        <div key={session.id} className="col-md-6">
                                            <div className="neo-card p-3" style={{ background: '#fff', border: '2px solid #000' }}>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h5 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '1rem' }}>{session.matiere_nom}</h5>
                                                    <span className="badge bg-dark">{session.heure_debut} - {session.heure_fin}</span>
                                                </div>
                                                <p className="small mb-3 text-muted">
                                                    <strong>Classe :</strong> {session.classe_nom}<br />
                                                    <strong>Lieu :</strong> Salle {session.salle_nom || 'N/A'}<br />
                                                    <strong>Prof :</strong> {session.enseignant_nom || 'Non assigné'}
                                                </p>
                                                <Link to={`/qr-code/${session.seance_id}`} className="btn btn-warning w-100 fw-bold btn-sm">
                                                    🔳 Générer le QR Code
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white opacity-75">Aucune séance trouvée pour cette classe aujourd&apos;hui.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PointageSelection;
