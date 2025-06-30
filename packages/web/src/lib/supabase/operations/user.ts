import { SupabaseClient } from "@supabase/supabase-js";
import { Database, TablesInsert } from "@/database.types";
import { User } from "@/lib/supabase/tables";
import { RecordResponse } from "@/operations/types/RecordResponse";

enum VerificationSource {
  ACCOUNT_SCORE,
  LENS_REPUTATION,
}

const fetchUserById = async (
  supabase: SupabaseClient<Database>,
  userId: number,
): Promise<RecordResponse<User | null>> => supabase.from("user").select().eq("id", userId).maybeSingle();

const fetchUserByAccountAddress = async (
  supabase: SupabaseClient<Database>,
  accountAddress: string,
): Promise<RecordResponse<User | null>> =>
  supabase.from("user").select().ilike("account", accountAddress).maybeSingle();

const createUser = async (
  supabase: SupabaseClient<Database>,
  accountAddress: string,
  verificationSource: VerificationSource,
): Promise<RecordResponse<User>> =>
  supabase
    .from("user")
    .insert({ account: accountAddress, verification_source: verificationSource } satisfies TablesInsert<"user">)
    .select()
    .single();

export { fetchUserByAccountAddress, fetchUserById, createUser, VerificationSource };
