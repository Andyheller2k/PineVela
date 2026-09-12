export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const currentToken = 
    localStorage.getItem('pinevela_session_token') || 
    localStorage.getItem('token') || 
    localStorage.getItem('pinevela_auth_token') || 
    'token_admin_andyheller2k';

  const headers = {
    'Content-Type': 'application/json',
    ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      if (res.status === 401) {
        return [];
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.warn("API fetch warning:", err);
    throw err;
  }
}
