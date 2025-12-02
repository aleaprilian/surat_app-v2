import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../App.jsx';
import { supabase } from '../supabaseClient.js';
import { useSearchParams } from 'react-router-dom';

// const API_URL = 'http://localhost:5000/api/surat';
const API_URL = import.meta.env.VITE_API_URL + '/api/surat';

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
      {status === 'Rejected' ? 'Ditolak' : status}
    </span>
  );
};

export default function AdminPage() {
  const { session } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type');

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSurat = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      let query = supabase
        .from('surat')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType) {
        query = query.eq('template_key', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [session, filterType]);

  useEffect(() => {
    fetchSurat();
  }, [fetchSurat]);

  const filteredData = submissions.filter(item => 
    item.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ketua_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async (id, namaKetua) => {
    try {
      const res = await axios.get(`${API_URL}/generate/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DRAFT-${namaKetua}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) { alert('Gagal generate draft.'); }
  };

  const handleUploadHasil = async (e, suratId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(suratId);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('surat-hasil').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('surat-hasil').getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from('surat').update({ file_hasil: publicUrl, status: 'Selesai' }).eq('id', suratId);
      if (dbErr) throw dbErr;
      fetchSurat();
    } catch (err) { alert('Upload gagal: ' + err.message); } 
    finally { setUploading(null); }
  };

  const handleReject = async (id) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin MENGHAPUS (Menolak) surat ini?\n\nStatus surat akan berubah menjadi 'Ditolak' di tampilan User.");
    
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('surat')
          .update({ status: 'Rejected' })
          .eq('id', id);

        if (error) throw error;

        alert("Surat berhasil ditolak/dihapus.");
        fetchSurat();
      } catch (err) {
        alert("Gagal menghapus surat: " + err.message);
      }
    }
  };

  const getPageTitle = () => {
    if (!filterType) return "Dashboard Semua Surat";
    const readableName = filterType.replace(/_/g, ' ').replace('.docx', '');
    return `Data ${readableName.replace(/\b\w/g, l => l.toUpperCase())}`;
  };

  return (
    <div className="space-y-8">
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">{getPageTitle()}</h1>
          <p className="text-gray-400 mt-1">Kelola dan verifikasi surat masuk.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center bg-gray-50 px-5 py-3 rounded-xl border border-gray-200">
            <div className="mr-4 text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Total Surat</p>
                <p className="text-2xl font-black text-gray-800">{filteredData.length}</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
               <ion-icon name="mail-unread" class="text-2xl text-blue-600"></ion-icon>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="relative w-full max-w-md">
              <ion-icon name="search-outline" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></ion-icon>
              <input 
                type="text" 
                placeholder="Cari Perihal atau Nama..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           {/* TOMBOL REFRESH (ICON ONLY) */}
           <button 
              onClick={fetchSurat} 
              disabled={loading}
              className="ml-4 p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm hover:text-blue-600 hover:border-blue-200 transition focus:outline-none active:bg-gray-50"
              title="Refresh Data"
            >
              <ion-icon 
                name="refresh-outline" 
                class={`text-xl block ${loading ? 'animate-spin text-blue-600' : ''}`}
              ></ion-icon>
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-4 w-10"><input type="checkbox" className="rounded text-blue-600 border-gray-300" /></th>
                <th className="p-6">Perihal</th>
                <th className="p-6">Pemohon</th>
                <th className="p-6">Tanggal</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
              
              {loading && <tr><td colSpan="6" className="p-10 text-center text-gray-400">Memuat data...</td></tr>}
              {!loading && filteredData.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-gray-400">Tidak ada surat ditemukan.</td></tr>}

              {!loading && filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 pl-4"><input type="checkbox" className="rounded text-blue-600 border-gray-300" /></td>
                  
                  <td className="p-6 font-medium text-gray-900">
                    <div className="line-clamp-2 max-w-xs">{item.judul || '(Tanpa Judul)'}</div>
                    <div className="text-xs text-gray-400 mt-1 font-normal">{item.template_key ? item.template_key.replace('.docx', '').replace(/_/g, ' ') : 'Dokumen Umum'}</div>
                  </td>

                  <td className="p-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-xs font-bold text-gray-500">
                        {item.ketua_nama ? item.ketua_nama.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{item.ketua_nama}</div>
                        <div className="text-xs text-gray-400">{item.ketua_nip}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-6 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  <td className="p-6">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-80 group-hover:opacity-100 transition">
                      
                      <button 
                        onClick={() => handleGenerate(item.id, item.ketua_nama)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition"
                        title="Download Draft"
                      >
                        <ion-icon name="document-text-outline" class="text-lg"></ion-icon>
                      </button>

                      {item.file_hasil ? (
                        <a href={item.file_hasil} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-green-600 hover:bg-green-100 border border-transparent hover:border-green-200 transition">
                           <ion-icon name="eye-outline" class="text-lg"></ion-icon>
                        </a>
                      ) : (
                        <div className="relative">
                           {uploading === item.id ? (
                              <div className="p-2"><div className="animate-spin h-4 w-4 border-2 border-gray-400 rounded-full border-t-transparent"></div></div>
                           ) : (
                             <>
                               <input type="file" id={`up-${item.id}`} className="hidden" accept="*" onChange={(e) => handleUploadHasil(e, item.id)} />
                               <label htmlFor={`up-${item.id}`} className="p-2 rounded-lg text-purple-600 hover:bg-purple-100 border border-transparent hover:border-purple-200 transition cursor-pointer block">
                                 <ion-icon name="cloud-upload-outline" class="text-lg"></ion-icon>
                               </label>
                             </>
                           )}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleReject(item.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition"
                        title="Tolak / Hapus Surat"
                      >
                        <ion-icon name="trash-outline" class="text-lg"></ion-icon>
                      </button>

                    </div>
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