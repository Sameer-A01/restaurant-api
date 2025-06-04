import { createContext, useState, useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage on mount
    const storedUser = JSON.parse(localStorage.getItem("ims_user"));
    return storedUser || null;
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("ims_user", JSON.stringify(userData));
    localStorage.setItem("ims_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ims_user");
    localStorage.removeItem("ims_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
