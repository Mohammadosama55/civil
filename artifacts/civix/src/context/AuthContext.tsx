import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetMe, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false } });
  const [localUser, setLocalUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoading) {
      setLocalUser(isError || !user ? null : user);
    }
  }, [user, isLoading, isError]);

  const login = (newUser: User) => {
    setLocalUser(newUser);
    queryClient.setQueryData(["/api/auth/me"], newUser);
  };

  const logout = () => {
    setLocalUser(null);
    queryClient.setQueryData(["/api/auth/me"], null);
  };

  const updateUser = (updatedUser: User) => {
    setLocalUser(updatedUser);
    queryClient.setQueryData(["/api/auth/me"], updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user: localUser, isLoading: isLoading && localUser === undefined, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
