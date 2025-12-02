import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../App.jsx';
import { supabase } from '../supabaseClient.js';
import { useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL + '/api/surat';

// --- Helper Status Badge ---
const StatusBadge = ({ status }) => {
  let style = "bg-gray-100 text-gray-600";
  let icon = "ellipse";

  if (status === 'Selesai') {
    style = "bg-green-100 text-green-700 border border-green-200";
    icon = "checkmark-circle";
  } else if (status === 'Pending') {
    style = "bg-yellow-50 text-yellow-700 border border-yellow-200";
    icon = "time";
  } else if (status === 'Rejected') {
    style = "bg-red-50 text-red-700 border border-red-200";
    icon = "close-circle";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max ${style}`}>
      <ion-icon name={icon} class="mr-1.5 text-sm"></ion-icon>
      {status}
    </span>
  );
};

export default function DaftarSuratPage() {
  const { session } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type'); // Ambil filter dari URL

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- FETCH DATA ---
  const fetchSurat = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Base Query: Ambil surat milik user ini
      let query = supabase
        .from('surat')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      // Filter Tambahan: Jika ada tipe surat di URL
      if (filterType) {
        query = query.eq('template_key', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetch user data:", err);
    } finally {
      setLoading(false);
    }
  }, [session, filterType]);

  useEffect(() => {
    fetchSurat();
  }, [fetchSurat]);

  // --- FILTER PENCARIAN LOKAL ---
  const filteredData = submissions.filter(item => 
    item.judul?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Judul Halaman Dinamis
  const getPageTitle = () => {
    if (!filterType) return "Semua Surat Saya";
    // Ubah "surat_izin_penelitian.docx" -> "Arsip Surat Izin Penelitian"
    const readableName = filterType.replace(/_/g, ' ').replace('.docx', '');
    return `Arsip ${readableName.replace(/\b\w/g, l => l.toUpperCase())}`;
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- CARD HEADER --- */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">{getPageTitle()}</h1>
          <p className="text-gray-400 mt-1">Riwayat pengajuan dan status verifikasi.</p>
        </div>
        
        {/* Statistik Sederhana */}
        <div className="mt-4 md:mt-0 flex items-center bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
            <div className="mr-4 text-right">
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wide">Total Pengajuan</p>
                <p className="text-2xl font-black text-blue-800">{filteredData.length}</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
               <ion-icon name="folder-open" class="text-2xl"></ion-icon>
            </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="relative w-full max-w-md">
              <ion-icon name="search-outline" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></ion-icon>
              <input 
                type="text" 
                placeholder="Cari judul surat..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <button 
              onClick={fetchSurat} 
              className="ml-4 p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
              title="Refresh"
            >
              <ion-icon name="refresh" class={`text-lg ${loading ? 'animate-spin' : ''}`}></ion-icon>
           </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-6">Detail Surat</th>
                {!filterType && <th className="p-6">Jenis Dokumen</th>}
                <th className="p-6">Tanggal Pengajuan</th>
                <th className="p-6">Status Verifikasi</th>
                <th className="p-6 text-right">Dokumen Hasil</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
              
              {/* 1. Loading State */}
              {loading && (
                 <tr><td colSpan="5" className="p-10 text-center text-gray-400">Memuat data...</td></tr>
              )}

              {/* 2. Empty State */}
              {!loading && filteredData.length === 0 && (
                 <tr>
                   <td colSpan="5" className="p-12 text-center">
                     <div className="flex flex-col items-center justify-center text-gray-300">
                        <ion-icon name="file-tray-outline" class="text-5xl mb-3"></ion-icon>
                        <p className="text-gray-500">Tidak ada surat ditemukan.</p>
                     </div>
                   </td>
                 </tr>
              )}

              {/* 3. Data Rows */}
              {!loading && filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                  
                  {/* Judul */}
                  <td className="p-6 font-medium text-gray-900">
                    <div className="line-clamp-2 max-w-xs" title={item.judul}>{item.judul || '(Tanpa Judul)'}</div>
                  </td>

                  {/* Jenis (Jika tidak difilter) */}
                  {!filterType && (
                    <td className="p-6">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">
                        {item.template_key ? item.template_key.replace('.docx', '').replace(/_/g, ' ') : 'Dokumen Umum'}
                        </span>
                    </td>
                  )}

                  {/* Tanggal */}
                  <td className="p-6 whitespace-nowrap">
                    <div className="flex items-center">
                       <ion-icon name="calendar-outline" class="mr-2 text-gray-400"></ion-icon>
                       {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-6">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Aksi Download */}
                  <td className="p-6 text-right">
                    {item.status === 'Selesai' && item.file_hasil ? (
                      <a 
                        href={item.file_hasil} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-md transition transform hover:-translate-y-0.5"
                      >
                        <ion-icon name="cloud-download-outline" class="mr-2 text-lg"></ion-icon>
                        Unduh Surat
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs italic flex items-center justify-end">
                        <ion-icon name="hourglass-outline" class="mr-1"></ion-icon> Menunggu
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}