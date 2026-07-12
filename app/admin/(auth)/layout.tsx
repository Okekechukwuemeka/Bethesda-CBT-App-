import AuthSessionProvider from "@/components/providers/SessionProvider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthSessionProvider>
      <div>{children}</div>
    </AuthSessionProvider>
  );
}
