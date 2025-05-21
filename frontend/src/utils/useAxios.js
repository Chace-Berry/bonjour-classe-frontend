import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";
import { getRefreshedToken, isAccessTokenExpired } from "./auth";

const useAxios = () => {
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request Interceptor
  axiosInstance.interceptors.request.use(
    async (config) => {
      let accessToken = Cookies.get("access_token");

      // Check if the token is expired and refresh it if necessary
      if (accessToken && isAccessTokenExpired(accessToken)) {
        try {
          const { access } = await getRefreshedToken();
          Cookies.set("access_token", access, { secure: true, sameSite: "Strict" });
          accessToken = access;
        } catch (error) {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/"; // Redirect to login
          return Promise.reject(error);
        }
      }

      // Add the token to the Authorization header
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxios;
