const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.radhuerp.site/api';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export async function getCSRFToken() {
  let token = getCookie('csrftoken');
  if (!token) {
    // Fetch from backend to initialize CSRF cookie
    try {
      await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' });
      token = getCookie('csrftoken');
    } catch (e) {}
  }
  return token || '';
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const method = options.method || 'GET';
  
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRFToken'] = await getCSRFToken();
  }

  const config = {
    credentials: 'include',
    cache: 'no-store',
    ...options,
    headers,
    method,
  };
  
  const res = await fetch(url, config);
  
  if (res.status === 403 || res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // If 403 because CSRF or unauthenticated
      if (res.status === 401) {
        window.location.href = '/login';
        return null;
      }
    }
  }
  
  return res;
}

export async function apiGet(endpoint) {
  try {
    const res = await apiFetch(endpoint);
    if (!res) return null;
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error('API GET error:', e);
    return null;
  }
}

export async function apiPost(endpoint, data) {
  try {
    const isFormData = data instanceof FormData;
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res) return null;
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    console.error('API POST error:', e);
    return null;
  }
}

export async function apiUpload(endpoint, formData) {
  try {
    const csrfToken = await getCSRFToken();
    const url = `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });

    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    console.error('API Upload error:', e);
    return null;
  }
}

export async function apiDelete(endpoint) {
  try {
    const res = await apiFetch(endpoint, {
      method: 'DELETE',
    });
    if (!res) return null;
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    console.error('API DELETE error:', e);
    return null;
  }
}

export async function apiPatch(endpoint, data) {
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res) return null;
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    console.error('API PATCH error:', e);
    return null;
  }
}

export async function apiPut(endpoint, data) {
  try {
    const res = await apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res) return null;
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    console.error('API PUT error:', e);
    return null;
  }
}
