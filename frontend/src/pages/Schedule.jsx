/* frontend/src/pages/Schedule.jsx */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import CreneauForm from '../components/CreneauForm';

/**
 * Schedule — Vue hebdomadaire de l'emploi du temps par classe.
 * Inclut le formulaire de création de créneau (CreneauForm) pour l'admin (§ 8.1).
 * Ajout de l'export PDF et du lien cahier de texte.
 */
function Schedule() {
    const { user, token } = useAuth();
    const { data: classes } = useFetch('/api/classes.php');
    const [selectedClasse, setSelectedClasse] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (selectedClasse) {
            axios.get(`/api/emploi_temps.php?id_classe=${selectedClasse}`)
                .then((res) => setSchedule(res.data))
                .catch((err) => console.error(err));
        }
    }, [selectedClasse]);

    const refreshSchedule = () => {
        if (selectedClasse) {
            axios.get(`/api/emploi_temps.php?id_classe=${selectedClasse}`)
                .then((res) => setSchedule(res.data));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer ce créneau ?')) return;
        try {
            await axios.delete(`/api/emploi_temps.php?id=${id}`);
            refreshSchedule();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleExportPDF = () => {
        const url = `http://localhost:8000/api/rapports.php?type=emploi_temps&classe_id=${selectedClasse}&mois=${new Date().getMonth() + 1}&annee=${new Date().getFullYear()}&token=${token}`;
        window.open(url, '_blank');
    };

    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    // Définition des plages horaires standards selon la description Standard
    const timeSlots = [
        { label: 'Plage 1', start: '07:30', end: '09:30', description: '07h30 → 09h30' },
        { label: 'Plage 2', start: '10:00', end: '12:15', description: '10h00 → 12h15' },
        { label: 'Plage 3', start: '15:00', end: '18:00', description: '15h00 → 18h00' }
    ];

    /**
     * Récupère le contenu pour une plage horaire donnée.
     * Gère les séances qui commencent dans la plage ou qui la chevauchent.
     */
    const getSlotContent = (jour, slot) => {
        if (!schedule) return [];
        
        return schedule.filter((item) => {
            if (item.jour_nom !== jour) return false;

            const itemStart = item.heure_debut.substring(0, 5);
            const itemEnd = item.heure_fin.substring(0, 5);
            
            // Cas 1 : La séance commence pile au début de la plage
            if (itemStart === slot.start) return true;
            
            // Cas 2 : La séance commence pendant la plage (ex: DS à 13h)
            // On l'affiche dans la plage la plus proche ou on crée une exception
            if (itemStart > slot.start && itemStart < slot.end) return true;

            // Cas 3 : La séance couvre plusieurs plages (ex: Algèbre 07:30 -> 12:15)
            // On l'affiche dans chaque plage concernée
            if (itemStart < slot.start && itemEnd >= slot.end) return true;

            return false;
        });
    };

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Planning hebdomadaire — Standard</span>
                    <h1>Emploi du temps</h1>
                    <p className="page-intro">
                        Organisation en 3 plages horaires (07h30, 10h00, 15h00).
                    </p>
                </div>
                <div className="button-row">
                    {selectedClasse && (
                        <button onClick={handleExportPDF} className="neo-btn info">📄 Export PDF</button>
                    )}
                    {user.role === 'admin' && (
                        <button onClick={() => setShowForm(!showForm)} className="neo-btn">
                            {showForm ? '✕ Fermer' : '+ Créer un créneau'}
                        </button>
                    )}
                    <Link to="/dashboard" className="neo-btn alt">Retour</Link>
                </div>
            </header>

            {/* Formulaire de création (admin only) */}
            {showForm && user.role === 'admin' && (
                <CreneauForm
                    classeId={selectedClasse}
                    onCreated={() => { refreshSchedule(); setShowForm(false); }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <div className="neo-card toolbar-card">
                <div>
                    <label className="label">Sélectionner une classe</label>
                    <select
                        className="neo-input"
                        style={{ marginBottom: 0 }}
                        value={selectedClasse}
                        onChange={(e) => {
                            setSelectedClasse(e.target.value);
                            setSchedule(null);
                        }}
                    >
                        <option value="">-- Choisir --</option>
                        {(classes || []).map((classe) => (
                            <option key={classe.id} value={classe.id}>
                                {classe.nom} ({classe.filiere})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="panel-stack" style={{ minWidth: '220px' }}>
                    <span className="eyebrow" style={{ background: 'var(--accent-soft)' }}>Légende</span>
                    <p className="page-intro" style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e0e0e0', marginRight: '5px' }}></span> Examen (DS) 
                        <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>[...]</span> Horaire spécifique
                    </p>
                </div>
            </div>

            {selectedClasse && schedule === null ? (
                <div className="neo-card" style={{ textAlign: 'center' }}>
                    Chargement de l&apos;emploi du temps...
                </div>
            ) : selectedClasse ? (
                <div className="neo-card">
                    <div className="schedule-wrapper">
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th style={{ background: '#f2eee1', width: '120px' }}>Plage</th>
                                    {jours.map((jour) => (
                                        <th key={jour}>{jour}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map((slot) => (
                                    <tr key={slot.label}>
                                        <td className="schedule-hour">
                                            <strong>{slot.label}</strong>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{slot.description}</div>
                                        </td>
                                        {jours.map((jour) => {
                                            const items = getSlotContent(jour, slot);
                                            return (
                                                <td key={jour} className="schedule-cell">
                                                    {items.map((item) => {
                                                        const isDS = item.type_seance === 'DS';
                                                        const isSpecificTime = (item.heure_debut.substring(0, 5) !== slot.start) || 
                                                                             (item.heure_fin.substring(0, 5) !== slot.end && item.heure_fin.substring(0, 5) !== '12:15');

                                                        return (
                                                            <div 
                                                                key={item.id} 
                                                                className={`session-pill ${isDS ? 'ds-exam' : ''}`}
                                                                style={{ 
                                                                    background: isDS ? '#e0e0e0' : undefined,
                                                                    border: isDS ? '2px dashed #999' : undefined,
                                                                    marginBottom: '8px'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <strong style={{ fontSize: '0.9rem' }}>{item.matiere_nom}</strong>
                                                                    <span className="session-tag" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{item.type_seance}</span>
                                                                </div>
                                                                
                                                                <div className="session-meta">
                                                                    {item.enseignant_prenom} {item.enseignant_nom}
                                                                </div>
                                                                <div className="session-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span>📍 {item.salle_nom}</span>
                                                                    {item.groupe && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{item.groupe}</span>}
                                                                </div>

                                                                {isSpecificTime && (
                                                                    <div style={{ marginTop: '5px', fontWeight: 'bold', fontSize: '0.75rem', color: '#444' }}>
                                                                        [{item.heure_debut.substring(0, 5)} : {item.heure_fin.substring(0, 5)}]
                                                                    </div>
                                                                )}

                                                                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '5px' }}>
                                                                    {/* Toujours permettre l'accès au QR pour les tests */}
                                                                    <Link 
                                                                        to={`/qr-code/${item.seance_id || item.id}`} 
                                                                        className="session-tag" 
                                                                        style={{ background: '#fff', color: '#333', border: '1px solid #ddd', textDecoration: 'none' }}
                                                                    >
                                                                        📱 QR
                                                                    </Link>
                                                                    
                                                                    {item.seance_id && (
                                                                        <Link to={`/textbook/${item.seance_id}`} className="session-tag" style={{ background: 'var(--primary-color)', color: '#fff', textDecoration: 'none' }}>📝 Cahier</Link>
                                                                    )}
                                                                    
                                                                    {user.role === 'admin' && (
                                                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>🗑️</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="neo-card" style={{ textAlign: 'center', background: '#fff7cb' }}>
                    Choisissez une classe pour afficher son planning.
                </div>
            )}
        </div>
    );
}

export default Schedule;
