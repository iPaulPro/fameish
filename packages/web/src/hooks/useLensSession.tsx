import { useContext } from "react";
import { LensSessionContext, LensSessionContextType } from "@/src/providers/LensSessionProvider";

const useLensSession = (): LensSessionContextType => {
  const context = useContext(LensSessionContext);
  if (!context) {
    throw new Error("useLens must be used within a LensSessionProvider");
  }
  return context;
};

export { useLensSession };
