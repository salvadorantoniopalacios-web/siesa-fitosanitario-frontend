import axios from "axios";

axios.defaults.baseURL = `${import.meta.env.VITE_API_URL}/api`;

axios.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("siesa_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("siesa_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axios;