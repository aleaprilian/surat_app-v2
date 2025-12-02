import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App.jsx';

// const API_URL = 'http://localhost:5000/api/surat';
const API_URL = import.meta.env.VITE_API_URL + '/api/surat';

const FormSection = ({ title, children }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);
const FormInput = ({ label, name, placeholder, type = 'text', onChange, value, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} name={name} id={name}
      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      placeholder={placeholder} onChange={onChange} value={value} required={required}
    />
  </div>
);
const FormTextarea = ({ label, name, placeholder, onChange, value, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name} id={name} rows="3"
      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      placeholder={placeholder} onChange={onChange} value={value} required={required}
    />
  </div>
);
const FormSelect = ({ label, name, children, onChange, value, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name} name={name}
      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      onChange={onChange} value={value} required={required}
    >
      {children}
    </select>
  </div>
);


const templateOptions = [
  { key: "surat_izin_penelitian.docx", label: "Surat Izin Penelitian" },
  { key: "surat_izin_pengabdian.docx", label: "Surat Izin Pengabdian" },
  { key: "surat_tugas_penelitian.docx", label: "Surat Tugas Penelitian" },
  { key: "surat_tugas_pengabdian.docx", label: "Surat Tugas Pengabdian" },
  { key: "sptjm.docx", label: "SPTJM (Tanggung Jawab Mutlak)" },
];

