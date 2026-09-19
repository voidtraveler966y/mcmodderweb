import { createClient } from '@supabase/supabase-js';

// Supabase panelinden aldığın URL ve Anon Key'i buraya tırnak içinde yaz
const supabaseUrl = 'https://idmuacvqwhapqanrxdud.supabase.co';
const supabaseAnonKey = 'sb_publishable_TQfhr86K9NZoH8nMmqClOg_WyCBzlz9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);