import type { Metadata } from "next";
import MyTicketsView from "@/components/tickets/MyTicketsView";

export const metadata: Metadata = {
  title: "My Tickets",
  description: "Your ZANTA NIGHT bookings, payment status and entry tickets.",
};

export default function TicketsPage() {
  return <MyTicketsView />;
}
