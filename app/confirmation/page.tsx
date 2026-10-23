import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmationView from "@/components/confirmation/ConfirmationView";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your ZANTA NIGHT booking reference and entry ticket.",
};

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-5 pt-40 pb-24 sm:px-8">
          <div className="skeleton h-96 w-full" />
        </div>
      }
    >
      <ConfirmationView />
    </Suspense>
  );
}
