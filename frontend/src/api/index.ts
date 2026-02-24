// src/api/index.ts
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}) as any
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  let data;
  try { data = await res.json(); } catch(e) { data = null; }
  if (!res.ok) throw data || { message: res.statusText, status: res.status };
  return data;
}

export function login(email: string, password: string) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function register(email: string, password: string) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function getProfile() {
  return apiFetch('/profile', { method: 'GET' });
}
export function updateProfile(body: any) {
  return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) });
}
export function getContacts() {
  return apiFetch('/contacts', { method: 'GET' });
}
export function addContact(body: any) {
  return apiFetch('/contacts', { method: 'POST', body: JSON.stringify(body) });
}
export function updateContact(body: any) {
  return apiFetch('/contacts', { method: 'PUT', body: JSON.stringify(body) });
}
export function deleteContact(id: string|number) {
  return apiFetch('/contacts', { method: 'DELETE', body: JSON.stringify({ id }) });
}
export function sendEmergency(message: string, location: { latitude: number; longitude: number }) {
  const body = {
    message,
    location: `${location.latitude},${location.longitude}`,
    userName: localStorage.getItem('userName') || 'Emergency User'
  };
  return apiFetch('/emergency', { method: 'POST', body: JSON.stringify(body) });
}

export async function sendEmergencyWithVoice(
  message: string,
  location: { latitude: number; longitude: number },
  audioBlob: Blob,
  detectedLanguage: string = 'en'
) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  formData.append('message', message);
  formData.append('location', `${location.latitude},${location.longitude}`);
  formData.append('userName', localStorage.getItem('userName') || 'Emergency User');
  formData.append('language', detectedLanguage);
  formData.append('voice', audioBlob, 'emergency-audio.webm');

  console.log('📤 API: Sending emergency with voice');
  console.log('   Token:', token ? '✅ Present' : '❌ Missing');
  console.log('   Audio blob:', audioBlob.size, 'bytes');
  console.log('   Location:', location);
  
  // Log formdata contents
  for (let [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      console.log(`   ${key}: Blob(${value.size} bytes, ${value.type})`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log('📡 Fetching from:', `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/emergency`);
  
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/emergency`, {
    method: 'POST',
    headers,
    body: formData
  });

  console.log('📥 Response status:', res.status);
  
  if (res.status === 204) return null;
  let data;
  try { data = await res.json(); } catch(e) { data = null; }
  if (!res.ok) throw data || { message: res.statusText, status: res.status };
  return data;
}

export function getEmergencyHistory() {
  return apiFetch('/emergency-history', { method: 'GET' });
}