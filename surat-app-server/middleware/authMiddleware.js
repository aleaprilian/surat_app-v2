// surat-app-server/middleware/authMiddleware.js
const supabase = require('../supabaseClient');

const authMiddleware = async (req, res, next) => {
  console.log("\n--- A. MASUK KE AUTH MIDDLEWARE ---"); // JEBAKAN 1

  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.error("--- GAGAL: Tidak ada header 'Authorization' ---");
    return res.status(401).json({ msg: 'Tidak ada token, otorisasi ditolak' });
  }

  const token = authHeader.split(' ')[1]; // Ambil token dari "Bearer <token>"
  if (!token) {
    console.error("--- GAGAL: Format token salah ---");
    return res.status(401).json({ msg: 'Format token salah' });
  }

  console.log("--- B. TOKEN DITERIMA (6 karakter pertama):", token.substring(0, 6) + "..."); // JEBAKAN 2

  try {
    console.log("--- C. MENCOBA supabase.auth.getUser ---"); // JEBAKAN 3
    
    // Minta Supabase untuk memvalidasi token ini
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("--- GAGAL: Supabase error saat getUser", error.message);
      throw new Error(error.message);
    }

    if (!user) {
      console.error("--- GAGAL: Supabase tidak menemukan user dengan token ini ---");
      return res.status(401).json({ msg: 'User tidak ditemukan' });
    }
    
    console.log("--- D. SUKSES getUser! User:", user.email); // JEBAKAN 4
    
    // Tempelkan info user ke request untuk digunakan nanti
    req.user = user; 
    
    console.log("--- E. LANJUT KE RUTE (SELESAI MIDDLEWARE) ---"); // JEBAKAN 5
    next();

  } catch (err) {
    console.error("--- GAGAL: Error di dalam blok CATCH middleware ---", err.message);
    res.status(401).json({ msg: 'Token tidak valid' });
  }
};

module.exports = { authMiddleware };