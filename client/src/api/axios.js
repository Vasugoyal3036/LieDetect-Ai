import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (expired tokens, etc.)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || "";
      if (message.includes("expired") || message.includes("Token failed")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Show session expired via URL param
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;