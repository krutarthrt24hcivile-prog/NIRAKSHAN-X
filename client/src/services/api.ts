import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true });
api.interceptors.response.use(r => r, async error => {
  const original = error.config;
  if (error.response?.status === 401 && !original?._retry && !original?.url?.includes('/auth/refresh')) {
    original._retry = true;
    try { await api.post('/auth/refresh'); return api(original); } catch { /* session is genuinely expired */ }
  }
  return Promise.reject(error);
});
export async function getData<T = any>(url: string, config?: any): Promise<T> { return (await api.get(url, config)).data.data; }
export async function postData<T = any>(url: string, body?: any, config?: any): Promise<T> { return (await api.post(url, body, config)).data.data; }
export async function putData<T = any>(url: string, body?: any): Promise<T> { return (await api.put(url, body)).data.data; }
export async function patchData<T = any>(url: string, body?: any): Promise<T> { return (await api.patch(url, body)).data.data; }
export const messageOf = (error: any) => error?.response?.data?.message || 'Something went wrong. Please try again.';
