import { createClient } from "@supabase/supabase-js";
import { Database } from "../../database.types";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or key is not defined.");
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
