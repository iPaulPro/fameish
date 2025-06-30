import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

const getUserCount = async (client: SupabaseClient<Database>): Promise<number> => {
  const { data, error } = await client.from("record_count").select().eq("table_name", "user").limit(1).single();
  if (error) {
    throw error;
  }
  return data.count;
};

export { getUserCount };
