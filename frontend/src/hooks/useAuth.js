import { useAuthContext } from "../context/AuthContext";
import { loginUser } from "../services/auth.service";
import toast from "react-hot-toast";

export const useAuth = () => {
  const { login } = useAuthContext();

  const loginHandler = async (data) => {
    try {
      const res = await loginUser(data);

      const { token, ...user } = res;

      login(user, token);

      toast.success("Login successful 🎉");
      return res;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed"
      );
      throw error;
    }
  };

  return { loginHandler };
};
