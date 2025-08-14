// src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data?.errors;
    throw err;
  }
  return data;
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      _setLoading: (v) => set({ loading: v, error: null }),
      _setError:   (e) => set({ error: e?.message || 'Something went wrong', loading: false }),

      signup: async ({ username, email, phone, password, confirmPassword }) => {
        get()._setLoading(true);
        try {
          const data = await request('/api/auth/signup', {
            method: 'POST',
            body: { username, email, phone, password, confirmPassword },
          });
          set({ user: data, loading: false, error: null });
          return data;
        } catch (e) {
          get()._setError(e);
          throw e;
        }
      },

      login: async ({ email, username, password }) => {
        get()._setLoading(true);
        try {
          const data = await request('/api/auth/login', {
            method: 'POST',
            body: { email, username, password },
          });
          const token = data?.token || null; 
          set({ token, error: null });
          await get().getMe();
          set({ loading: false });
          return { ok: true };
        } catch (e) {
          get()._setError(e);
          throw e;
        }
      },


      updateProfile: async (formOrFields) => {
        get()._setLoading(true);
        try {
          const token = get().token || undefined;
          const headers = {};
          if (token) headers.Authorization = `Bearer ${token}`; // optional; cookies still work

          // Accept either a ready FormData or a plain object
          let body;
          if (formOrFields instanceof FormData) {
            body = formOrFields;
          } else {
            const { username, email, phone, password, files } = formOrFields || {};
            const fd = new FormData();
            if (username !== undefined) fd.append('username', username);
            if (email !== undefined)    fd.append('email', email);
            if (phone !== undefined)    fd.append('phone', String(phone));
            if (password)               fd.append('password', password);
            if (Array.isArray(files)) {
              files.forEach((f) => f && fd.append('files', f, f.name));
            } else if (files) {
              fd.append('files', files, files.name);
            }
            body = fd;
          }

          const res = await fetch(`${API_BASE}/api/auth/me`, {
            method: 'PUT',
            headers,           // do NOT set Content-Type; browser will set multipart boundary
            body,
            credentials: 'include',
          });

          let data = null;
          try { data = await res.json(); } catch {}
          if (!res.ok) {
            const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
            const err = new Error(message);
            err.status = res.status;
            err.details = data?.errors;
            throw err;
          }

          const nextUser = data.user || data;
          set({ user: nextUser, loading: false, error: null });
          return nextUser;
        } catch (e) {
          get()._setError(e);
          throw e;
        }
      },

      getMe: async () => {
        try {
          const data = await request('/api/auth/me', {
            method: 'GET',
            token: get().token || undefined,
          });
          set({ user: data, error: null });
          return data;
        } catch (e) {
          if (e.status === 401) set({ user: null, token: null });
          throw e;
        }
      },

      logout: async () => {
        get()._setLoading(true);
        try {
          try { await request('/api/auth/logout', { method: 'POST', token: get().token || undefined }); } catch {}
          set({ user: null, token: null, loading: false, error: null });
        } catch (e) {
          get()._setError(e);
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
