const TOKEN_KEY = 'rr_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const tok = getToken();
  if (tok) headers.set('Authorization', `Bearer ${tok}`);

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    const err = new Error(
      typeof data.error === 'string' ? data.error : res.statusText
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data as T;
}
