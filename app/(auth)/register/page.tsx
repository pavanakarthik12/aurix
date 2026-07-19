import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building your financial persona in minutes."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
