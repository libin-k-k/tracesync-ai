function requiredEnv(name: string, value: string | undefined, fallback: string): string {
  const resolved = (value ?? fallback).trim();
  if (!resolved) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return resolved.replace(/\/$/, '');
}

export const env = {
  apiUrl: requiredEnv(
    'VITE_API_URL',
    import.meta.env.VITE_API_URL,
    'http://localhost:8080',
  ),
  nestjsUrl: requiredEnv(
    'VITE_NESTJS_URL',
    import.meta.env.VITE_NESTJS_URL,
    'http://localhost:3030',
  ),
} as const;
