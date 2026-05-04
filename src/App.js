import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductosPage from './pages/ProductosPage';
import ClientesPage from './pages/ClientesPage';
import VentasPage from './pages/VentasPage';

function PrivateRoute({ children, session }) {
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando sistema…</span>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={
          <PrivateRoute session={session}>
            <Layout session={session}>
              <HomePage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/productos" element={
          <PrivateRoute session={session}>
            <Layout session={session}>
              <ProductosPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/clientes" element={
          <PrivateRoute session={session}>
            <Layout session={session}>
              <ClientesPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/ventas" element={
          <PrivateRoute session={session}>
            <Layout session={session}>
              <VentasPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
