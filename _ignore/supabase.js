import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://fduhssklnkyvlgaimomv.supabase.co',
  'sb_publishable_1GRMOUcXnqbbUPLyHiXIlg_AChi-2s1'
)

export { supabase }
export const SUPABASE_URL = 'https://fduhssklnkyvlgaimomv.supabase.co'; // 실제 URL