import { redirect } from "next/navigation";

export default async function StudentsPage() {
  // Redirect immediately on the server before rendering any UI
  redirect("/student/exams");

  // The rest of your component code won't be executed, but you can leave it or clear it
  return null;
}
