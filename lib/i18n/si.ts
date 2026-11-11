import type { Dict } from "./en";

export const si: Dict = {
  nav: {
    home: "මුල් පිටුව",
    lineup: "ප්‍රසංග පෝරමය",
    experience: "අත්දැකීම",
    sponsors: "අනුග්‍රාහකයන්",
    tickets: "ටිකට්",
    getTickets: "ටිකට් ගන්න",
    myTickets: "මගේ ටිකට්",
    menu: "මෙනුව",
    openMenu: "මෙනුව විවෘත කරන්න",
    closeMenu: "මෙනුව වසන්න",
    getTicketsFrom: (price: string) => `ටිකට් ගන්න — ${price}`,
  },

  event: {
    subtitle: "Food Festival & DJ Party",
    tagline: "FOOD FESTIVAL & DJ PARTY",
    category: "General Entry",
    dateShort: "DECEMBER 25",
    dec25Short: "Dec 25",
    yearConfirmed: "CONFIRMED",
    yearPending: "TO BE ANNOUNCED",
    presents: (organizer: string) => `${organizer} presents`,
  },

  hero: {
    from: "From",
    cta: (price: string) => `ඔබේ ටිකට් පත ගන්න — ${price}`,
    explore: "අත්දැකීම නරඹන්න",
    scroll: "Scroll",
  },

  countdown: {
    saveTheDate: "Save the date",
    year: (status: string) => `වර්ෂය ${status}`,
    date: "දිනය",
    doorsOpen: "දොරටු විවෘත වන වේලාව",
    venue: "ස්ථානය",
    noCountdown: "Countdown activates once the year is confirmed",
    live: "The night is live",
    label: "ඉතිරි කාලය",
    days: "දින",
    hours: "පැය",
    minutes: "මිනිත්තු",
    seconds: "තත්පර",
  },

  intro: {
    section: "01 — The night",
    statement:
      "A FOOD FESTIVAL THAT TURNS INTO A DJ PARTY. ONE CROWD. ONE NIGHT. DECEMBER 25.",
    para1: (name: string) =>
      `${name} opens its gates at 3:00 PM and runs straight through to midnight — food stalls firing on all burners, DJs rolling from warm-up to closing, and a dance floor that keeps swelling after dark.`,
    para2: (names: string, date: string) =>
      `${names} — three names, three chapters of the same night. Come hungry, bring your crew, and stay until the last track fades over ${date}.`,
    chipFood: "ආහාර උත්සවය",
    chipDj: "DJ පාර්ටි",
    chipNight: "රාත්‍රී වාතාවරණය",
    chipEntry: (price: string) => `${price} ඇතුළුවීම`,
    secure: "ඔබේ ඇතුළුවීම වෙන් කරගන්න",
    doors: "Doors 3:00 PM",
    until: "Until 12:00 AM",
    streetFood: "Street food · Live sets",
  },

  lineup: {
    section: "02 — Lineup",
    count: "Four performers",
    headingTop: "FOUR NAMES.",
    headingBottom: "ONE NIGHT.",
    intro: (names: string) =>
      `The booth belongs to ${names} — one after another, from the first warm-up hour to the final drop.`,
    performer: "සංගීතඥයා",
    beThere: (price: string) => `එහි සිටින්න — ${price}`,
    lines: {
      "mr-percussion": "Rhythm on the decks",
      yakee: "Hands in the air",
      "project-m": "Beyond the signal",
      keetone: "Keys after dark",
    } as Record<string, string>,
  },

  experience: {
    section: "03 — Experience",
    hint: "රාත්‍රිය හරහා ගමන් කිරීමට අනුචලනය කරන්න",
    headingTop: "FOUR LAYERS",
    headingBottom: "OF THE SAME NIGHT",
    intro:
      "Music, food, light and people stacking on top of each other until the whole room moves as one.",
    panels: [
      {
        title: "The Music",
        copy: (_time: string, _date: string) =>
          "Mr. Percussion, YAKEE, Project M and KEETONE run the decks back to back — warm-up energy that keeps climbing until the closing set.",
        chip: "Live DJ sets",
        alt: "Dance floor under green lasers",
      },
      {
        title: "The Food",
        copy: (_time: string, _date: string) =>
          "A full food festival riding alongside the music — plates, grills and street-food energy from the afternoon doors onward.",
        chip: "Food festival",
        alt: "Night food festival grills",
      },
      {
        title: "The Lights",
        copy: (_time: string, _date: string) =>
          "Green lasers, rolling fog and hard strobes slicing the dark — the visual signature that makes December 25 look like nothing else.",
        chip: "Laser show",
        alt: "Green laser beams in fog",
      },
      {
        title: "The Crowd",
        copy: (time: string, date: string) =>
          `${time} on ${date}. One crowd, one room, no empty floor — from the first hour to the last track.`,
        chip: "Doors 3:00 PM",
        alt: "Crowd with hands raised in fog",
      },
    ],
    endOfStrip: "පටිය අවසන්",
    keepScrolling: "දිගටම අනුචලනය කරන්න",
  },
  sponsors: {
    section: "04 — Partners",
    sub: "සංවිධායක සහ ප්‍රධාන අනුග්‍රාහකයන්",
    organizedBy: "සංවිධානය කරනු ලබන්නේ",
    blurb:
      "Backed by three main partners covering the photography, fireworks and transport side of the night.",
    roles: {
      Photography: "ඡායාරූප",
      Fireworks: "ගිනිකෙළි",
      Transport: "ප්‍රවාහන",
    } as Record<string, string>,
  },

  tickets: {
    section: "05 — Tickets",
    generalEntry: "General entry",
    priceNote: (name: string, subtitle: string, date: string, time: string) =>
      `One price, one pass. ${name} — ${subtitle} on ${date}, ${time}.`,
    gateNote: (gate: string, date: string) =>
      `Advance price — ${gate} at the gate on ${date}.`,
    details: { date: "දිනය", time: "වේලාව", venue: "ස්ථානය", entry: "ඇතුළුවීම" },
    quantity: "ප්‍රමාණය",
    maxPerBooking: (max: number) => `එක් වරකට උපරිම ${max}`,
    total: "මුළු මුදල",
    bulletAccess: (category: string) =>
      `${category} — access to the food festival & DJ party`,
    bulletRef: "Booking reference issued instantly",
    bulletCountdown: (date: string, year: string) => `Countdown live — ${date} ${year}`,
    bulletYear: "Event year announced together with the venue",
    continue: (total: string) => `ඉදිරියට යන්න — ${total}`,
    payNote:
      "වෙන් කිරීමෙන් පසු මාරු කිරීමෙන් ගෙවන්න — ඔබේ ටිකට් පත් පිටුවේ රිසිට් පත උඩුගත කරන්න",
    remaining: (capacity: number) => `/ ${capacity} ටිකට් ඉතිරි ඇත`,
    decrease: "ප්‍රමාණය අඩු කරන්න",
    increase: "ප්‍රමාණය වැඩි කරන්න",
  },

  footer: {
    explore: "සොයන්න",
    lineup: "ප්‍රසංග පෝරමය",
    mainSponsors: "ප්‍රධාන අනුග්‍රාහකයන්",
    blurb: (subtitle: string, date: string, time: string, organizer: string) =>
      `${subtitle} — ${date}, ${time}. Presented by ${organizer}.`,
    bookTickets: "ටිකට් වෙන් කරන්න",
    venueYear: (venue: string, status: string) => `${venue} · Year ${status}`,
  },
  booking: {
    back: "ටිකට් වලට ආපසු",
    step: "පියවර 01 — ඔබේ විස්තර",
    headingTop: "ඔබේ ඇතුළුවීම",
    headingBottom: "වෙන් කරන්න",
    soldOut: "මේ වන විට සියලු ටිකට් අවසන් — තවත් ටිකට් නැත.",
    networkError:
      "ජාල දෝෂයක් — ඔබේ සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
    genericError: "යමක් වැරදුණි. නැවත උත්සාහ කරන්න.",
    validationFailed: "වලංගුභාවය අසාර්ථකයි. පෝරමය පරීක්ෂා කරන්න.",
    capacity: (remaining: number) =>
      `තව ටිකට් ${remaining}ක් පමණයි ඉතිරි — ඔබේ ප්‍රමාණය අඩු කරන්න.`,
    errors: {
      nameRequired: "ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න",
      nameTooLong: "නම ඉතා දිගයි",
      emailRequired: "විද්‍යුත් තැපෑල අවශ්‍යයි",
      emailInvalid: "වලංගු විද්‍යුත් තැපෑලක් ඇතුළත් කරන්න",
      emailTooLong: "විද්‍යුත් තැපෑල ඉතා දිගයි",
      phoneInvalid: "වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න",
      phoneTooLong: "දුරකථන අංකය ඉතා දිගයි",
      phoneChars: "අංක, හිස් තැන් සහ + ( ) - පමණක් භාවිතා කළ හැක",
      qtyRequired: "ප්‍රමාණය අවශ්‍යයි",
      qtyInt: "ප්‍රමාණය සම්පූර්ණ අංකයක් විය යුතුයි",
      qtyMin: "අවම වශයෙන් ටිකට් එකක් තෝරන්න",
      qtyMax: (max: number) => `එක් වරකට උපරිම ටිකට් ${max}`,
      notesTooLong: "සටහන් අකුරු 300කට වඩා නොවිය යුතුයි",
    },
    fields: {
      fullName: "සම්පූර්ණ නම",
      fullNamePlaceholder: "ඔබේ සම්පූර්ණ නම",
      email: "විද්‍යුත් තැපෑල",
      emailPlaceholder: "you@example.com",
      phone: "දුරකථන අංකය",
      phoneHint: "WhatsApp සඳහා",
      phonePlaceholder: "+94 7X XXX XXXX",
      tickets: "ටිකට්",
      ticketsHint: (max: number) => `උපරිම ${max}`,
      ticketOption: (n: number) => (n === 1 ? "ටිකට් පතක්" : `ටිකට් ${n}`),
      notes: "සටහන්",
      notesHint: "අවශ්‍ය නැත",
      notesPlaceholder: "අප දැනගත යුතු දෙයක් තිබේද…",
    },
    reserving: "වෙන් කරමින්…",
    submit: (total: string) => `වෙන් කිරීම තහවුරු කරන්න — ${total}`,
    payNote:
      "වෙන් කිරීමෙන් පසු බැංකු හෝ ජංගම මාරුවෙන් ගෙවන්න — තහවුරු කිරීමේ පිටුවේ රිසිට් පත උඩුගත කරන්න",
    summaryTitle: "ඇණවුම් සාරාංශය",
    rows: { event: "උත්සවය", date: "දිනය", time: "වේලාව", venue: "ස්ථානය" },
    total: "මුළු මුදල",
    ticketsLeft: "ඉතිරි ටිකට්",
    gateNote: (gate: string, date: string) =>
      `කලින් ගෙවීමේ මිල · ${date} දින දොරටුවේදී ${gate}`,
    whatNext: "ඊළඟට සිදුවන්නේ",
    steps: [
      "ඔබට අද්විතීය වෙන් කිරීමේ අංකයක් ලැබේ.",
      "ඔබේ තහවුරු කිරීමේ ටිකට් පත ක්ෂණිකව විවෘත කරන්න.",
      "ප්‍රවේශයේදී ටිකට් අංකය පෙන්වන්න.",
    ],
    verify: {
      verifyEmail: "ඊමේල් තහවුරු කරන්න",
      sending: "යවමින්…",
      hint: "අංක 4ක කේතයක් ඔබේ ඊමේල් වෙත යවනු ලැබේ — මුරපදයක් අවශ්‍ය නොවේ.",
      codeSentTo: (email: string) => `${email} වෙත යැවූ අංක 4ක කේතය ඇතුළත් කරන්න.`,
      codeLabel: "අංක 4ක කේතය",
      codePlaceholder: "0000",
      confirm: "ඊමේල් තහවුරු කරන්න",
      confirming: "තහවුරු කරමින්…",
      resendIn: (s: number) => `තත්පර ${s}කින් නැවත යවන්න`,
      resend: "කේතය නැවත යවන්න",
      changeEmail: "ඊමේල් වෙනස් කරන්න",
      verified: "ඊමේල් තහවුරු විය",
      required: "ඉදිරිපත් කිරීමට පෙර ඔබේ ඊමේල් තහවුරු කරන්න",
      errors: {
        invalidEmail: "වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.",
        cooldown: (s: number) =>
          `තවත් කේතයක් ඉල්ලීමට තත්පර ${s}ක් රැඳී සිටින්න.`,
        rateLimited: "ඉල්ලීම් බොහෝයි — පසුව නැවත උත්සාහ කරන්න.",
        sendFailed: "කේතය යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
        expired: "කේතය කල් ඉකුත් වී ඇත — නව කේතයක් ඉල්ලන්න.",
        invalid: (left: number) => `කේතය වැරදියි — ඉතිරි උත්සාහ ${left}ක්.`,
        tooMany: "වැරදි උත්සාහ බොහෝයි — නව කේතයක් ඉල්ලන්න.",
        notFound: "පළමුව කේතයක් ඉල්ලන්න.",
        network: "ජාල දෝෂයක් — නැවත උත්සාහ කරන්න.",
        server: "යම් දෝෂයක් සිදු විය — නැවත උත්සාහ කරන්න.",
        unverified: "වෙන් කිරීම ඉදිරිපත් කිරීමට පෙර ඔබේ ඊමේල් තහවුරු කරන්න.",
        mismatch: "වෙන් කිරීමේ ඊමේල් ලිපිනය තහවුරු කළ ලිපිනය සමඟ ගැලපිය යුතුයි.",
      },
    },
    purchases: {
      title: "ඔබේ පෙර මිලදී ගැනීම්",
      note: "ඔබට නැවත වෙන් කළ හැක — මේවා ඔබේ පෙර වෙන් කිරීම්ය.",
    },
  },
  confirmation: {
    noRefTitle: "අංකයක් හමු නැත",
    noRefBody:
      "ඔබේ වෙන් කිරීමේ තහවුරුවෙන් මෙම පිටුව විවෘත කරන්න, නැතහොත් නව වෙන් කිරීමක් ආරම්භ කරන්න.",
    newBooking: "නව වෙන් කිරීමක්",
    backHome: "මුල් පිටුවට",
    loading: "ඔබේ ටිකට් පත පූරණය වෙමින්…",
    notFoundTitle: "ටිකට් හමු නැත",
    retry: "නැවත උත්සාහ කරන්න",
    errors: {
      notFound: "මෙම වෙන් කිරීම සොයා ගත නොහැකි විය.",
      invalid: "වලංගු නොවන වෙන් කිරීමේ අංකයකි.",
      network: "ඔබේ ටිකට් පත පූරණය කිරීමේදී ජාල දෝෂයක්.",
      server: "මෙම වෙන් කිරීම පූරණය කළ නොහැක.",
    },
    created: "වෙන් කිරීම සිදු විය",
    headingTop: "YOUR",
    headingBottom: "TICKET",
    refresh: "තත්ත්වය යාවත්කාලීන කරන්න",
    refIntro: "වෙන් කිරීමේ අංකය",
    refOutro: (date: string) => `— ${date} සඳහා එය ආරක්ෂා කර තබා ගන්න.`,
    status: {
      pending: {
        label: "ගෙවීම බලාපොරොත්තුවෙන්",
        blurb: (_hours: number) =>
          "පහත මුළු මුදල මාරු කර ගෙවන්න, ඉන්පසු මෙම පිටුවේ ගෙවීම් රිසිට් පත උඩුගත කරන්න.",
      },
      awaiting: {
        label: "රිසිට් පත ලැබුණි",
        blurb: (_hours: number) =>
          "ඔබේ රිසිට් පත ලැබුණි — මාරුව තහවුරු කරමින් සිටිමු. මෙම පිටුව ස්වයංක්‍රීයව යාවත්කාලීන වේ.",
      },
      confirmed: {
        label: "ගෙවීම තහවුරු විය",
        blurb: (_hours: number) =>
          "ඔබ සම්පූර්ණයෙන් වෙන් වී ඇත. ප්‍රවේශයේදී මෙම අංකය පෙන්වන්න.",
      },
      checkedIn: {
        label: "පිවිසුම සටහන් විය",
        blurb: (_hours: number) => "ප්‍රවේශය සටහන් විය — රාත්‍රිය විඳින්න.",
      },
      rejected: {
        label: "තහවුරු කිරීම අසාර්ථකයි",
        blurb: (_hours: number) =>
          "ඔබේ රිසිට් පත තහවුරු කළ නොහැකි විය. දෝෂය නිවැරදි කර නැවත උඩුගත කරන්න.",
      },
      expired: {
        label: "වෙන් කිරීම කල් ඉකුත් විය",
        blurb: (hours: number) =>
          `${hours} පැය ගෙවීම්කාල සීමාව ඉකුත් විය. ඔබට නැවත වෙන් කළ හැක.`,
      },
    },
    reasonPrefix: "හේතුව:",
    details: { date: "දිනය", time: "වේලාව", venue: "ස්ථානය", tickets: "ටිකට්" },
    guest: "අමුතා",
    total: "මුළු මුදල",
    statusLabel: "තත්ත්වය",
    entryStub: "ප්‍රවේශ කොටස",
    qty: (n: number) => `ප්‍රමාණය ${n}`,
    payment: "ගෙවීම",
    uploadWithin: (hours: number) => `${hours} පැයක් ඇතුළත උඩුගත කරන්න`,
    toBeAnnounced: "විස්තර ඉක්මනින් නිවේදනය වේ",
    amountDue: "ගෙවිය යුතු මුදල",
    transferNote: (reference: string) =>
      `නිවැරදි මුදල මාරු කර ගෙවන්න, තැන්පත් සටහන ලෙස ${reference} ලියන්න, ඉන්පසු රිසිට් පත උඩුගත කරන්න.`,
    bankTransfer: "බැංකු මාරුව",
    bankFallback: "බැංකුව",
    paymentUnconfigured:
      "බැංකු සහ පසුම්බි විස්තර ඉක්මනින් නිවේදනය වේ — ඔබේ වෙන් කිරීම සහ අංකය වලංගු වන අතර, ගෙවීම සිදු කළ පසු මෙහිදී රිසිට් පත උඩුගත කරන්න.",
    slip: "ගෙවීම් රිසිට් පත",
    chooseSlip: "ගෙවීම් රිසිට් පත තෝරන්න",
    formats: "JPG, PNG, WebP හෝ PDF · උපරිම 5 MB",
    uploading: "උඩුගත වෙමින්…",
    uploadSlip: "රිසිට් පත උඩුගත කරන්න",
    replaceSlip: "රිසිට් පත මාරු කරන්න",
    uploadSuccess: "රිසිට් පත උඩුගත විය — තහවුරු කිරීම බලාපොරොත්තුවෙන්.",
    slipStored: "රිසිට් පත උඩුගත විය — තහවුරු කිරීම සඳහා බලා සිටී.",
    refreshLater:
      "තත්ත්වය පරීක්ෂා කිරීමට මොහොකට පසු පිටුව නැවත යාවත්කාලීන කරන්න.",
    uploadLater: "ගෙවීම් විස්තර නිවේදනය වූ පසු උඩුගත කිරීම ලබා ගත හැක.",
    uploadErrors: {
      type: "JPG, PNG, WebP හෝ PDF ගොනු පමණක් පිළිගනී.",
      size: "ගොනුව ඉතා විශාලයි — උපරිම 5 MB.",
      network: "ජාල දෝෂයක් — නැවත උත්සාහ කරන්න.",
      generic: "උඩුගත කිරීම අසාර්ථකයි.",
      notAllowed:
        "මෙම වෙන් කිරීමට තවදුරටත් රිසිට් පතක් එකතු කළ නොහැක. සංවිධායකයා අමතන්න.",
      notFound: "මෙම වෙන් කිරීම සොයා ගත නොහැකි විය.",
    },
    bookAnother: "තවත් ටිකට් පතක් වෙන් කරන්න",
  },

  ticket: {
    lockedKicker: "TICKET LOCKED",
    lockedTitle: "UPLOAD YOUR SLIP",
    lockedBody:
      "Your ticket tears open as soon as your payment slip is uploaded — the full ticket unlocks once the payment is approved.",
    partialKicker: "AWAITING APPROVAL",
    partialNote:
      "The entry stub stays sealed until your payment is approved — this page updates automatically.",
    approvedKicker: "PAYMENT APPROVED",
    download: {
      title: "ටිකට් පත බාගන්න",
      hint: "ඔබේ දුරකථනයේ පිටපතක් තබා ගන්න — QR කේතය ඇතුළතදී ස්කෑන් කරනු ලැබේ.",
      png: "PNG බාගන්න",
      jpg: "JPG බාගන්න",
      pdf: "PDF බාගන්න",
      preparing: "සකසමින්…",
      error: "ගොනුව සෑදීමට නොහැකි විය — නැවත උත්සාහ කරන්න.",
    },
  },

  auth: {
    login: {
      kicker: "සාමාජික ප්‍රවේශය",
      title: "මගේ ටිකට් පත්",
      subtitle:
        "ඔබ වෙන් කිරීමට භාවිතා කළ ඊමේල් ලිපිනයෙන් පිවිසෙන්න — අංක 4ක කේතයක් යවනු ලැබේ. මුරපදයක් අවශ්‍ය නොවේ.",
      emailLabel: "වෙන් කිරීමේ ඊමේල්",
      emailPlaceholder: "you@example.com",
      sendCode: "කේතය යවන්න",
      sending: "යවමින්…",
      codeTitle: "කේතය ඇතුළත් කරන්න",
      codeSentTo: (email: string) => `අපි ${email} වෙත අංක 4ක කේතයක් යැව්වෙමු.`,
      codeLabel: "අංක 4ක කේතය",
      codePlaceholder: "0000",
      verify: "තහවුරු කර ඉදිරියට යන්න",
      verifying: "තහවුරු කරමින්…",
      resend: "කේතය නැවත යවන්න",
      resendIn: (s: number) => `තත්පර ${s}කින් නැවත යවන්න`,
      changeEmail: "වෙනත් ඊමේල් ලිපිනයක්",
      expiresIn: (m: number) => `කේතය මිනිත්තු ${m}කින් කල් ඉකුත් වේ.`,
      attemptsLeft: (n: number) => `ඉතිරි උත්සාහ ${n}ක්.`,
      errors: {
        invalidEmail: "වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.",
        noBookings: "මෙම ඊමේල් ලිපිනය සඳහා වෙන් කිරීම් හමු නොවීය.",
        cooldown: (s: number) =>
          `තවත් කේතයක් ඉල්ලීමට තත්පර ${s}ක් රැඳී සිටින්න.`,
        rateLimited: "ඉල්ලීම් බොහෝයි — පසුව නැවත උත්සාහ කරන්න.",
        sendFailed: "කේතය යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
        expired: "කේතය කල් ඉකුත් වී ඇත — නව කේතයක් ඉල්ලන්න.",
        invalid: (left: number) => `කේතය වැරදියි — ඉතිරි උත්සාහ ${left}ක්.`,
        tooMany: "වැරදි උත්සාහ බොහෝයි — නව කේතයක් ඉල්ලන්න.",
        notFound: "පළමුව කේතයක් ඉල්ලන්න.",
        network: "ජාල දෝෂයක් — නැවත උත්සාහ කරන්න.",
        server: "යම් දෝෂයක් සිදු විය — නැවත උත්සාහ කරන්න.",
      },
    },
    tickets: {
      kicker: "සාමාජික ප්‍රවේශය",
      title: "මගේ ටිකට් පත්",
      signedInAs: (email: string) => `${email} ලෙස පිවිසඇත`,
      signOut: "ඉවත් වන්න",
      loading: "ඔබේ ටිකට් පත් පූරණය වෙමින්…",
      empty: "මෙම ගිණුම සඳහා වෙන් කිරීම් හමු නොවීය.",
      payment: "ගෙවීම",
      status: { pending: "බලාපොරොත්තුවෙන්", approved: "අනුමත", rejected: "ප්‍රතික්ෂේප" },
      qty: (n: number) => `ටිකට් පත් ${n}`,
      ticketsFor: (ref: string) => `ටිකට් පත් · ${ref}`,
      seat: (n: number) => `අසුන ${n}`,
      ready: "ස්කෑන් කිරීමට සූදානම්",
      used: "ස්කෑන් වී ඇත",
      notIssued: "ඔබේ ගෙවීම අනුමත වූ පසු ටිකට් පත් ස්වයංක්‍රීයව මෙහි දිස්වේ.",
      openBooking: "වෙන් කිරීම විවෘත කරන්න",
      errors: {
        network: "ජාල දෝෂයක් — නැවත උත්සාහ කරන්න.",
        server: "ඔබේ ටිකට් පත් පූරණය කළ නොහැකි විය.",
      },
    },
  },
};
