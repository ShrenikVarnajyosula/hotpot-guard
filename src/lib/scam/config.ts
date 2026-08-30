import { useEffect, useState } from "react";
import type { ApiConfig } from "./engine";

const KEY = "hotpot.api.config";

export const DEFAULT_CONFIG: ApiConfig = {
  provider: "groq",
  groqKey: "",
  openaiKey: "",
  chromaUrl: "",
  useLocalVectors: true,
};

export function loadConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useApiConfig() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const save = (next: ApiConfig) => {
    setConfig(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  return { config, save };
}
