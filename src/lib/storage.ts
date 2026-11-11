export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(fallback))
      return (
        Array.isArray(value) && value.every((v) => typeof v === "string")
          ? [...new Set(value)]
          : fallback
      ) as T;
    return fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readStoredValue<T>(key:string,fallback:T,validate:(value:unknown)=>value is T):T{
  try{const raw=localStorage.getItem(key);if(!raw)return fallback;const value:unknown=JSON.parse(raw);return validate(value)?value:fallback;}catch{return fallback;}
}
