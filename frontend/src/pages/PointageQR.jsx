/* frontend/src/pages/PointageQR.jsx */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * PointageQR — Affiche le QR Code généré par le serveur pour une séance donnée.
 */
function PointageQR() {
    const { id } = useParams();
    const [qrSvg, setQrSvg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/seance_qr.php?id=${id}`, { responseType: 'text' })
            .then((res) => {
                setQrSvg(res.data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Pointage QR</span>
                    <h1>Séance #{id}</h1>
                    <p className="page-intro">
                        Le QR Code contient un token sécurisé (HMAC-SHA256). L&apos;enseignant doit le scanner dans la fenêtre horaire autorisée.
                    </p>
                </div>
                <Link to="/pointage" className="neo-btn alt">Retour</Link>
            </header>

            <div className="container-fluid px-0 mt-4">
                <div className="row g-4 justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="neo-card text-center" style={{ background: '#fff7cb' }}>
                            <span className="eyebrow" style={{ background: '#fff' }}>Hologramme</span>
                            <div className="qr-stage d-flex justify-content-center align-items-center bg-white p-4 border border-dark mt-3" style={{ minHeight: '300px' }}>
                                {loading ? (
                                    <div className="spinner-border text-dark" role="status"></div>
                                ) : (
                                    <div className="qr-box w-100" style={{ fill: '#000' }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
                                )}
                            </div>
                            <p className="mt-3 small fw-bold text-muted text-uppercase">
                                Token valide pour 15 min autour de l&apos;heure de début
                            </p>
                        </div>
                    </div>

                    <div className="col-md-6 col-lg-4">
                        <div className="neo-card" style={{ background: 'var(--accent-soft)' }}>
                            <span className="eyebrow" style={{ background: '#fff' }}>Règles de sécurité</span>
                            <h3 className="mt-2">Consignes de pointage</h3>
                            <ul className="list-group list-group-flush bg-transparent border-0">
                                <li className="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                                    <span>Usage unique</span>
                                    <span className="badge bg-danger rounded-pill">OUI</span>
                                </li>
                                <li className="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                                    <span>Expire après</span>
                                    <span className="badge bg-dark rounded-pill">Séance</span>
                                </li>
                                <li className="list-group-item bg-transparent d-flex justify-content-between align-items-center">
                                    <span>Chiffrement</span>
                                    <span className="badge bg-primary rounded-pill">HMAC</span>
                                </li>
                            </ul>

                            <hr />

                            <Link to="/scan" className="btn btn-info text-white w-100 fw-bold py-2">
                                📷 Ouvrir le lecteur de scan
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PointageQR;
