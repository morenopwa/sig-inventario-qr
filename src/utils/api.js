const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  scan: (qrCode) => fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode })
  }),
  
  register: (data) => fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  borrow: (data) => fetch(`${API_BASE_URL}/api/borrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  return: (data) => fetch(`${API_BASE_URL}/api/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  items: () => fetch(`${API_BASE_URL}/api/items`),
  
  history: (id) => fetch(`${API_BASE_URL}/api/history/${id}`)
};