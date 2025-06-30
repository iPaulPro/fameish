import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../../../database.types";
import { SupabaseClient } from "@supabase/supabase-js";

export const createSupabaseClient = (): SupabaseClient<Database> =>
  createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
