import axios from 'axios';

// Create an axios instance that uses the Next.js API proxy
// The Next.js config already routes /api/* to the backend
const api = axios.create({
  baseURL: '', // Empty base URL to use relative URLs through the proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
