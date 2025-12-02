import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Kunci 'anon' (publik) dari Project Settings > API di Supabase
const supabaseUrl = 'https://swpamplzocjiqrxebtbr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGFtcGx6b2NqaXFyeGVidGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzY4MzUsImV4cCI6MjA3ODE1MjgzNX0.fC4x-TIRmuub7YTlZhScmzzyFwIBCIg-Umns2I4k9bg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)