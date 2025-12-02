const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log("\n--- MEMERIKSA .env DI supabaseClient.js ---");

// Kita cek apakah variabelnya ada
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? (process.env.SUPABASE_URL.substring(0, 15) + "...") : "!!! KOSONG !!!");
console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? (process.env.SUPABASE_SERVICE_KEY.substring(0, 6) + "...") : "!!! KOSONG !!!");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("--- FATAL ERROR: SUPABASE_URL atau SUPABASE_SERVICE_KEY tidak ditemukan di .env ---");
  console.error("Pastikan file .env Anda di folder surat-app-server sudah benar dan berisi kedua variabel tersebut.");
  process.exit(1); // Paksa keluar agar nodemon melihat error
}

console.log("--- Variabel .env LENGKAP. Mencoba createClient... ---");

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("--- createClient SUKSES ---");

module.exports = supabase;