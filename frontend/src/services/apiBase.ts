// Kept separate so Jest can mock it (import.meta is not valid under babel-jest CJS).
export function getApiBase(): string {
  return import.meta.env.DEV ? '/api' : window.location.origin + '/prod';
}
