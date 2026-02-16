/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_BUILT_AT: string;
  readonly VITE_APP_PROD_CONFIG: string;
  readonly VITE_APP_DEV_CONFIG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
