import { createContext, useContext, type ReactNode } from "react";
import { usePriceFeed, type PriceFeedMap } from "../hooks/usePriceFeed";

const PriceFeedContext = createContext<PriceFeedMap>({});

export function PriceFeedProvider({ children }: { children: ReactNode }) {
  const feed = usePriceFeed();
  return <PriceFeedContext.Provider value={feed}>{children}</PriceFeedContext.Provider>;
}

export function useFeed(): PriceFeedMap {
  return useContext(PriceFeedContext);
}
