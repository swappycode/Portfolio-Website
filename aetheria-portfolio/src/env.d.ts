// Environment type definitions for Vite
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}