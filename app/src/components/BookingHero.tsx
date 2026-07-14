import type { BookingJson } from "@shared/booking";
import type { BookingView } from "@/lib/bookingPresentation";
import { BoboCard } from "./BoboCard";

export function BookingHero({ view, booking }: { view: BookingView; booking: BookingJson }): React.ReactElement {
  const operator = booking.operator_name;
  if (view === "confirmed") {
    return <BoboCard hero eyebrow="BOOKING CONFIRMED" title="Confirmed lah!" message={`${operator} said yes. Your Malaysian plan is set.`} />;
  }
  if (view === "waiting") {
    return <BoboCard compact eyebrow="REQUEST SENT" title="Waiting for operator" message={`Bobo is watching for ${operator}'s WhatsApp reply.`} />;
  }
  if (view === "failed") {
    return <BoboCard compact eyebrow="BOOKING UPDATE" title="This booking needs attention" message="Review the reason below, then create a fresh request when you are ready." />;
  }
  return <BoboCard compact eyebrow="READY TO BOOK" title="Ready when you are" message={`Choose a date and guests before messaging ${operator}.`} />;
}
