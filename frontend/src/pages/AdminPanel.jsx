/* frontend/src/pages/AdminPanel.jsx */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

/**
 * AdminPanel — Page d'administration CRUD des entités principales.
 * Gestion des classes, matières, enseignants et salles.
 */
function AdminPanel() {
    const [activeTab, setActiveTab] = useState('classes');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [debugMode, setDebugMode] = useState(false);

    // ── Forms state ──
    const [form, setForm] = useState({});
    const [editId, setEditId] = useState(null);

    const tabs = [
        { key: 'classes', label: 'Classes', icon: '🏫' },
        { key: 'matieres', label: 'Matières', icon: '📚' },
        { key: 'salles', label: 'Salles', icon: '🚪' },
        { key: 'enseignants', label: 'Enseignants', icon: '👨‍🏫' },
        { key: 'utilisateurs', label: 'Utilisateurs', icon: '👥' },
    ];

    const loadConfig = async () => {
        try {
            const res = await axios.get('/api/config.php');
            setDebugMode(res.data.debug_mode);
        } catch (err) {
            console.error('Erreur config:', err);
        }
    };

    const toggleDebug = async () => {
        try {
            console.log('Tentative de changement de mode vers:', !debugMode);
            const token = localStorage.getItem('jwt');
            const res = await axios.post('/api/config.php', 
                { debug_mode: !debugMode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Réponse serveur:', res.data);
            setDebugMode(res.data.debug_mode);
            
            // Attendre un peu avant de recharger pour que l'utilisateur voit le changement
            setTimeout(() => {
                window.location.reload();
            }, 800);
            
            setMessage(`Succès : Mode ${res.data.debug_mode ? 'LIBRE' : 'RÉEL'} activé. La page va s'actualiser...`);
        } catch (err) {
            console.error('Erreur toggleDebug:', err);
            setMessage('Erreur : ' + (err.response?.data?.message || 'Impossible de changer le mode.'));
        }
    };

    const loadItems = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axios.get(`/api/admin.php?entity=${activeTab}`);
            setItems(res.data);
        } catch {
            setMessage('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
        loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            if (editId) {
                await axios.put(`/api/admin.php?entity=${activeTab}&id=${editId}`, form);
                setMessage('Modification enregistrée.');
            } else {
                await axios.post(`/api/admin.php?entity=${activeTab}`, form);
                setMessage('Élément créé avec succès.');
            }
            setForm({});
            setEditId(null);
            loadItems();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setForm({ ...item });
    };

    const handleDelete = async (id) => {
        if (!confirm('Confirmer la suppression ?')) return;
        try {
            await axios.delete(`/api/admin.php?entity=${activeTab}&id=${id}`);
            setMessage('Élément supprimé.');
            loadItems();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const cancelEdit = () => {
        setEditId(null);
        setForm({});
    };

    const renderForm = () => {
        const fields = getFieldsForTab(activeTab);
        return (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                {fields.map(f => (
                    <div key={f.key}>
                        <label className="label">{f.label}</label>
                        {f.type === 'select' ? (
                            <select
                                className="neo-input"
                                value={form[f.key] || ''}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                required={f.required}
                            >
                                <option value="">-- Choisir --</option>
                                {(f.options || []).map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="neo-input"
                                type={f.type || 'text'}
                                placeholder={f.placeholder || ''}
                                value={form[f.key] || ''}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                required={f.required}
                            />
                        )}
                    </div>
                ))}
                <div className="button-row">
                    <button type="submit" className="neo-btn">
                        {editId ? 'Modifier' : 'Créer'}
                    </button>
                    {editId && (
                        <button type="button" onClick={cancelEdit} className="neo-btn alt">Annuler</button>
                    )}
                </div>
            </form>
        );
    };

    const renderTable = () => {
        const cols = getColumnsForTab(activeTab);
        return (
            <div className="schedule-wrapper">
                <table className="ledger-table">
                    <thead>
                        <tr>
                            {cols.map(c => <th key={c.key}>{c.label}</th>)}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                {cols.map(c => (
                                    <td key={c.key}>{item[c.key]}</td>
                                ))}
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(item)} className="neo-btn alt" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="neo-btn danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={cols.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>Aucun élément</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Administration</span>
                    <h1>Panneau d&apos;administration</h1>
                    <p className="page-intro">
                        Gérez les classes, matières, salles, enseignants et utilisateurs.
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div 
                        className="neo-card" 
                        style={{ padding: '0.75rem 1rem', background: debugMode ? 'var(--success-color)' : '#eee', cursor: 'pointer', minWidth: '220px' }}
                        onClick={toggleDebug}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>MODE SYSTÈME</span>
                            <span style={{ fontSize: '0.8rem' }}>{debugMode ? '🔓 LIBRE' : '🔒 RÉEL'}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7 }}>
                            {debugMode ? 'Pointage autorisé n\'importe quand.' : 'Validation stricte des 15 minutes.'}
                        </div>
                    </div>
                    <Link to="/dashboard" className="neo-btn alt" style={{ width: '100%' }}>Retour</Link>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setEditId(null); setForm({}); }}
                        className={`neo-btn ${activeTab === tab.key ? '' : 'alt'}`}
                        style={{ fontSize: '0.82rem' }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {message && <div className="status-banner success">{message}</div>}

            <div className="split-grid">
                <div className="neo-card" style={{ background: 'var(--primary-color)' }}>
                    <span className="eyebrow" style={{ background: '#fff' }}>
                        {editId ? 'Modifier' : 'Ajouter'}
                    </span>
                    <h3>{editId ? 'Modifier l\'élément' : `Nouveau ${activeTab.slice(0, -1)}`}</h3>
                    {renderForm()}
                </div>

                <div className="neo-card" style={{ background: '#fff' }}>
                    <span className="eyebrow" style={{ background: 'var(--accent-soft)' }}>Liste</span>
                    <h3>{tabs.find(t => t.key === activeTab)?.label} ({items.length})</h3>
                    {loading ? <p>Chargement...</p> : renderTable()}
                </div>
            </div>
        </div>
    );
}

function getFieldsForTab(tab) {
    switch (tab) {
        case 'classes':
            return [
                { key: 'nom', label: 'Nom de la classe', placeholder: 'ex: L3 Informatique', required: true },
                { key: 'niveau', label: 'Niveau', placeholder: 'ex: Licence 3', required: true },
                { key: 'filiere', label: 'Filière', placeholder: 'ex: Informatique' },
            ];
        case 'matieres':
            return [
                { key: 'libelle', label: 'Libellé', placeholder: 'ex: Algèbre 2', required: true },
                { key: 'code', label: 'Code matière', placeholder: 'ex: ALG2', required: true },
                { key: 'volume_horaire', label: 'Volume horaire', type: 'number', placeholder: '40' },
            ];
        case 'salles':
            return [
                { key: 'nom', label: 'Nom de la salle', placeholder: 'ex: Salle 1', required: true },
                { key: 'capacite', label: 'Capacité', type: 'number', placeholder: '50', required: true },
                { key: 'batiment', label: 'Bâtiment', placeholder: 'ex: Bâtiment A' },
            ];
        case 'enseignants':
            return [
                { key: 'user_id', label: 'ID Utilisateur', type: 'number', required: true, placeholder: 'ID du compte' },
                { key: 'specialite', label: 'Spécialité', placeholder: 'ex: Mathématiques' },
                { key: 'taux_horaire', label: 'Taux horaire', type: 'number', placeholder: '25000', required: true },
            ];
        case 'utilisateurs':
            return [
                { key: 'nom', label: 'Nom', required: true },
                { key: 'prenom', label: 'Prénom', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                {
                    key: 'role', label: 'Rôle', type: 'select', required: true, options: [
                        { value: 'admin', label: 'Administrateur' },
                        { value: 'enseignant', label: 'Enseignant' },
                        { value: 'delegue', label: 'Délégué' },
                        { value: 'surveillant', label: 'Surveillant' },
                        { value: 'comptable', label: 'Comptable' },
                        { value: 'etudiant', label: 'Étudiant' },
                    ]
                },
                { key: 'mot_de_passe', label: 'Mot de passe', type: 'password', placeholder: 'Laisser vide si inchangé' },
            ];
        default: return [];
    }
}

function getColumnsForTab(tab) {
    switch (tab) {
        case 'classes': return [{ key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' }, { key: 'niveau', label: 'Niveau' }, { key: 'filiere', label: 'Filière' }];
        case 'matieres': return [{ key: 'id', label: 'ID' }, { key: 'code', label: 'Code' }, { key: 'libelle', label: 'Libellé' }];
        case 'salles': return [{ key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' }, { key: 'capacite', label: 'Capacité' }];
        case 'enseignants': return [{ key: 'id', label: 'ID' }, { key: 'user_id', label: 'UID' }, { key: 'specialite', label: 'Spécialité' }, { key: 'taux_horaire', label: 'Taux' }];
        case 'utilisateurs': return [{ key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' }, { key: 'prenom', label: 'Prénom' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Rôle' }];
        default: return [];
    }
}

export default AdminPanel;
