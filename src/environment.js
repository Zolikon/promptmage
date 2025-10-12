export const CONFIG = import.meta.env.production
  ? import.meta.env.VITE_APP_PROD_CONFIG
  : import.meta.env.VITE_APP_DEV_CONFIG;

export const BUILT_AT = import.meta.env.VITE_APP_BUILT_AT;
