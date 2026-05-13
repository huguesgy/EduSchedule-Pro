/* frontend/src/pages/Scanner.jsx */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { useAuth } from '../hooks/useAuth';

/**
 * Scanner — Lecteur de QR Code en temps réel via la caméra (jsQR).
 * Utilise la géolocalisation pour valider la présence sur le site (§ 4.2).
 */
function Scanner() {
    const { user } = useAuth();
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                (err) => console.warn('GPS non disponible:', err.message),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const scanFrame = () => {
            if (cancelled || !videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const context = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code?.data) {
                    setToken(code.data);
                    // On peut arrêter le scan une fois qu'on a un token
                    cancelAnimationFrame(animationFrameRef.current);
                }
            }
            animationFrameRef.current = requestAnimationFrame(scanFrame);
        };

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setCameraReady(true);
                    animationFrameRef.current = requestAnimationFrame(scanFrame);
                }
            } catch {
                setCameraError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
            }
        };

        startCamera();

        return () => {
            cancelled = true;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleScanSubmit = async (e) => {
        if (e) e.preventDefault();
        setMessage('');
        setError('');

        try {
            const res = await axios.post('/api/pointage_scan.php', {
                token_qr: token,
                latitude: coords.latitude,
                longitude: coords.longitude
            });
            setMessage(res.data.message);
            // Redirection après succès
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation du scan');
        }
    };

    return (
        <div className="app-shell">
            <header className="page-top">
                <div className="page-title">
                    <span className="page-kicker">Validation séance</span>
                    <h1>Scanner de pointage</h1>
                    <p className="page-intro">
                        Veuillez cadrer le QR Code affiché dans la salle. Votre position GPS est relevée pour validation.
                    </p>
                </div>
                <Link to="/dashboard" className="neo-btn alt">Dashboard</Link>
            </header>

            <div className="container-fluid px-0 mt-4">
                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="neo-card p-0 overflow-hidden" style={{ background: '#000', minHeight: '400px' }}>
                            <div className="eye-brow bg-warning text-dark px-3 py-1 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                                Caméra Directe
                            </div>
                            <div className="position-relative">
                                <video
                                    ref={videoRef}
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover', minHeight: '380px', display: cameraReady ? 'block' : 'none' }}
                                    playsInline
                                    muted
                                />
                                {!cameraReady && (
                                    <div className="d-flex align-items-center justify-content-center text-white" style={{ minHeight: '380px' }}>
                                        <div className="text-center">
                                            <div className="spinner-border text-warning mb-2" role="status"></div>
                                            <p className="small px-4">{cameraError || 'Autorisez l&apos;accès à la caméra...'}</p>
                                        </div>
                                    </div>
                                )}
                                {cameraReady && (
                                    <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '200px', height: '200px', border: '2px dashed #ffc107', borderRadius: '20px', pointerEvents: 'none' }}></div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="neo-card" style={{ background: '#fff' }}>
                            <span className="eyebrow" style={{ background: 'var(--accent-soft)' }}>Données de pointage</span>
                            <h3>Validation manuelle</h3>

                            {message && <div className="alert alert-success d-flex align-items-center gap-2">✓ {message}</div>}
                            {error && <div className="alert alert-danger d-flex align-items-center gap-2">✕ {error}</div>}

                            <form onSubmit={handleScanSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Token détecté</label>
                                    <input
                                        type="text"
                                        className="form-control neo-input p-3"
                                        style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="Le token apparaîtra ici..."
                                        required
                                    />
                                    <div className="form-text mt-2">
                                        Lieu détecté : <strong>{coords.latitude ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Recherche GPS...'}</strong>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-warning w-100 py-3 fw-bold text-uppercase shadow">
                                    Valider le pointage maintenant
                                </button>
                            </form>

                            <hr className="my-4" />

                            <div className="alert alert-secondary border-0 p-3" style={{ fontSize: '0.85rem' }}>
                                <strong>Note pédagogique :</strong> Si le scan échoue à cause de la luminosité,
                                vous pouvez copier-coller le token manuellement. Identité détectée : <strong>{user.prenom} {user.nom}</strong>.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default Scanner;
