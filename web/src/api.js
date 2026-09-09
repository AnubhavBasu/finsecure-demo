const BASE_URL = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the session_id cookie across the 5173 → 4000 origin boundary
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  verifyLoginOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  getAccount: (id) => request(`/accounts/${id}`),
  transfer: (payload) => request('/transfers', { method: 'POST', body: JSON.stringify(payload) }),
  verifyTransferOtp: (payload) => request('/transfers/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
};