export default function FormPage() {
  const { session } = useContext(AuthContext); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); 
  
  // --- STATE UNTUK SEMUA FIELD ---
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0].key);
  const [judul, setJudul] = useState('');
  const [sumber_pendanaan, setSumberPendanaan] = useState('');
  const [tahun, setTahun] = useState('');
  const [ketua_nama, setKetuaNama] = useState('');
  const [ketua_nip, setKetuaNip] = useState('');
  const [ketua_pangkat_gol, setKetuaPangkatGol] = useState('');
  const [ketua_prodi_fak, setKetuaProdiFak] = useState('');
  const [satuan_kerja, setSatuanKerja] = useState('');
  const [anggota, setAnggota] = useState([
    { no: '2', nama: '', nip: '', pangkat_golongan: '', prodi_fakultas: '' }
  ]);
  const [penerima, setPenerima] = useState('');
  const [lokasi_tujuan, setLokasiTujuan] = useState('');
  const [skema_pengabdian, setSkemaPengabdian] = useState('');
  const [skema, setSkema] = useState('');
  const [tanggal_mulai, setTanggalMulai] = useState('');
  const [tanggal_akhir, setTanggalAkhir] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [kabupaten_lokasi, setKabupatenLokasi] = useState('');
  const [tanggal_surat, setTanggalSurat] = useState('');
  const [peneliti_pelaksana, setPenelitiPelaksana] = useState('peneliti');
  const [dana, setDana] = useState('');
  const [dana_terbilang, setDanaTerbilang] = useState('');
  const [peneliti_pengabdian, setPenelitiPengabdian] = useState('penelitian');
  const [tim_peneliti, setTimPeneliti] = useState('peneliti');

  // --- Reset All State  ---
  const resetForm = () => {
    setJudul(''); setSumberPendanaan(''); setTahun('');
    setKetuaNama(''); setKetuaNip(''); setKetuaPangkatGol(''); setKetuaProdiFak(''); setSatuanKerja('');
    setAnggota([{ no: '2', nama: '', nip: '', pangkat_golongan: '', prodi_fakultas: '' }]);
    setPenerima(''); setLokasiTujuan(''); setSkemaPengabdian('');
    setSkema(''); setTanggalMulai(''); setTanggalAkhir(''); setLokasi(''); setKabupatenLokasi(''); setTanggalSurat('');
    setPenelitiPelaksana('peneliti'); setDana(''); setDanaTerbilang(''); setPenelitiPengabdian('peneliti'); setTimPeneliti('peneliti');

  };

  // --- (Fungsi anggota) ---
  const tambahAnggota = () => {
    setAnggota([
      ...anggota,
      { no: (anggota.length + 2).toString(), nama: '', nip: '', pangkat_golongan: '', prodi_fakultas: '' }
    ]);
  };
  const hapusAnggota = (index) => {
    if (anggota.length <= 1) return;
    const listAnggotaBaru = [...anggota];
    listAnggotaBaru.splice(index, 1);
    setAnggota(listAnggotaBaru.map((item, i) => ({ ...item, no: (i + 2).toString() })));
  };
  const handleAnggotaChange = (e, index) => {
    const { name, value } = e.target;
    const listAnggotaBaru = [...anggota];
    listAnggotaBaru[index][name] = value;
    setAnggota(listAnggotaBaru);
  };

  // --- handleSubmit Mengirim SEMUA state ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Kumpulkan SEMUA data dari state
    const submissionData = {
      template_key: selectedTemplate,
      judul, sumber_pendanaan, tahun,
      ketua_nama, ketua_nip, ketua_pangkat_gol, ketua_prodi_fak, satuan_kerja,
      anggota: anggota.filter(a => a.nama !== ''),
      penerima, lokasi_tujuan, skema_pengabdian,
      skema, tanggal_mulai, tanggal_akhir, lokasi, kabupaten_lokasi, tanggal_surat,
      peneliti_pelaksana, dana, dana_terbilang, peneliti_pengabdian, tim_peneliti,
    };

    try {
      const config = { headers: { Authorization: `Bearer ${session.access_token}` } };
      await axios.post(`${API_URL}/submit`, submissionData, config);

      setMessage({ type: 'success', text: 'Surat berhasil diajukan!' });
      resetForm(); // Panggil fungsi reset

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengajukan surat. Coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Formulir Pengajuan Surat</h1>
      
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        
        
        <FormSection title="Jenis Surat">
          <FormSelect
            label="Pilih Jenis Surat"
            name="template_key"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            required
          >
            {templateOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </FormSelect>
        </FormSection>
        
 

        {/* --- FORM UNTUK: Izin Penelitian & Izin Pengabdian --- */}
        {(selectedTemplate === "surat_izin_penelitian.docx" || selectedTemplate === "surat_izin_pengabdian.docx") && (
          <FormSection title="Data Tujuan Surat">
            <FormInput label="Yth. Penerima Surat" name="penerima" value={penerima} onChange={(e) => setPenerima(e.target.value)} placeholder="Contoh: Kepala Dinas..." required />
            <FormInput label="Lokasi Tujuan (Kota/Kab)" name="lokasi_tujuan" value={lokasi_tujuan} onChange={(e) => setLokasiTujuan(e.target.value)} placeholder="Pekanbaru" required />
          </FormSection>
        )}

        {/* --- FORM UNTUK: SEMUA KECUALI SPTJM --- */}
        {selectedTemplate !== "sptjm.docx" && (
          <FormSection title="Data Tim">
            <h4 className="font-medium text-gray-700">Ketua Tim</h4>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput label="Nama Ketua" name="ketua_nama" value={ketua_nama} onChange={(e) => setKetuaNama(e.target.value)} required />
              <FormInput label="NIP Ketua" name="ketua_nip" value={ketua_nip} onChange={(e) => setKetuaNip(e.target.value)} required />
              <FormInput label="Pangkat/Golongan" name="ketua_pangkat_gol" value={ketua_pangkat_gol} onChange={(e) => setKetuaPangkatGol(e.target.value)} />
              <FormInput label="Prodi/Fakultas" name="ketua_prodi_fak" value={ketua_prodi_fak} onChange={(e) => setKetuaProdiFak(e.target.value)} />
            </div>
            
            <h4 className="mt-6 font-medium text-gray-700">Anggota Tim</h4>
            {anggota.map((item, index) => (
              <div key={index} className="p-4 space-y-4 border rounded-md relative">
                {anggota.length > 1 && (
                   <button type="button" onClick={() => hapusAnggota(index)} className="absolute top-2 right-2 px-2 py-1 text-xs text-red-600 bg-red-100 rounded-full hover:bg-red-200">Hapus</button>
                )}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormInput label={`Nama Anggota ${index + 1}`} name="nama" value={item.nama} onChange={(e) => handleAnggotaChange(e, index)} />
                  <FormInput label="NIP" name="nip" value={item.nip} onChange={(e) => handleAnggotaChange(e, index)} />
                  <FormInput label="Pangkat/Golongan" name="pangkat_golongan" value={item.pangkat_golongan} onChange={(e) => handleAnggotaChange(e, index)} />
                  <FormInput label="Prodi/Fakultas" name="prodi_fakultas" value={item.prodi_fakultas} onChange={(e) => handleAnggotaChange(e, index)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={tambahAnggota} className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50">+ Tambah Anggota</button>
          </FormSection>
        )}
        
        {/* --- FORM UNTUK: SEMUA SURAT (JUDUL, SUMBER, TAHUN) --- */}
        <FormSection title="Data Kegiatan">
          <FormTextarea label="Judul Kegiatan" name="judul" value={judul} onChange={(e) => setJudul(e.target.value)} required />
          
          {/* Sumber & Tahun tidak ada di SPTJM */}
          {selectedTemplate !== "sptjm.docx" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput label="Sumber Pendanaan" name="sumber_pendanaan" value={sumber_pendanaan} onChange={(e) => setSumberPendanaan(e.target.value)} />
              <FormInput label="Tahun" name="tahun" value={tahun} onChange={(e) => setTahun(e.target.value)} />
            </div>
          )}
          {/* Tahun di SPTJM */}
          {selectedTemplate === "sptjm.docx" && (
            <FormInput label="Tahun" name="tahun" value={tahun} onChange={(e) => setTahun(e.target.value)} required />
          )}
        </FormSection>

        {/* --- FORM UNTUK: Izin Pengabdian & Surat Tugas (Skema) --- */}
        {(selectedTemplate === "surat_izin_pengabdian.docx" || selectedTemplate === "surat_tugas_penelitian.docx" || selectedTemplate === "surat_tugas_pengabdian.docx") && (
          <FormSection title="Detail Skema">
            {selectedTemplate === "surat_izin_pengabdian.docx" ? (
              <FormInput label="Skema Pengabdian" name="skema_pengabdian" value={skema_pengabdian} onChange={(e) => setSkemaPengabdian(e.target.value)} />
            ) : (
              <FormInput label="Skema" name="skema" value={skema} onChange={(e) => setSkema(e.target.value)} />
            )}
          </FormSection>
        )}

        {/* --- FORM UNTUK: Surat Tugas (Penelitian & Pengabdian) --- */}
        {(selectedTemplate === "surat_tugas_penelitian.docx" || selectedTemplate === "surat_tugas_pengabdian.docx") && (
          <FormSection title="Detail Tugas">
            <FormInput label="Tanggal Mulai" name="tanggal_mulai" type="date" value={tanggal_mulai} onChange={(e) => setTanggalMulai(e.target.value)} required />
            <FormInput label="Tanggal Akhir" name="tanggal_akhir" type="date" value={tanggal_akhir} onChange={(e) => setTanggalAkhir(e.target.value)} required />
            <FormInput label="Lokasi" name="lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} required />
            <FormInput label="Kabupaten Lokasi" name="kabupaten_lokasi" value={kabupaten_lokasi} onChange={(e) => setKabupatenLokasi(e.target.value)} required />
            <FormInput label="Tanggal Surat (di TTD)" name="tanggal_surat" type="date" value={tanggal_surat} onChange={(e) => setTanggalSurat(e.target.value)} />
          </FormSection>
        )}

        {/* --- FORM UNTUK: SPTJM --- */}
        {selectedTemplate === "sptjm.docx" && (
          <>
            <FormSection title="Data Ketua">
              <FormSelect label="Ketua Tim" name="peneliti_pelaksana" value={peneliti_pelaksana} onChange={(e) => setPenelitiPelaksana(e.target.value)}>
                <option value="peneliti">Peneliti</option>
                <option value="pelaksana">Pelaksana</option>
              </FormSelect>
              <FormInput label="Nama Ketua" name="ketua_nama" value={ketua_nama} onChange={(e) => setKetuaNama(e.target.value)} required />
              <FormInput label="NIP Ketua" name="ketua_nip" value={ketua_nip} onChange={(e) => setKetuaNip(e.target.value)} required />
              <FormInput label="Pangkat/Golongan" name="ketua_pangkat_gol" value={ketua_pangkat_gol} onChange={(e) => setKetuaPangkatGol(e.target.value)} />
              <FormInput label="Satuan Kerja" name="satuan_kerja" value={satuan_kerja} onChange={(e) => setSatuanKerja(e.target.value)} required />
            </FormSection>
            
            <FormSection title="Data Pendanaan (SPTJM)">
              <FormInput label="Dana Kegiatan (Rp)" name="dana" type="number" value={dana} onChange={(e) => setDana(e.target.value)} placeholder="Contoh: 5000000" required />
              <FormInput label="Dana Terbilang" name="dana_terbilang" value={dana_terbilang} onChange={(e) => setDanaTerbilang(e.target.value)} placeholder="Contoh: Lima Juta Rupiah" required />
            </FormSection>

            <FormSection title="Detail Pernyataan (SPTJM)">
              <FormSelect label="Jenis Kegiatan" name="peneliti_pengabdian" value={peneliti_pengabdian} onChange={(e) => setPenelitiPengabdian(e.target.value)}>
                <option value="penelitian">Penelitian</option>
                <option value="pengabdian">Pengabdian</option>
              </FormSelect>
              <FormSelect label="Tim" name="tim_peneliti" value={tim_peneliti} onChange={(e) => setTimPeneliti(e.target.value)}>
                <option value="peneliti">Tim Peneliti</option>
                <option value="pelaksana">Tim Pelaksana</option>
              </FormSelect>
            </FormSection>
          </>
        )}
        
        {/* --- Tombol Submit --- */}
        <div className="flex justify-end pt-4">
           <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
        </div>
      </form>
    </div>
  );
}