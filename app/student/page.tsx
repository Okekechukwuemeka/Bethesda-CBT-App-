import { redirect } from "next/navigation";

export default async function StudentsPage() {
  // Redirect immediately on the server before rendering any UI
  redirect("/student/exams");

  return null;
}
