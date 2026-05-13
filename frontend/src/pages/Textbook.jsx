/* frontend/src/pages/Textbook.jsx */
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SignaturePad from 'signature_pad';
import { useAuth } from '../hooks/useAuth';

/**
 * Textbook — Cahier de texte numérique par séance.
 * Utilise useAuth() conformément au AuthContext (§ 8.2).
 * Inclut tous les champs du sujet (§ 4.3) : titre, contenu, travaux, observations, avancement.
 */
function Textbook() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const [cahier, setCahier] = useState(null);
    const [titre, setTitre] = useState('');
    const [contenu, setContenu] = useState('');
    const [devoirs, setDevoirs] = useState('');
    const [observations, setObservations] = useState('');
    const [avancement, setAvancement] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const sigCanvas = useRef(null);
    const pad = useRef(null);

    useEffect(() => {
        axios.get(`/api/cahiers.php?action=getBySeance&seance_id=${id}`)
            .then((res) => {
                if (res.data.id) {
                    setCahier(res.data);
                    setTitre(res.data.titre_cours || '');
                    setContenu(res.data.contenu || '');
                    setDevoirs(res.data.devoirs || '');
                    setObservations(res.data.observations || '');
                    setAvancement(res.data.avancement || 0);
                }
            })
            .catch(() => console.log('Nouveau cahier à créer'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (sigCanvas.current) {
            pad.current = new SignaturePad(sigCanvas.current);
        }
    }, [loading]);

    const saveCahier = async () => {
        try {
            if (cahier) {
                await axios.put(`/api/cahiers.php?id=${cahier.id}`, { titre_cours: titre, contenu, avancement, devoirs, observations });
            } else {
                await axios.post('/api/cahiers.php', { seance_id: id, titre_cours: titre, contenu, avancement, devoirs, observations });
                window.location.reload();
            }
            setMessage('Cahier de texte enregistré.');
        } catch {
            alert("Erreur lors de l'enregistrement");
        }
    };

    const handleSign = async (type) => {
        if (pad.current.isEmpty()) {
            alert("Veuillez signer d'abord");
            return;
        }

        const signature64 = pad.current.toDataURL();

        try {
            if (type === 'enseignant') {
                const heureFin = new Date().toLocaleTimeString('fr-FR', { hour12: false });
                await axios.post(`/api/cahiers.php?id=${cahier.id}&action=cloture`, {
                    signature_base64: signature64,
                    heure_fin: heureFin,
                });
                setMessage("Séance clôturée et signée par l'enseignant.");
            } else {
                await axios.post(`/api/cahiers.php?id=${cahier.id}&action=signer`, {
                    type: 'delegue',
                    signature_base64: signature64,
                });
                setMessage('Signature du délégué enregistrée.');
            }

            pad.current.clear();
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            alert('Erreur lors de la signature');
        }
    };

    if (loading) {
        return (
            <div className="app-shell text-center py-5">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    const isCloture = cahier && cahier.statut === 'cloture';
    const canEdit = !isCloture && (user.role === 'delegue' || user.role === 'admin' || user.role === 'enseignant');
    const canSignDelegue = !isCloture && (user.role === 'delegue' || user.role === 'admin');
    const canCloturer = !isCloture && (user.role === 'enseignant' || user.role === 'admin');

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Suivi pédagogique</span>
                    <h1>Cahier de texte — séance #{id}</h1>
                    <p className="page-intro">
                        Saisissez le contenu réel de la séance, suivez l&apos;avancement du programme et finalisez avec les signatures numériques.
                    </p>
                </div>
                <Link to="/schedule" className="neo-btn alt">Retour emploi du temps</Link>
            </header>

            <div className="container-fluid px-0">
                <div className="row g-4">
                    {/* ── Colonne gauche : formulaire du cahier ── */}
                    <div className="col-lg-7">
                        <div className="neo-card" style={{ background: '#fff' }}>
                            <span className="eyebrow" style={{ background: 'var(--primary-color)' }}>Contenu</span>
                            {message && <div className="alert alert-success">{message}</div>}

                            <div className="mb-3">
                                <label className="form-label fw-bold">Titre du cours</label>
                                <input
                                    className="form-control neo-input"
                                    value={titre}
                                    onChange={(e) => setTitre(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Chapitre ou thème traité"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Points vus dans le cours</label>
                                <textarea
                                    className="form-control neo-input"
                                    style={{ minHeight: '150px' }}
                                    value={contenu}
                                    onChange={(e) => setContenu(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Liste des notions, concepts, exercices traités..."
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Travaux demandés</label>
                                <textarea
                                    className="form-control neo-input"
                                    value={devoirs}
                                    onChange={(e) => setDevoirs(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Devoirs, exercices à rendre, dates limites..."
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Observations</label>
                                <input
                                    className="form-control neo-input"
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Incidents, retards, absences signalées"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    Niveau d&apos;avancement du programme : <span className="badge bg-warning text-dark">{avancement}%</span>
                                </label>
                                <input
                                    type="range"
                                    className="form-range"
                                    min="0"
                                    max="100"
                                    value={avancement}
                                    onChange={(e) => setAvancement(e.target.value)}
                                    disabled={!canEdit}
                                />
                                <div className="progress mt-1" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-warning"
                                        role="progressbar"
                                        style={{ width: `${avancement}%` }}
                                        aria-valuenow={avancement}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    />
                                </div>
                            </div>

                            {canEdit && (
                                <button onClick={saveCahier} className="btn btn-lg btn-warning w-100 fw-bold mt-2">
                                    💾 Enregistrer le brouillon
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Colonne droite : statut + signatures ── */}
                    <div className="col-lg-5">
                        <div className="neo-card mb-3" style={{ background: '#fff7cb' }}>
                            <span className="eyebrow" style={{ background: '#fff' }}>Informations</span>
                            <div className="info-row">
                                <span>État</span>
                                <strong>
                                    {isCloture ? (
                                        <span className="badge bg-success">Clôturé ✓</span>
                                    ) : cahier ? (
                                        <span className="badge bg-warning text-dark">{cahier.statut || 'brouillon'}</span>
                                    ) : (
                                        <span className="badge bg-secondary">Nouveau</span>
                                    )}
                                </strong>
                            </div>
                            <div className="info-row">
                                <span>Séance</span>
                                <strong>#{id}</strong>
                            </div>
                            <div className="info-row">
                                <span>Utilisateur</span>
                                <strong>{user.prenom} {user.nom} ({user.role})</strong>
                            </div>
                            <div className="info-row">
                                <span>Signatures</span>
                                <strong>{isCloture ? 'Complétées' : 'En attente'}</strong>
                            </div>
                        </div>

                        {cahier && !isCloture && (
                            <div className="neo-card mb-3" style={{ background: 'var(--accent-soft)' }}>
                                <span className="eyebrow" style={{ background: '#fff' }}>Signature numérique</span>
                                <p className="page-intro">
                                    {user.role === 'delegue'
                                        ? 'Signez le cahier en tant que délégué de classe.'
                                        : user.role === 'enseignant'
                                            ? 'Signez et clôturez la séance après le délégué.'
                                            : 'Le délégué signe d\'abord, puis l\'enseignant clôture.'}
                                </p>
                                <div className="canvas-shell" style={{ marginTop: '1rem' }}>
                                    <canvas ref={sigCanvas} width="500" height="200" className="signature-canvas" />
                                </div>

                                <div className="d-flex gap-2 flex-wrap mt-3">
                                    <button onClick={() => pad.current.clear()} className="btn btn-outline-secondary">Effacer</button>
                                    {canSignDelegue && (
                                        <button onClick={() => handleSign('delegue')} className="btn btn-info text-white">
                                            ✍️ Signer délégué
                                        </button>
                                    )}
                                    {canCloturer && (
                                        <button onClick={() => handleSign('enseignant')} className="btn btn-success">
                                            ✓ Signer et clôturer
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {isCloture && (
                            <>
                                <div className="neo-card mb-3" style={{ background: '#111', color: '#fff' }}>
                                    <span className="eyebrow" style={{ background: '#fff', color: '#111' }}>Archive</span>
                                    <p className="mb-0">
                                        Séance clôturée le {new Date(cahier.date_cloture).toLocaleDateString('fr-FR')}.
                                        La fiche est verrouillée.
                                    </p>
                                </div>
                                <a
                                    href={`http://localhost:8000/api/cahiers.php?id=${cahier.id}&action=pdf&token=${token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-lg btn-outline-primary w-100"
                                >
                                    📄 Télécharger le récapitulatif PDF
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Textbook;
