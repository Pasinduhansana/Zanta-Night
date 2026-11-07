import type { Metadata } from "next";
import LoginView from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to view your ZANTA NIGHT bookings and tickets.",
};

export default function LoginPage() {
  return <LoginView />;
}
