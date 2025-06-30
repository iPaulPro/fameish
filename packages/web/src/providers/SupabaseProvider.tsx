import { SupabaseClient } from "@supabase/supabase-js";
import { createContext, FC, ReactNode } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface SupabaseContextType {
  client: SupabaseClient;
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

const SupabaseProvider: FC<SupabaseProviderProps> = ({ children }) => {
  const supabaseClient = createSupabaseClient();

  return <SupabaseContext.Provider value={{ client: supabaseClient }}>{children}</SupabaseContext.Provider>;
};

export { SupabaseProvider };
