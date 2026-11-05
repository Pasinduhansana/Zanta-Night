export type Performer = {
  name: string;
  slug: string;
  index: string;
  image: string;
  line: string;
};

export type Sponsor = {
  name: string;
  role: string;
};

const rawYear = process.env.NEXT_PUBLIC_EVENT_YEAR;
const parsedYear = Number(rawYear);

/**
 * The event year is intentionally configurable and unset by default.
 * When it is not confirmed, the site must never show a live countdown.
 */
export const eventYear: number | null =
  rawYear && Number.isFinite(parsedYear) && parsedYear >= 2026 ? parsedYear : null;

export const EVENT = {
  name: "ZANTA NIGHT",
  wordmark: ["ZANTA", "NIGHT"],
  subtitle: "Food Festival & DJ Party",
  tagline: "FOOD FESTIVAL & DJ PARTY",
  organizer: "ZANTA EVENTS",

  date: {
    month: 12,
    day: 25,
    year: eventYear,
    shortLabel: "DECEMBER 25",
    longLabel: "December 25",
    yearLabel: eventYear ? String(eventYear) : null,
    yearStatus: eventYear ? "CONFIRMED" : "TO BE ANNOUNCED",
  },

  time: {
    label: "3:00 PM — 12:00 AM",
    startHour: 15,
    endHour: 24,
  },

  venue: {
    name: "Grand Venue",
    city: null as string | null,
    address: null as string | null,
    confirmed: false,
    statusLabel: "VTA Ground Thalgaswela",
  },

  ticket: {
    category: "General Entry",
    price: 500,
    currency: "LKR",
    priceLabel: "LKR 500",
    /** Price at the gate on the event day (advance/online price stays `price`). */
    gatePrice: 600,
    gatePriceLabel: "LKR 600",
    maxPerOrder: 10,
    /** Total stock available — adjust to the real allocation. */
    capacity: 500,
  },

  /**
   * Payment instructions shown after booking (pay by transfer, upload slip).
   * Fill in the real credentials — leave empty until they are confirmed.
   */
  payment: {
    /** Hours the guest has to upload a slip before the booking expires. */
    windowHours: 48,
    bank: {
      name: "",
      accountName: "",
      accountNumber: "",
    },
    wallets: [] as { label: string; number: string }[],
    extraNote: "",
  },

  performers: [
    { name: "Mr. Percussion", slug: "mr-percussion", index: "01", image: "/images/artist-percussion.svg", line: "Rhythm on the decks" },
    { name: "YAKEE", slug: "yakee", index: "02", image: "/images/yakee.png", line: "Hands in the air" },
    { name: "DENON", slug: "denon", index: "03", image: "/images/artist-denon.svg", line: "Deep into the night" },
  ] satisfies Performer[],

  sponsors: [
    { name: "Pawan Niroshana Photography", role: "Photography" },
    { name: "Dilshan Fireworks", role: "Fireworks" },
    { name: "Madu Car Rental", role: "Transport" },
  ] satisfies Sponsor[],

  images: {
    hero: "/images/hero-bg.svg",
    introCrowd: "/images/intro-crowd.svg",
    food: "/images/exp-food.svg",
    lights: "/images/exp-lights.svg",
    party: "/images/exp-party.svg",
  },

  nav: [
    { key: "home", href: "/#home" },
    { key: "lineup", href: "/#lineup" },
    { key: "experience", href: "/#experience" },
    { key: "sponsors", href: "/#sponsors" },
    { key: "tickets", href: "/#tickets" },
  ] as const,
} as const;

/** Countdown target — only exists when the event year is confirmed. */
export function getEventTarget(): Date | null {
  if (!EVENT.date.year) return null;
  return new Date(EVENT.date.year, EVENT.date.month - 1, EVENT.date.day, EVENT.time.startHour, 0, 0);
}

export function bookingHref(quantity = 1): string {
  const q = Math.min(Math.max(quantity, 1), EVENT.ticket.maxPerOrder);
  return `/booking?qty=${q}`;
}

