/// <reference types="@sveltejs/kit" />

interface ImportMetaEnv {
  VITE_API_URL: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
