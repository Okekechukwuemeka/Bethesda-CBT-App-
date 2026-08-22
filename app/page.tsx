import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { InstallAppButton } from "@/components/install-app-button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "admin") redirect("/admin");
  if (session?.user?.role === "student") redirect("/student");
  if (session?.user?.role === "staff") redirect("/staff");

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">
            Bethesda Home &amp; School For The Blind
          </h1>
          <p className="text-[#3D5A78] mt-2">Computer-Based Testing Platform</p>
        </div>

        <nav aria-label="Login options" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/login"
            className="block bg-[#1A3A5C] text-white rounded-xl px-6 py-8 font-medium hover:bg-[#122a44] transition focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2B6CB0]">
            Admin Login
          </Link>
          <Link
            href="/student/login"
            className="block bg-white border-2 border-[#1A3A5C] text-[#1A3A5C] rounded-xl px-6 py-8 font-medium hover:bg-[#E8F0FE] transition focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2B6CB0]">
            Student Login
          </Link>
          <Link
            href="/staff/login"
            className="block bg-white border-2 border-[#1A3A5C] text-[#1A3A5C] rounded-xl px-6 py-8 font-medium hover:bg-[#E8F0FE] transition focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2B6CB0] sm:col-span-2">
            Staff Login
          </Link>
        </nav>

        <InstallAppButton />
      </div>
    </main>
  );
}
