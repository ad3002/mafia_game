/// <reference types="next" />
/// <reference types="next/navigation-types/compat/navigation" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}