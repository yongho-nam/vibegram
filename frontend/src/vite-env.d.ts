/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 비우면 Vite 프록시 기준 상대 경로 `/api/v1` 사용 (npm run dev 권장) */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
