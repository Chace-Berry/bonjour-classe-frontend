import { useAuthStore } from "../store/auth";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Cookie from "js-cookie";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";
import { useIdleTimer } from "react-idle-timer";

// Update login function to explicitly return user_type
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}user/token/`, {
      email,
      password,
    });

    const { access, refresh, user_type } = response.data;
    setAuthUser(access, refresh); // Store tokens after login
    return { access, refresh, user_type, error: null };
  } catch (error) {
    return { error: error.response?.data?.detail || "Login failed" };
  }
};

export const register = async (full_name, email, password, password2) => {
  try {
    // Log the data being sent to the API
    const requestData = {
      full_name,
      email,
      password,
      password2,
    };
    
    // console.log("Registration request payload:", requestData);
    
    const { data } = await axios.post(`${API_BASE_URL}user/register/`, requestData);
    
    // console.log("Registration response:", data);

    await login(email, password);
    return { data, error: null };
  } catch (error) {
    // console.error("Registration error:", error.response?.data || error.message);
    return {
      data: null,
      error:
        `${error.response?.data?.full_name || ''} - ${error.response?.data?.email || ''}` ||
        "Something went wrong",
    };
  }
};

export const logout = () => {
  Cookie.remove("access_token");
  Cookie.remove("refresh_token");
  useAuthStore.getState().setUser(null);
};

export const setUser = async () => {
  const access_token = Cookie.get("access_token");
  const refresh_token = Cookie.get("refresh_token");

  if (!access_token || !refresh_token) {

    return;
  }

  if (isAccessTokenExpired(access_token)) {
    const response = getRefreshedToken(refresh_token);
    setAuthUser(response.access, response.refresh);
  } else {
    setAuthUser(access_token, refresh_token);
  }
};

// Update setAuthUser to also store user_type in auth store if available
export const setAuthUser = (access_token, refresh_token) => {
  Cookies.set("access_token", access_token, { expires: 1, secure: true });
  Cookies.set("refresh_token", refresh_token, { expires: 7, secure: true });

  const decodedToken = jwt_decode(access_token) ?? null;

  if (decodedToken) {
    // Extract user type if available in the token
    const userType = decodedToken.user_type || null;
    
    // Set user in auth store with type information
    useAuthStore.getState().setUser({
      ...decodedToken,
      user_type: userType
    });
  }
  useAuthStore.getState().setLoading(false);
};

export const getRefreshedToken = async () => {
  try {
    const refresh_token = Cookies.get("refresh_token");
    if (!refresh_token) {
      throw new Error("Refresh token is missing.");
    }

    const response = await axios.post(`${API_BASE_URL}user/token/refresh/`, {
      refresh: refresh_token,
    });

    return response.data; // Return the new access token
  } catch (error) {
    return null; // Return null if the token refresh fails
  }
};

export const isAccessTokenExpired = (access_token) => {
  try {
    const decodedToken = jwt_decode(access_token);
    const isExpired = decodedToken.exp < Date.now() / 1000; 

    if (isExpired) {
      // console.warn("Access token has expired.");
      return true;
    }

    return false;
  } catch (error) {
    return true; 
  }
};

export const handleSessionExpiration = () => {
  Swal.fire({
    icon: "warning",
    title: "Session Expired",
    text: "Your session has expired due to inactivity. Please log in again.",
    confirmButtonText: "OK",
  }).then(() => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    useAuthStore.getState().setUser(null); 
    window.location.href = "/"; 
  });
};

export const getUserIdFromToken = () => {
  const accessToken = Cookies.get("access_token");
  if (!accessToken) {
    return null;
  }

  try {
    const decodedToken = jwt_decode(accessToken);
    return decodedToken.user_id; 
  } catch (error) {
    return null;
  }
};

// Add a function to get user type from token
export const getUserTypeFromToken = () => {
  const accessToken = Cookies.get("access_token");
  if (!accessToken) {
    return null;
  }

  try {
    const decodedToken = jwt_decode(accessToken);
    return decodedToken.user_type || null; // Extract user_type from token
  } catch (error) {
    return null;
  }
};
