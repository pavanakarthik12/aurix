import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
