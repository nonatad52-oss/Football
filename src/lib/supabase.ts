import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // ou anon_key dependendo das suas políticas

export const supabase = createClient(supabaseUrl, supabaseKey)
