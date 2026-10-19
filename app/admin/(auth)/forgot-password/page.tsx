import ForgotPasswordFlow from "@/components/auth/ForgotPasswordFlow";

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordFlow role="admin" loginHref="/admin/login" />;
}
