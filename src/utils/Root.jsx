import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Root = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on role if user exists
      if (user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "user") {
        navigate("/employee-dashboard", { replace: true });
      }
    } else {
      // No user, redirect to login
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Return null since this is just for redirection
  return null;
};

export default Root;