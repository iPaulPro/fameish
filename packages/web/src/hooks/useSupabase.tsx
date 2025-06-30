import { useContext } from "react";
import { SupabaseContext, SupabaseContextType } from "@/src/providers/SupabaseProvider";

const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

export { useSupabase };
