import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./db";
import { Admin } from "./models/admin.model";
import { Student } from "./models/student.model";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") return null;

        await connectDB();
        const admin = await Admin.findOne({ username: username.toLowerCase() }).select("+password");
        if (!admin || !admin.isActive) return null;

        const valid = await admin.comparePassword(password);
        if (!valid) return null;

        admin.lastLogin = new Date();
        await admin.save();

        return {
          id: admin.id,
          role: "admin",
          name: `${admin.firstName} ${admin.lastName}`,
          username: admin.username,
        };
      },
    }),
    Credentials({
      id: "student-login",
      name: "Student",
      credentials: {
        admissionNumber: { label: "Admission Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const admissionNumber = credentials?.admissionNumber;
        const password = credentials?.password;
        if (typeof admissionNumber !== "string" || typeof password !== "string") return null;

        await connectDB();
        const student = await Student.findOne({ admissionNumber }).select("+password");
        if (!student || !student.isActive) return null;

        const valid = await student.comparePassword(password);
        if (!valid) return null;

        return {
          id: student.id,
          role: "student",
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          class: student.class,
        };
      },
    }),
  ],
  callbacks: {
    // `user` is only defined on the initial sign-in call, so bake
    // everything we'll need later into the token then.
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
        token.admissionNumber = user.admissionNumber;
        token.class = user.class;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "admin" | "student";
      session.user.username = token.username;
      session.user.admissionNumber = token.admissionNumber;
      session.user.class = token.class;
      return session;
    },
  },
};
