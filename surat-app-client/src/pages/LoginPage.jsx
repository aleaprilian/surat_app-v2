import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useNavigate } from 'react-router-dom';

// --- 1. IMPORT GAMBAR (PENTING) ---
// Pastikan logoLPPM.jpeg dan unri.jpeg ada di folder src/assets/
import logoLPPM from '../assets/logo.png'; 
import gedungUnri from '../assets/unri.png'; 

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false); 
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/'); 
    };
    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'http://localhost:5173' }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          navigate('/');
        } else {
          setMessage("Pendaftaran berhasil! Silakan login.");
          setIsRegister(false); 
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      
      <div className="flex flex-1">
        
        {/* KIRI: Form Login */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 md:px-24 relative">
          
          {/* Logo */}
          <div className="absolute top-8 left-8 md:left-12">
             {/* --- 2. GUNAKAN IMPORT LOGO --- */}
             <img 
               src={logoLPPM} 
               alt="Logo LPPM UNRI" 
               className="h-16 object-contain"
             />
          </div>

          <div className="mt-24 md:mt-0 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-black leading-tight tracking-tight mb-2">
              SELAMAT DATANG <br/>
              DI PORTAL LAYANAN PENGAJUAN <br/>
              SURAT KAMPUS
            </h1>
            <p className="text-gray-500 mb-8 text-sm">
              {isRegister ? 'Buat akun baru untuk memulai.' : 'Silakan login untuk melanjutkan.'}
            </p>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-bold">{error}</div>}
            {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm font-bold">{message}</div>}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[#FF0000] hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg shadow-md transition duration-200 text-lg mb-6 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.48 10.92v3.28h7.88c-.3 1.6-2.5 6.36-8.36 6.36-5.23 0-9.6-4.58-9.6-10.21 0-5.63 4.37-10.21 9.6-10.21 3.31 0 5.91 1.56 7.81 3.26l2.41-2.41C19.91 1.58 16.66 0 12.48 0 5.59 0 0 5.59 0 12.48s5.59 12.48 12.48 12.48c6.44 0 11.5-4.77 11.5-11.5 0-.98-.1-1.72-.22-2.53h-11.28z" />
              </svg>
              {loading ? 'Memproses...' : 'Login dengan Akun Google'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span 
                className="flex-shrink-0 mx-4 text-gray-600 text-xs font-bold uppercase cursor-pointer hover:text-black select-none"
                onClick={() => setShowEmailForm(!showEmailForm)}
              >
                {showEmailForm ? 'Tutup Form Email' : 'KLIK DISINI UNTUK LOGIN VIA EMAIL & PASSWORD'}
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {showEmailForm && (
              <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200 animate-fade-in-down text-left">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" required
                      className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-red-500 focus:outline-none"
                      placeholder="email@unri.ac.id"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      type="password" required
                      className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-red-500 focus:outline-none"
                      placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" disabled={loading}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded transition"
                  >
                    {loading ? 'Memproses...' : (isRegister ? 'Daftar Akun Baru' : 'Masuk Sekarang')}
                  </button>

                  <div className="text-center text-sm mt-3">
                    <button 
                      type="button"
                      onClick={() => { setIsRegister(!isRegister); setError(null); }}
                      className="text-blue-600 hover:underline"
                    >
                      {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-12 flex justify-center items-center text-red-600 font-bold cursor-pointer hover:underline">
              BUTUH BANTUAN? HUBUNGI ADMIN
            </div>
          </div>
        </div>

        {/* KANAN: Gambar Gedung */}
        <div className="hidden lg:block w-1/2 relative">
          {/* --- 3. GUNAKAN IMPORT GEDUNG --- */}
          <img 
            src={gedungUnri} // Menggunakan variabel import
            alt="Gedung Universitas Riau" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      </div>

      <footer className="bg-black text-white py-8 px-8 border-t-4 border-red-600 text-center md:text-left">
          <p className="text-sm text-gray-400">© 2025 LPPM Universitas Riau. All rights reserved.</p>
      </footer>
    </div>
  );
}