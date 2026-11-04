import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL = "http://localhost:5000/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load authentication data when app starts
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to load user data");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // Save login information
  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  }, []);

  // Ask the server for the CURRENT role and status.
  // This moves a person to the right side after the manager accepts them
  // or changes their role.
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Only sign out when the server clearly says the token or account
      // is not allowed. Network or server errors are ignored.
      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      // ignore network errors
    }
  }, [token, logout]);

  // Check again every 30 seconds and when the person returns to the tab.
  useEffect(() => {
    if (!token) return;

    refreshUser();

    const timer = setInterval(refreshUser, 30000);
    window.addEventListener("focus", refreshUser);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshUser);
    };
  }, [token, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};