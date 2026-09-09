import { Platform } from 'react-native';

// Android emulators can't reach the host machine via "localhost" — they use
// the special alias 10.0.2.2 instead. iOS simulators and physical devices on
// the same Wi-Fi network need the host machine's actual LAN IP; replace
// YOUR_LAN_IP below if you're testing on a physical phone.
const HOST = Platform.select({
  android: '10.0.2.2',
  default: 'localhost', // iOS simulator; swap for your LAN IP on a real device
});

const BASE_URL = `http://${HOST}:4000/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
