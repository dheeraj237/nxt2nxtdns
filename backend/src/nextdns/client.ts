const BASE_URL = 'https://api.nextdns.io';

export class NextDnsApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public path: string,
  ) {
    super(message);
  }
}

export async function nextDnsFetch<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.errors?.[0]?.code ?? message;
    } catch {
      // ignore body parse failure
    }
    throw new NextDnsApiError(res.status, message, path);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return (body?.data ?? body) as T;
}
