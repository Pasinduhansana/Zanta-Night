import type { Metadata } from "next";
import { Suspense } from "react";
import BookingView from "@/components/booking/BookingView";

export const metadata: Metadata = {
  title: "Book Tickets",
  description:
    "Reserve your General Entry pass for ZANTA NIGHT — Food Festival & DJ Party. LKR 500 per ticket.",
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-8 pt-40 pb-24 sm:px-14 lg:px-20">
          <div className="skeleton h-96 w-full" />
        </div>
      }
    >
      <BookingView />
    </Suspense>
  );
}
