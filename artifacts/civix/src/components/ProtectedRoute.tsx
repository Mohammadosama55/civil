import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, adminOnly = false, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to={redirectTo} />;
  if (adminOnly && user.role !== "ward_admin") return <Redirect to="/" />;

  return <>{children}</>;
}
