import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('PROJECT_SUPABASE_URL')!;
  const SUPABASE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data, error } = await supabase.rpc('reset_global_pats');
    if (error) throw error;
    
    return new Response(JSON.stringify({ message: 'Global pats reset successfully!' }), { status: 200 });
  } catch (error) {
    console.error('Error resetting global pats:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
});
