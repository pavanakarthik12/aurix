import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard.">
      <LoginForm />
    </AuthLayout>
  );
}
