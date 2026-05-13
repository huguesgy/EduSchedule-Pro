/* frontend/src/pages/Vacations.jsx */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Vacations — Suivi financier et workflow de validation des fiches de vacation.
 * Utilise useAuth() conformément au AuthContext (§ 8.2).
 * Inclut les boutons de validation/refus pour surveillant et comptable (§ 4.4).
 */
function Vacations() {
    const { user, token } = useAuth();
    const [vacations, setVacations] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [matiereId, setMatiereId] = useState('');
    const [enseignantId, setEnseignantId] = useState('');
    const [loading, setLoading] = useState(true);
    const [mois, setMois] = useState(new Date().getMonth() + 1);
    const [annee, setAnnee] = useState(new Date().getFullYear());
    const [message, setMessage] = useState('');

    const canChooseTeacher = user.role === 'admin' || user.role === 'surveillant';
    const canValidate = user.role === 'admin' || user.role === 'surveillant' || user.role === 'comptable';

    const refreshVacations = async () => {
        try {
            const res = await axios.get('/api/vacations.php?action=list');
            setVacations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const requests = [
                    axios.get('/api/vacations.php?action=list'),
                    axios.get('/api/matieres.php'),
                ];

                if (canChooseTeacher) {
                    requests.push(axios.get('/api/enseignants.php'));
                }

                const responses = await Promise.all(requests);
                setVacations(responses[0].data);
                setSubjects(responses[1].data);

                if (canChooseTeacher && responses[2]) {
                    setTeachers(responses[2].data);
                    if (responses[2].data.length > 0) {
                        setEnseignantId(String(responses[2].data[0].id));
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [canChooseTeacher]);

    const handleGenerate = async () => {
        setMessage('');
        try {
            const payload = {
                mois: Number(mois),
                annee: Number(annee),
                matiere_id: matiereId ? Number(matiereId) : null,
            };
            if (canChooseTeacher && enseignantId) {
                payload.enseignant_id = Number(enseignantId);
            }
            await axios.post('/api/vacations.php?action=generer', payload);
            setMessage('Fiche générée avec succès.');
            refreshVacations();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors de la génération');
        }
    };

    // ── Workflow de validation (§ 4.4 — chaîne de validation) ──
    const handleValidate = async (vacId, nouvelEtat) => {
        try {
            await axios.post(`/api/vacations.php?action=valider&id=${vacId}`, { etat: nouvelEtat });
            setMessage(`Fiche ${nouvelEtat === 'valide_surveillant' ? 'validée par le surveillant' : nouvelEtat === 'approuve_comptable' ? 'approuvée par le comptable' : nouvelEtat === 'paye' ? 'marquée comme payée' : 'mise à jour'}.`);
            refreshVacations();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors de la validation');
        }
    };

    const handleReject = async (vacId) => {
        const commentaire = prompt('Motif du refus :');
        if (!commentaire) return;
        try {
            await axios.post(`/api/vacations.php?action=valider&id=${vacId}`, { etat: 'brouillon', commentaire_refus: commentaire });
            setMessage('Fiche refusée et renvoyée en brouillon.');
            refreshVacations();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors du refus');
        }
    };

    // Déterminer l'action de validation disponible selon le rôle et l'état
    const getNextValidationState = (currentState) => {
        if (user.role === 'surveillant' && currentState === 'brouillon') return 'valide_surveillant';
        if (user.role === 'comptable' && currentState === 'valide_surveillant') return 'approuve_comptable';
        if (user.role === 'admin' && currentState === 'brouillon') return 'valide_surveillant';
        if (user.role === 'admin' && currentState === 'valide_surveillant') return 'approuve_comptable';
        if (user.role === 'admin' && currentState === 'approuve_comptable') return 'paye';
        return null;
    };

    const getStatutBadge = (etat) => {
        const map = {
            brouillon: { bg: '#e0e0e0', label: 'Brouillon' },
            valide_surveillant: { bg: '#ffd18c', label: 'Validé Surveillant' },
            approuve_comptable: { bg: '#a7d8ff', label: 'Approuvé Comptable' },
            paye: { bg: 'var(--success-color)', label: 'Payé ✓' },
        };
        const s = map[etat] || { bg: '#eee', label: etat };
        return <span className="badge rounded-pill" style={{ background: s.bg, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>{s.label}</span>;
    };

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Suivi financier</span>
                    <h1>Gestion des vacations</h1>
                    <p className="page-intro">
                        Générez des fiches à partir des séances clôturées, validez selon le workflow
                        (surveillant → comptable → paiement) et exportez en PDF.
                    </p>
                </div>
                <Link to="/dashboard" className="neo-btn alt">Retour</Link>
            </header>

            <div className="container-fluid px-0">
                <div className="row g-4">
                    {/* ── Panneau de génération ── */}
                    <div className="col-lg-5">
                        <div className="neo-card" style={{ background: 'var(--primary-color)' }}>
                            <span className="eyebrow" style={{ background: '#fff' }}>Génération</span>
                            <h3>Générer une fiche</h3>

                            {canChooseTeacher && (
                                <>
                                    <label className="form-label fw-bold">Enseignant</label>
                                    <select className="form-select neo-input" value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)}>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.prenom} {teacher.nom}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}

                            <label className="form-label fw-bold mt-2">Mois</label>
                            <input type="number" className="form-control neo-input" value={mois} onChange={(e) => setMois(e.target.value)} min="1" max="12" />

                            <label className="form-label fw-bold mt-2">Année</label>
                            <input type="number" className="form-control neo-input" value={annee} onChange={(e) => setAnnee(e.target.value)} />

                            <label className="form-label fw-bold mt-2">Matière (optionnelle)</label>
                            <select className="form-select neo-input" value={matiereId} onChange={(e) => setMatiereId(e.target.value)}>
                                <option value="">Toutes les matières</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.libelle}
                                    </option>
                                ))}
                            </select>

                            <div className="d-flex gap-2 mt-3">
                                <button onClick={handleGenerate} className="neo-btn">Lancer le calcul</button>
                            </div>

                            {message && <div className="alert alert-info mt-3 mb-0">{message}</div>}
                        </div>
                    </div>

                    {/* ── Tableau historique + workflow ── */}
                    <div className="col-lg-7">
                        <div className="neo-card" style={{ background: '#fff' }}>
                            <span className="eyebrow" style={{ background: 'var(--accent-soft)' }}>Historique</span>
                            <h3>Fiches générées</h3>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-warning" role="status">
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                </div>
                            ) : vacations.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover align-middle">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Période</th>
                                                <th>Heures</th>
                                                <th>Montant</th>
                                                <th>Statut</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vacations.map((vacation) => {
                                                const nextState = getNextValidationState(vacation.etat_validation);
                                                return (
                                                    <tr key={vacation.id}>
                                                        <td>{vacation.mois}/{vacation.annee}</td>
                                                        <td>{vacation.nb_heures_total}h</td>
                                                        <td><strong>{Number(vacation.montant_total).toLocaleString('fr-FR')} FCFA</strong></td>
                                                        <td>{getStatutBadge(vacation.etat_validation)}</td>
                                                        <td>
                                                            <div className="d-flex gap-1 flex-wrap">
                                                                <a
                                                                    href={`http://localhost:8000/api/vacations.php?action=pdf&id=${vacation.id}&token=${token}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                >
                                                                    📄 PDF
                                                                </a>
                                                                {canValidate && nextState && (
                                                                    <button
                                                                        onClick={() => handleValidate(vacation.id, nextState)}
                                                                        className="btn btn-sm btn-success"
                                                                    >
                                                                        ✓ Valider
                                                                    </button>
                                                                )}
                                                                {canValidate && vacation.etat_validation !== 'paye' && vacation.etat_validation !== 'brouillon' && (
                                                                    <button
                                                                        onClick={() => handleReject(vacation.id)}
                                                                        className="btn btn-sm btn-outline-danger"
                                                                    >
                                                                        ✕ Refuser
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="page-intro">Aucune fiche disponible pour le moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Vacations;
