import { useEffect } from "react";
import { OFFLINE_TESTING_MODE } from "../config";
import { initializeMockData } from "../data/mockApi";
import { initializeMockAuth } from "../data/mockAuth";

export function useOfflineInitialization() {
  useEffect(() => {
    if (OFFLINE_TESTING_MODE) {
      console.log("[OfflineMode] Initializing offline testing mode...");
      initializeMockData();
      initializeMockAuth();
    }
  }, []);
}

export default useOfflineInitialization;
