/* frontend/src/App.jsx */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Context Providers (requis par le sujet § 8.2)
import { AuthProvider } from './context/AuthContext';
import { NotifProvider } from './context/NotifContext';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import PointageQR from './pages/PointageQR';
import Scanner from './pages/Scanner';
import Textbook from './pages/Textbook';
import Vacations from './pages/Vacations';
import PointageSelection from './pages/PointageSelection';
import AdminPanel from './pages/AdminPanel';
import Rapports from './pages/Rapports';

// Composants
import Navbar from './components/Navbar';
import RoleGate from './components/RoleGate';

// Configure Axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * PrivateRoute — HOC de protection des routes par rôle.
 * Redirige vers /login si non connecté, affiche un accès refusé si rôle non autorisé.
 * Requis par le sujet (§ 8.2).
 */
function PrivateRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (
    <RoleGate user={user} allowedRoles={allowedRoles}>
      {children}
    </RoleGate>
  );
}

/**
 * AppRoutes — Routes internes utilisant le AuthContext.
 */
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

        {/* Dashboard — accessible à tous les rôles connectés */}
        <Route path="/dashboard" element={
          user ? <Dashboard /> : <Navigate to="/login" />
        } />

        {/* Emploi du temps — tous sauf comptable */}
        <Route path="/schedule" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant', 'delegue', 'surveillant', 'etudiant']}>
            <Schedule />
          </PrivateRoute>
        } />

        {/* Pointage — admin, enseignant, surveillant */}
        <Route path="/pointage" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant', 'surveillant']}>
            <PointageSelection />
          </PrivateRoute>
        } />

        {/* QR Code — admin, enseignant, surveillant */}
        <Route path="/qr-code/:id" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant', 'surveillant']}>
            <PointageQR />
          </PrivateRoute>
        } />

        {/* Scanner — enseignant, admin */}
        <Route path="/scan" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant']}>
            <Scanner />
          </PrivateRoute>
        } />

        {/* Cahier de texte — delegue, enseignant, admin, surveillant */}
        <Route path="/textbook/:id" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant', 'delegue', 'surveillant']}>
            <Textbook />
          </PrivateRoute>
        } />

        {/* Vacations — admin, enseignant, surveillant, comptable */}
        <Route path="/vacations" element={
          <PrivateRoute allowedRoles={['admin', 'enseignant', 'surveillant', 'comptable']}>
            <Vacations />
          </PrivateRoute>
        } />

        {/* Administration — admin uniquement */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminPanel />
          </PrivateRoute>
        } />

        {/* Rapports — admin, surveillant, comptable */}
        <Route path="/rapports" element={
          <PrivateRoute allowedRoles={['admin', 'surveillant', 'comptable']}>
            <Rapports />
          </PrivateRoute>
        } />

        {/* Redirect */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotifProvider>
    </AuthProvider>
  );
}

export default App;
