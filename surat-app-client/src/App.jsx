import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FormPage from './pages/FormPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DaftarSuratPage from './pages/DaftarSuratPage.jsx';

export const AuthContext = createContext();

function App() {
  // --- 1. INISIALISASI STATE LANGSUNG DARI CACHE (ZERO LATENCY) ---
  // Kita baca localStorage SAAT INI JUGA, bukan nanti.
  const cachedRole = localStorage.getItem('user_role');
  
  // Jika ada cache, kita anggap loading selesai (false), jika tidak ada, loading (true)
  const [loading, setLoading] = useState(!cachedRole); 
  const [role, setRole] = useState(cachedRole); 
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Fungsi validasi ke server (Background Process)
    const validateSession = async () => {
      try {
        // Cek ke Supabase apakah sesi valid?
        const { data: { session: serverSession }, error } = await supabase.auth.getSession();
        
        if (error || !serverSession) {
          // Token mati/invalid -> Hapus semua & tendang ke login
          console.log("Sesi tidak valid, logout...");
          localStorage.removeItem('user_role');
          if (mounted) {
            setSession(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // Jika sesi valid, simpan sesi
        if (mounted) setSession(serverSession);

        // Cek apakah Role di database berubah?
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', serverSession.user.id)
          .single();

        const serverRole = profile?.role || 'user';

        // Jika role di server beda dengan cache, update tampilan
        if (mounted && serverRole !== cachedRole) {
           console.log("Update role baru:", serverRole);
           setRole(serverRole);
           localStorage.setItem('user_role', serverRole);
        }

      } catch (err) {
        console.error("Background check error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    validateSession();

    // Listener Realtime (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session);
          if (!session) {
            // Jika logout, hapus cache seketika
            setRole(null);
            localStorage.removeItem('user_role');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Tampilan Loading hanya muncul jika BENAR-BENAR tidak ada data di cache
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
         {/* Spinner kecil minimalis */}
         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, role }}>
      <BrowserRouter>
        <Routes>
          {/* Logika Routing: Cek Role, bukan Session saja */}
          {/* Kita gunakan 'role' sebagai penentu utama karena session mungkin belum terisi di detik pertama */}
          
          {!role ? (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route path="/" element={<Layout />}>
              {role === 'admin' ? (
                <>
                  <Route path="admin-dashboard" element={<AdminPage />} />
                  <Route index element={<Navigate to="/admin-dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
                </>
              ) : (
                <>
                  <Route path="form" element={<FormPage />} />
                  <Route path="daftar-surat" element={<DaftarSuratPage />} />
                  <Route index element={<Navigate to="/form" replace />} />
                  <Route path="*" element={<Navigate to="/form" replace />} />
                </>
              )}
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;