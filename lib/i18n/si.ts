import type { Dict } from "./en";

export const si: Dict = {
  nav: {
    home: "මුල් පිටුව",
    lineup: "ප්‍රසංග පෝරමය",
    experience: "අත්දැකීම",
    sponsors: "අනුග්‍රාහකයන්",
    tickets: "ටිකට්",
    getTickets: "ටිකට් ගන්න",
    menu: "මෙනුව",
    openMenu: "මෙනුව විවෘත කරන්න",
    closeMenu: "මෙනුව වසන්න",
    getTicketsFrom: (price: string) => `ටිකට් ගන්න — ${price}`,
  },

  event: {
    subtitle: "ෆුඩ් ෆෙස්ටිවල් සහ ඩීජී පාර්ටි",
    tagline: "ෆුඩ් ෆෙස්ටිවල් සහ ඩීජී පාර්ටි",
    category: "සාමාන්‍ය ඇතුළුවීම",
    dateShort: "දෙසැම්බර් 25",
    dec25Short: "දෙසැ. 25",
    yearConfirmed: "තහවුරුයි",
    yearPending: "තවම නිවේදනය නැත",
    presents: (organizer: string) => `${organizer} විසින් ඉදිරිපත් කරයි`,
  },

  hero: {
    from: "සිට",
    cta: (price: string) => `ඔබේ ටිකට් පත ගන්න — ${price}`,
    explore: "අත්දැකීම නරඹන්න",
    scroll: "පහළට",
  },

  countdown: {
    saveTheDate: "දිනය සුරකින්න",
    year: (status: string) => `වර්ෂය ${status}`,
    date: "දිනය",
    doorsOpen: "දොරටු විවෘත වන වේලාව",
    venue: "ස්ථානය",
    noCountdown: "වර්ෂය තහවුරු වූවිට ඉතිරි කාලය ගණනය වේ",
    live: "රාත්‍රිය දැන් සජීවීයි",
    label: "ඉතිරි කාලය",
    days: "දින",
    hours: "පැය",
    minutes: "මිනිත්තු",
    seconds: "තත්පර",
  },

  intro: {
    section: "01 — එම රාත්‍රිය",
    statement:
      "ආහාර උත්සවයක් ඩීජී පාර්ටියක් බවට පත් වන රාත්‍රියකි. එකම පිරිසක්. එකම රාත්‍රියක්. දෙසැම්බර් 25.",
    para1: (name: string) =>
      `${name} සවස 3:00ට දොරටු විවෘත කර මධ්‍යම රාත්‍රී 12 දක්වා අඛණ්ඩව පවතී — සියලු උණුසුම් වූ ආහාර කඩ, වාර්මිකයන්ගෙන් අවසන් තට්ටුව දක්වා වාදනය කරන DJ, සහ අඳුරු වූ පසුවත් වර්ධනය වන නර්තන බිමක්.`,
    para2: (names: string, date: string) =>
      `${names} — නම් තුනක්, එකම රාත්‍රියේ පිටපත් තුනක්. කුස පිරී එන්න, ඔබේ පිරිස රැගෙන එන්න, ${date} දින අවසන් ගීතය නිහඬ වන තුරු රැඳී සිටින්න.`,
    chipFood: "ආහාර උත්සවය",
    chipDj: "DJ පාර්ටි",
    chipNight: "රාත්‍රී වාතාවරණය",
    chipEntry: (price: string) => `${price} ඇතුළුවීම`,
    secure: "ඔබේ ඇතුළුවීම වෙන් කරගන්න",
    doors: "දොරටු — සවස 3:00",
    until: "මධ්‍යම රාත්‍රී 12 දක්වා",
    streetFood: "වීදි ආහාර · සජීවී වාදන",
  },

  lineup: {
    section: "02 — ප්‍රසංග පෝරමය",
    count: "සංගීතඥයින් තිදෙනෙක්",
    headingTop: "නම් තුනයි.",
    headingBottom: "එක් රාත්‍රියක්.",
    intro: (names: string) =>
      `${names} — පළමු වාර්මික පැයේ සිට අවසන් තට්ටුව දක්වා එකා පසු එකා ලෙස ඩීජී තට්ටුව අතට පත් වේ.`,
    performer: "සංගීතඥයා",
    beThere: (price: string) => `එහි සිටින්න — ${price}`,
    lines: {
      "mr-percussion": "ඩීජී තට්ටුවේ රිද්මය",
      yakee: "අත් උඩට",
      denon: "රාත්‍රියේ ගැඹුරට",
    } as Record<string, string>,
  },

  experience: {
    section: "03 — අත්දැකීම",
    hint: "රාත්‍රිය හරහා ගමන් කිරීමට අනුචලනය කරන්න",
    headingTop: "එම රාත්‍රියේ",
    headingBottom: "ස්ථර හතරක්",
    intro:
      "සංගීතය, ආහාර, ආලෝකය සහ මිනිසුන් එකිනෙකා මත එකතු වී මුළු ශාලාවම එකක් ලෙස හැසිරෙන තුරු.",
    panels: [
      {
        title: "සංගීතය",
        copy: (_time: string, _date: string) =>
          "Mr. Percussion, YAKEE සහ DENON ඩීජී තට්ටුව පිටිපස්සෙන් පිටිපස්සට ගනී — අවසන් වාදනය දක්වා නැඟෙන වාර්මික උණුසුමක්.",
        chip: "සජීවී DJ වාදන",
        alt: "කොළ ලේසර් යට නර්තන බිම",
      },
      {
        title: "ආහාර",
        copy: (_time: string, _date: string) =>
          "සංගීතයත් සමඟ පවතින සම්පූර්ණ ආහාර උත්සවයක් — දහවල් දොරටු විවෘත වූ මොහොතේ සිට පිඟන්, ග්‍රිල් සහ වීදි ආහාර මුදාහැරීම.",
        chip: "ආහාර උත්සවය",
        alt: "රාත්‍රී ආහාර උත්සව ග්‍රිල්",
      },
      {
        title: "ආලෝක",
        copy: (_time: string, _date: string) =>
          "කොළ ලේසර්, ගලා යන මීදුම සහ අඳුර විදින ස්ට්‍රෝබ් — දෙසැම්බර් 25 දිනය අන් අයට කිසිවක් නොවන පරිදි මතු කරන දෘශ්‍ය අත්සන.",
        chip: "ලේසර් ප්‍රදර්ශනය",
        alt: "මීදුම තුළ කොළ ලේසර් කිරණ",
      },
      {
        title: "පිරිස",
        copy: (time: string, date: string) =>
          `${date} දින ${time}. එකම පිරිසක්, එකම කාමරයක්, හිස් බිමක් නැත — පළමු පැයේ සිට අවසන් ගීතය දක්වා.`,
        chip: "දොරටු සවස 3:00",
        alt: "මීදුම තුළ අත් උසුලා සිටින පිරිස",
      },
    ],
    endOfStrip: "පටිය අවසන්",
    keepScrolling: "දිගටම අනුචලනය කරන්න",
  },
  sponsors: {
    section: "04 — හවුල්කරුවන්",
    sub: "සංවිධායක සහ ප්‍රධාන අනුග්‍රාහකයන්",
    organizedBy: "සංවිධානය කරනු ලබන්නේ",
    blurb:
      "රාත්‍රියේ ඡායාරූප, ගිනිකෙළි සහ ප්‍රවාහන කොටස් ආවරණය කරන ප්‍රධාන හවුල්කරුවන් තිදෙනෙකුගේ සහාය ඇත.",
    roles: {
      Photography: "ඡායාරූප",
      Fireworks: "ගිනිකෙළි",
      Transport: "ප්‍රවාහන",
    } as Record<string, string>,
  },

  tickets: {
    section: "05 — ටිකට්",
    generalEntry: "සාමාන්‍ය ඇතුළුවීම",
    priceNote: (name: string, subtitle: string, date: string, time: string) =>
      `එකම මිල, එකම පසුකිරීමක්. ${name} — ${subtitle}, ${date} දින ${time}.`,
    gateNote: (gate: string, date: string) =>
      `කලින් ගෙවීමේ මිල — ${date} දින දොරටුවේදී ${gate}.`,
    details: { date: "දිනය", time: "වේලාව", venue: "ස්ථානය", entry: "ඇතුළුවීම" },
    quantity: "ප්‍රමාණය",
    maxPerBooking: (max: number) => `එක් වරකට උපරිම ${max}`,
    total: "මුළු මුදල",
    bulletAccess: (category: string) =>
      `${category} — ආහාර උත්සවය සහ DJ පාර්ටියට ප්‍රවේශය`,
    bulletRef: "වෙන් කිරීමේ අංකය ක්ෂණිකව ලැබේ",
    bulletCountdown: (date: string, year: string) =>
      `ඉතිරි කාලය සජීවීයි — ${date} ${year}`,
    bulletYear: "ස්ථානය සමඟම උත්සව වර්ෂයත් නිවේදනය වේ",
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
      `${subtitle} — ${date}, ${time}. ${organizer} විසින් ඉදිරිපත් කරයි.`,
    bookTickets: "ටිකට් වෙන් කරන්න",
    venueYear: (venue: string, status: string) => `${venue} · වර්ෂය ${status}`,
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
    headingTop: "ඔබේ",
    headingBottom: "ටිකට් පත",
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
          "ඔබේ රිසිට් පත ලැබුණි — මාරුව තහවුරු කරමින් සිටිමු. යාවත්කාලීන සඳහා පිටුව නැවත පූරණය කරන්න.",
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
    chooseSlip: "ගෙවීම් රිසිට් පතේ පින්තූරය තෝරන්න",
    formats: "JPG, PNG හෝ WebP · උපරිම 5 MB",
    uploading: "උඩුගත වෙමින්…",
    uploadSlip: "රිසිට් පත උඩුගත කරන්න",
    replaceSlip: "රිසිට් පත මාරු කරන්න",
    uploadSuccess: "රිසිට් පත උඩුගත විය — තහවුරු කිරීම බලාපොරොත්තුවෙන්.",
    slipStored: "රිසිට් පත උඩුගත විය — තහවුරු කිරීම සඳහා බලා සිටී.",
    refreshLater:
      "තත්ත්වය පරීක්ෂා කිරීමට මොහොකට පසු පිටුව නැවත යාවත්කාලීන කරන්න.",
    uploadLater: "ගෙවීම් විස්තර නිවේදනය වූ පසු උඩුගත කිරීම ලබා ගත හැක.",
    uploadErrors: {
      type: "JPG, PNG හෝ WebP පින්තූර පමණක් පිළිගනී.",
      size: "ගොනුව ඉතා විශාලයි — උපරිම 5 MB.",
      network: "ජාල දෝෂයක් — නැවත උත්සාහ කරන්න.",
      generic: "උඩුගත කිරීම අසාර්ථකයි.",
      notAllowed:
        "මෙම වෙන් කිරීමට තවදුරටත් රිසිට් පතක් එකතු කළ නොහැක. සංවිධායකයා අමතන්න.",
      notFound: "මෙම වෙන් කිරීම සොයා ගත නොහැකි විය.",
    },
    bookAnother: "තවත් ටිකට් පතක් වෙන් කරන්න",
  },
};
