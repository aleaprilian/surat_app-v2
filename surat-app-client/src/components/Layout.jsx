import React, { useContext, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { AuthContext } from '../App.jsx';

// --- PASTIKAN NAMA FILE SESUAI ---
// Cek apakah .jpeg, .jpg, atau .png di folder src/assets/
import logoLPPM from '../assets/logo.png'; 

export default function Layout() {
  const location = useLocation();
  const { role } = useContext(AuthContext);
  const searchParams = new URLSearchParams(location.search);
  const currentType = searchParams.get('type');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userLinks = [
    { name: 'Buat Pengajuan Baru', path: '/form', icon: 'add-circle-outline', type: 'form' },
    { name: 'Semua Surat Saya', path: '/daftar-surat', icon: 'folder-open-outline', type: null },
    { name: 'Surat Izin Penelitian', path: '/daftar-surat?type=surat_izin_penelitian.docx', icon: 'document-text-outline', type: 'surat_izin_penelitian.docx' },
    { name: 'Surat Izin Pengabdian', path: '/daftar-surat?type=surat_izin_pengabdian.docx', icon: 'document-text-outline', type: 'surat_izin_pengabdian.docx' },
    { name: 'Surat Tugas Penelitian', path: '/daftar-surat?type=surat_tugas_penelitian.docx', icon: 'briefcase-outline', type: 'surat_tugas_penelitian.docx' },
    { name: 'Surat Tugas Pengabdian', path: '/daftar-surat?type=surat_tugas_pengabdian.docx', icon: 'briefcase-outline', type: 'surat_tugas_pengabdian.docx' },
    { name: 'SPTJM', path: '/daftar-surat?type=sptjm.docx', icon: 'shield-checkmark-outline', type: 'sptjm.docx' },
  ];

  const adminLinks = [
    { name: 'Dashboard (Semua)', path: '/admin-dashboard', icon: 'grid-outline', type: null },
    { name: 'Surat Izin Penelitian', path: '/admin-dashboard?type=surat_izin_penelitian.docx', icon: 'document-text-outline', type: 'surat_izin_penelitian.docx' },
    { name: 'Surat Izin Pengabdian', path: '/admin-dashboard?type=surat_izin_pengabdian.docx', icon: 'document-text-outline', type: 'surat_izin_pengabdian.docx' },
    { name: 'Surat Tugas Penelitian', path: '/admin-dashboard?type=surat_tugas_penelitian.docx', icon: 'briefcase-outline', type: 'surat_tugas_penelitian.docx' },
    { name: 'Surat Tugas Pengabdian', path: '/admin-dashboard?type=surat_tugas_pengabdian.docx', icon: 'briefcase-outline', type: 'surat_tugas_pengabdian.docx' },
    { name: 'SPTJM', path: '/admin-dashboard?type=sptjm.docx', icon: 'shield-checkmark-outline', type: 'sptjm.docx' },
  ];

  const navLinks = role === 'admin' ? adminLinks : userLinks;

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    try { supabase.auth.signOut(); } catch (e) {}
    setTimeout(() => { window.location.href = '/login'; }, 100);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        ></div>
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-72 bg-white shadow-xl lg:shadow-sm border-r border-gray-100 h-full flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        <div className="flex flex-col items-center justify-center h-32 border-b border-dashed border-gray-200 p-6 shrink-0 relative">
           <button 
             onClick={closeMobileMenu}
             className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 lg:hidden"
           >
             <ion-icon name="close-outline" class="text-2xl"></ion-icon>
           </button>

           {/* PANGGIL VARIABEL IMPORT DI SINI */}
           <img src={logoLPPM} alt="LPPM Logo" className="h-12 object-contain mb-2" />
           
           <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase text-center">
             {role === 'admin' ? 'Administrator Panel' : 'Portal Pengguna'}
           </span>
        </div>

        <nav className="flex-grow mt-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            let isActive = false;
            if (link.type === 'form') isActive = location.pathname === '/form';
            else {
                const pathBase = role === 'admin' ? '/admin-dashboard' : '/daftar-surat';
                isActive = location.pathname === pathBase && (link.type === null ? !currentType : currentType === link.type);
            }
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={closeMobileMenu} 
                className={`
                  flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium 
                  ${isActive ? 'bg-gray-100 text-gray-900 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'} 
                  ${link.type === 'form' ? 'mb-4 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100' : ''}
                `}
              >
                <ion-icon name={link.icon} class={`text-lg mr-3 ${isActive ? 'text-gray-800' : (link.type === 'form' ? 'text-blue-600' : 'text-gray-400')}`}></ion-icon>
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-100 shrink-0">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <ion-icon name="log-out-outline" class="text-lg mr-3"></ion-icon> Keluar
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center bg-[#FDFBF7] shrink-0 border-b lg:border-none border-gray-200">
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-md focus:outline-none"
           >
             <ion-icon name="menu-outline" class="text-3xl"></ion-icon>
           </button>

           <h2 className="text-lg lg:text-xl font-bold text-gray-800 truncate ml-2 lg:ml-0">
             <span className="hidden lg:inline">Sistem Informasi LPPM Universitas Riau</span>
             <span className="lg:hidden">e-SURAT LPPM</span>
           </h2>
           
           <div className="flex items-center space-x-3 bg-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full shadow-sm border border-gray-100">
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gray-200 overflow-hidden">
                 <img src={`https://ui-avatars.com/api/?name=${role}&background=random`} alt="Avatar" />
              </div>
              <span className="text-xs lg:text-sm font-semibold text-gray-700 capitalize hidden sm:inline">{role}</span>
           </div>
        </header>
        
        <main className="flex-1 overflow-y-auto px-4 lg:px-10 pb-6">
          <div className="min-h-[80vh]"><Outlet /></div>
          <footer className="mt-10 py-6 border-t border-gray-200 text-center">
            <p className="text-xs lg:text-sm text-gray-500 font-medium">&copy; {new Date().getFullYear()} LPPM Universitas Riau.</p>
            <p className="text-xs lg:text-sm text-gray-500 font-medium">Made By S1 Teknik Informatika B'24.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}