/* frontend/src/components/CreneauForm.jsx */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * CreneauForm — Formulaire de création d'un créneau horaire.
 * Inclut la sélection de matière, enseignant, salle, jour et horaire.
 * Vérifie les conflits avant soumission (§ 4.1 — Détection automatique des conflits).
 * Requis par le sujet (§ 8.1 — CreneauForm.jsx).
 */
function CreneauForm({ classeId, onCreated, onCancel }) {
    const [matieres, setMatieres] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [salles, setSalles] = useState([]);
    const [form, setForm] = useState({
        matiere_id: '',
        enseignant_id: '',
        salle_id: '',
        jour: '1',
        heure_debut: '08:00',
        heure_fin: '10:00',
    });
    const [conflicts, setConflicts] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        Promise.all([
            axios.get('/api/matieres.php'),
            axios.get('/api/enseignants.php'),
            axios.get('/api/salles.php'),
        ]).then(([m, e, s]) => {
            setMatieres(m.data);
            setEnseignants(e.data);
            setSalles(s.data);
        });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setConflicts([]);
        setMessage('');
    };

    const checkConflicts = async () => {
        try {
            const res = await axios.post('/api/emploi_temps.php?action=check-conflicts', {
                enseignant_id: Number(form.enseignant_id),
                salle_id: Number(form.salle_id),
                jour: Number(form.jour),
                heure_debut: form.heure_debut,
                heure_fin: form.heure_fin,
            });
            setConflicts(res.data.conflicts || []);
            return res.data.has_conflicts;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!classeId) {
            setMessage('Veuillez d\'abord sélectionner une classe.');
            return;
        }

        const hasConflicts = await checkConflicts();
        if (hasConflicts) {
            setMessage('Des conflits ont été détectés. Corrigez-les avant de créer le créneau.');
            return;
        }

        try {
            await axios.post('/api/emploi_temps.php', {
                classe_id: Number(classeId),
                matiere_id: Number(form.matiere_id),
                enseignant_id: Number(form.enseignant_id),
                salle_id: Number(form.salle_id),
                jour: Number(form.jour),
                heure_debut: form.heure_debut,
                heure_fin: form.heure_fin,
            });
            onCreated();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const jourOptions = [
        { value: 1, label: 'Lundi' },
        { value: 2, label: 'Mardi' },
        { value: 3, label: 'Mercredi' },
        { value: 4, label: 'Jeudi' },
        { value: 5, label: 'Vendredi' },
        { value: 6, label: 'Samedi' },
    ];

    return (
        <div className="neo-card" style={{ background: 'var(--primary-color)', marginBottom: '1.5rem' }}>
            <span className="eyebrow" style={{ background: '#fff' }}>Nouveau créneau</span>
            <h3>Créer un créneau horaire</h3>

            {message && <div className="status-banner warning">{message}</div>}

            {conflicts.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    {conflicts.map((c, i) => (
                        <div key={i} className="status-banner warning" style={{ marginBottom: '0.5rem' }}>
                            ⚠️ {c.message}
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                    <label className="label">Matière</label>
                    <select className="neo-input" name="matiere_id" value={form.matiere_id} onChange={handleChange} required>
                        <option value="">-- Choisir --</option>
                        {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Enseignant</label>
                    <select className="neo-input" name="enseignant_id" value={form.enseignant_id} onChange={handleChange} required>
                        <option value="">-- Choisir --</option>
                        {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Salle</label>
                    <select className="neo-input" name="salle_id" value={form.salle_id} onChange={handleChange} required>
                        <option value="">-- Choisir --</option>
                        {salles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Jour</label>
                    <select className="neo-input" name="jour" value={form.jour} onChange={handleChange} required>
                        {jourOptions.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Heure début</label>
                    <input className="neo-input" type="time" name="heure_debut" value={form.heure_debut} onChange={handleChange} required />
                </div>
                <div>
                    <label className="label">Heure fin</label>
                    <input className="neo-input" type="time" name="heure_fin" value={form.heure_fin} onChange={handleChange} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <div className="button-row">
                        <button type="submit" className="neo-btn">Créer le créneau</button>
                        <button type="button" onClick={onCancel} className="neo-btn alt">Annuler</button>
                        <button type="button" onClick={checkConflicts} className="neo-btn info">Vérifier les conflits</button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreneauForm;
