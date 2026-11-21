const getBaseUrl = (): string =>
  process.env.API_URL ?? 'http://127.0.0.1:8000';

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const targetUrl = new URL(url, getBaseUrl()).toString();
  const response = await fetch(targetUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(
      typeof body?.detail === 'string'
        ? body.detail
        : `Error HTTP ${response.status}`,
    );
  }

  return {
    data: body,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  } as T;
};
