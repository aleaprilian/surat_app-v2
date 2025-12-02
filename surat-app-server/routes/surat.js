const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authMiddleware } = require('../middleware/authMiddleware');

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const axios = require('axios');

// --- 1. API SUBMIT (Menyimpan Data) ---
// Digunakan oleh User untuk mengajukan surat
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    // Pisahkan data anggota dari data surat utama
    const { anggota, ...suratData } = req.body; 

    // Simpan data surat ke tabel 'surat'
    const { data: newSurat, error: suratError } = await supabase
      .from('surat')
      .insert({
        ...suratData,
        user_id: req.user.id 
      })
      .select()
      .single(); 

    if (suratError) throw suratError;

    // Simpan data anggota (jika ada)
    if (anggota && anggota.length > 0) {
      const anggotaData = anggota.map(a => ({
        ...a,
        surat_id: newSurat.id 
      }));
      const { error: anggotaError } = await supabase
        .from('anggota')
        .insert(anggotaData);
      
      if (anggotaError) throw anggotaError;
    }
    res.status(201).json(newSurat);
  } catch (err) {
     console.error("Error Submit:", err);
     res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- 2. API LIST SURAT SAYA ---
// Digunakan di Dashboard User
router.get('/my-surat', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('surat')
      .select('*')
      .eq('user_id', req.user.id) // Hanya ambil surat milik user yang login
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- 3. API GENERATE DOKUMEN (Admin & User) ---
// PERBAIKAN UTAMA ADA DI SINI
router.get('/generate/:id', authMiddleware, async (req, res) => {
  try {
    // A. Ambil data dari Database
    const { data: suratData, error: suratError } = await supabase
      .from('surat')
      .select('*, anggota(*)') 
      .eq('id', req.params.id)
      // .eq('user_id', req.user.id) <--- BARIS INI SUDAH DIHAPUS
      // Kita menghapusnya agar Admin bisa men-generate surat milik user lain.
      // Keamanan akses sekarang ditangani oleh SQL Policy (RLS) di Supabase.
      .single();

    if (suratError) throw suratError;
    if (!suratData) return res.status(404).json({ msg: 'Surat tidak ditemukan' });

    // Fallback: Jika data lama tidak punya 'template_key', pakai default
    if (!suratData.template_key) {
        suratData.template_key = "surat_izin_penelitian.docx"; 
    }

    // B. Download Template dari Supabase Storage
    const baseStorageUrl = process.env.SUPABASE_STORAGE_BASE_URL;
    const templateFilename = suratData.template_key;
    const templateUrl = `${baseStorageUrl}/${templateFilename}`;

    console.log(`Mengunduh template: ${templateFilename}`);

    // Download file template sebagai buffer
    const response = await axios.get(templateUrl, { responseType: 'arraybuffer' });
    const zip = new PizZip(response.data);
    
    // Konfigurasi Docxtemplater (nullGetter agar tidak error jika ada data kosong)
    const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true,
        nullGetter: () => "" 
    });

    // C. Siapkan Data Render (Mapping Placeholder)
    const today = new Date();
    const formattedDate = `${today.getDate()} ${today.toLocaleString('id-ID', { month: 'long' })} ${today.getFullYear()}`;
    
    // Mapping Data Anggota (Agar kompatibel dengan berbagai template)
    let anggotaData = [];
    if (suratData.anggota) {
        anggotaData = suratData.anggota.map(a => ({
          ...a,
          // Sediakan kedua variasi nama variabel agar aman
          pangkat_gol: a.pangkat_golongan, 
          pangkat_golongan: a.pangkat_golongan 
        }));
    }

    // Object Data Utama untuk dimasukkan ke Word
    const dataToRender = {
        ...suratData, // Masukkan semua data mentah dulu
        
        // Override/Tambah field khusus
        anggota: anggotaData,
        
        // FORMAT UMUM
        'tanggal_surat': suratData.tanggal_surat || formattedDate,
        'tanggal mulai': suratData.tanggal_mulai,
        
        // DATA SPESIFIK (Mapping nama field database -> nama placeholder di docx)
        'nama_ketua': suratData.ketua_nama,
        'nip_ketua': suratData.ketua_nip,
        'pangkat_gol_ketua': suratData.ketua_pangkat_gol,
        
        'dana': suratData.dana,
        'dana_terbilang': suratData.dana_terbilang,
        'satuan_kerja': suratData.satuan_kerja,
        
        'peneliti_pelaksana': suratData.peneliti_pelaksana, 
        'peneliti_pengabdian': suratData.peneliti_pengabdian, 
        'tim_peneliti': suratData.tim_peneliti,

        'nama kota/kabupaten/lokasi tempat tujuan': suratData.lokasi_tujuan,
        'sumber': suratData.sumber_pendanaan,
        'skema_pengabdian': suratData.skema_pengabdian
    };

    // D. Render Dokumen
    doc.render(dataToRender);

    // E. Kirim File Hasil ke Client
    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    
    // Bersihkan nama file dari karakter aneh
    const safeFilename = (suratData.ketua_nama || 'Dokumen').replace(/[^a-z0-9]/gi, '_');
    
    res.setHeader('Content-Disposition', `attachment; filename=Surat-${safeFilename}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buf);

  } catch (err) {
    console.error('Error Generate:', err.message);
    
    // Cek apakah error dari template (misal: tag salah)
    if (err.properties && err.properties.errors) {
        const errorMsg = err.properties.errors.map(e => e.message).join(', ');
        return res.status(500).json({ msg: 'Template Error', error: errorMsg });
    }
    
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;