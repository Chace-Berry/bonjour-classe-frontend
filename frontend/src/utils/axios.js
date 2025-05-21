import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";
import { getRefreshedToken, isAccessTokenExpired } from "./auth"; // Import helper functions

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor to include the JWT token in the Authorization header
apiInstance.interceptors.request.use(
  async (config) => {
    let accessToken = Cookies.get("access_token");


    // Check if the access token is expired
    if (accessToken && isAccessTokenExpired(accessToken)) {
      try {
        // Refresh the token if expired
        const { access } = await getRefreshedToken();
        Cookies.set("access_token", access, { secure: true });
        accessToken = access;
      } catch (error) {
        // Redirect to login if token refresh fails
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    // Add the Authorization header if the token exists
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiInstance;
