import ForgotPasswordFlow from "@/components/auth/ForgotPasswordFlow";

export default function StaffForgotPasswordPage() {
  return <ForgotPasswordFlow role="staff" loginHref="/staff/login" />;
}
