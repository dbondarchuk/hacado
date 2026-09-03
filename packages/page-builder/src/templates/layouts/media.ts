import { TEMPLATE_LOGOS } from "../template-media";
import type { PackMediaLibrary, WebsitePackId } from "./types";

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PACK_MEDIA: Record<WebsitePackId, PackMediaLibrary> = {
  salon: {
    generic: u("photo-1560066984-138dadb4c035"),
    before: u("photo-1522337360788-8b13dee7a37e"),
    after: u("photo-1560066984-138dadb4c035"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["salon", "interior", "hair"],
      },
      {
        src: u("photo-1522337360788-8b13dee7a37e"),
        keywords: ["cut", "style", "hair", "blowout"],
      },
      {
        src: u("photo-1516975080664-ed2fc6a32937"),
        keywords: ["nails", "gel", "manicure"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["color", "treatment", "refresh"],
      },
      {
        src: u("photo-1521590832167-7bcbfaa6381f"),
        keywords: ["chair", "blowout", "style"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["spa", "glow", "facial"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["salon", "interior", "hair"],
      },
      {
        src: u("photo-1522337360788-8b13dee7a37e"),
        keywords: ["cut", "style", "hair", "blowout"],
      },
    ],
  },
  tattoo: {
    generic: u("photo-1611501275019-9b5cda994e8d"),
    before: u("photo-1590246814883-57c511f0e2a9"),
    after: u("photo-1611501275019-9b5cda994e8d"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["tattoo", "ink", "studio"],
      },
      {
        src: u("photo-1590246814883-57c511f0e2a9"),
        keywords: ["fine", "line", "delicate"],
      },
      {
        src: u("photo-1542727365-19732a80dcfd"),
        keywords: ["blackwork", "black", "bold"],
      },
      {
        src: u("photo-1542051841857-5f90071e7989"),
        keywords: ["cover", "cover-up", "session"],
      },
      {
        src: u("photo-1614850715649-1d0106293bd1"),
        keywords: ["touch", "touch-up", "refresh"],
      },
      {
        src: u("photo-1605497788044-5a32c7078486"),
        keywords: ["artist", "studio"],
      },
    ],
  },
  spa: {
    generic: u("photo-1540555700478-4be289fbecef"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1540555700478-4be289fbecef"),
        keywords: ["spa", "relax", "calm"],
      },
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["massage", "deep", "tissue"],
      },
      {
        src: u("photo-1519823551278-64ac92734fb1"),
        keywords: ["facial", "skin", "hydrating"],
      },
      {
        src: u("photo-1600334129128-685c5582fd35"),
        keywords: ["stone", "hot", "ritual"],
      },
      {
        src: u("photo-1596178060671-7a80dc8059ea"),
        keywords: ["couples", "escape", "suite"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["treatment", "body"],
      },
    ],
  },
  coach: {
    generic: u("photo-1522202176988-66273c2fd55f"),
    logos: TEMPLATE_LOGOS.slice(3, 11).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1522202176988-66273c2fd55f"),
        keywords: ["coach", "meeting", "team"],
      },
      {
        src: u("photo-1552664730-d307ca884978"),
        keywords: ["leadership", "session", "1:1"],
      },
      {
        src: u("photo-1517245386807-bb43f82c33c4"),
        keywords: ["career", "pivot", "workshop"],
      },
      {
        src: u("photo-1573496359142-b8d87734a5a2"),
        keywords: ["accountability", "check"],
      },
      {
        src: u("photo-1551836022-d5d88e9218df"),
        keywords: ["offsite", "facilitation"],
      },
      {
        src: u("photo-1600880292203-757bb62b4baf"),
        keywords: ["growth", "planning"],
      },
    ],
  },
  fitness: {
    generic: u("photo-1534438327276-14e5300c3a48"),
    logos: TEMPLATE_LOGOS.slice(4, 12).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1534438327276-14e5300c3a48"),
        keywords: ["gym", "fitness", "strength"],
      },
      {
        src: u("photo-1517836357463-d25dfeac3438"),
        keywords: ["personal", "training", "pt"],
      },
      {
        src: u("photo-1571019614242-c5c5dee9f50b"),
        keywords: ["hiit", "group", "circuit"],
      },
      {
        src: u("photo-1581009146145-b5ef050c2e1e"),
        keywords: ["mobility", "reset", "stretch"],
      },
      {
        src: u("photo-1549060279-7e168fcee0c2"),
        keywords: ["nutrition", "meal", "kickstart"],
      },
      {
        src: u("photo-1571902943202-507ec2618e8f"),
        keywords: ["studio", "workout"],
      },
      {
        src: u("photo-1534438327276-14e5300c3a48"),
        keywords: ["gym", "fitness", "strength"],
      },
      {
        src: u("photo-1517836357463-d25dfeac3438"),
        keywords: ["personal", "training", "pt"],
      },
    ],
  },
  photography: {
    generic: u("photo-1554048612-b6a482bc67e5"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1554048612-b6a482bc67e5"),
        keywords: ["photo", "camera", "studio"],
      },
      {
        src: u("photo-1531684096782-1af8c28ddb95"),
        keywords: ["portrait", "headshot"],
      },
      {
        src: u("photo-1492691527719-9d1e07e534b4"),
        keywords: ["brand", "story", "lifestyle"],
      },
      {
        src: u("photo-1471344170871-43e5a3f0d4b5"),
        keywords: ["event", "coverage", "wedding"],
      },
      {
        src: u("photo-1452587925148-ce544e77e70d"),
        keywords: ["product", "ecommerce"],
      },
      {
        src: u("photo-1542038784456-1ea8e935640e"),
        keywords: ["gallery", "lens"],
      },
      {
        src: u("photo-1554048612-b6a482bc67e5"),
        keywords: ["photo", "camera", "studio"],
      },
      {
        src: u("photo-1531684096782-1af8c28ddb95"),
        keywords: ["portrait", "headshot"],
      },
    ],
  },
  clinic: {
    generic: u("photo-1519494026892-80bbd2d6fd0d"),
    logos: TEMPLATE_LOGOS.slice(5, 13).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["clinic", "medical", "care"],
      },
      {
        src: u("photo-1576091160399-112ba8d25d1d"),
        keywords: ["checkup", "annual", "exam"],
      },
      {
        src: u("photo-1631217868264-e5b90bb7e133"),
        keywords: ["urgent", "injury", "visit"],
      },
      {
        src: u("photo-1584820927498-cfe5211fd8bf"),
        keywords: ["vaccine", "vaccination", "shot"],
      },
      {
        src: u("photo-1666214280557-f1b5022eb634"),
        keywords: ["telehealth", "video", "follow"],
      },
      {
        src: u("photo-1551076805-e1869033fa41"),
        keywords: ["family", "patient"],
      },
    ],
  },
  pet: {
    generic: u("photo-1548199973-03cce0bbc87b"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1548199973-03cce0bbc87b"),
        keywords: ["pet", "dog", "paws"],
      },
      {
        src: u("photo-1587300003388-59208cc962cb"),
        keywords: ["groom", "grooming", "bath"],
      },
      {
        src: u("photo-1516734212186-a967f81ad0d7"),
        keywords: ["walk", "leash", "neighborhood"],
      },
      {
        src: u("photo-1546527868-ccb7ee7dfa6a"),
        keywords: ["puppy", "social", "play"],
      },
      {
        src: u("photo-1623387641168-d9803ddd3f35"),
        keywords: ["nail", "trim", "express"],
      },
      {
        src: u("photo-1583511655857-d19b40a7a54e"),
        keywords: ["care", "happy"],
      },
    ],
  },
  home_services: {
    generic: u("photo-1581578731548-c64695cc6952"),
    logos: TEMPLATE_LOGOS.slice(6, 13).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1581578731548-c64695cc6952"),
        keywords: ["clean", "cleaning", "home"],
      },
      {
        src: u("photo-1556911220-bff31c812dba"),
        keywords: ["handyman", "repair", "fix"],
      },
      {
        src: u("photo-1621905251189-08b45d6a269e"),
        keywords: ["install", "appliance", "mount"],
      },
      {
        src: u("photo-1504328345606-18bbc8c9d7d1"),
        keywords: ["maintenance", "seasonal", "gutter"],
      },
      {
        src: u("photo-1600585154340-be6161a56a0c"),
        keywords: ["house", "exterior"],
      },
      {
        src: u("photo-1484154218962-a197022b5858"),
        keywords: ["kitchen", "deep"],
      },
      {
        src: u("photo-1581578731548-c64695cc6952"),
        keywords: ["clean", "cleaning", "home"],
      },
      {
        src: u("photo-1556911220-bff31c812dba"),
        keywords: ["handyman", "repair", "fix"],
      },
    ],
  },
  professional: {
    generic: u("photo-1454165804606-c3d57bc86b40"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1454165804606-c3d57bc86b40"),
        keywords: ["professional", "desk", "work"],
      },
      {
        src: u("photo-1556761175-b413da4baf72"),
        keywords: ["strategy", "consult", "meeting"],
      },
      {
        src: u("photo-1460925895917-afdab827c52f"),
        keywords: ["bookkeeping", "books", "finance"],
      },
      {
        src: u("photo-1507679799987-c73779587ccf"),
        keywords: ["tax", "planning", "review"],
      },
      {
        src: u("photo-1554224155-6726b3ff858f"),
        keywords: ["ops", "audit", "process"],
      },
      {
        src: u("photo-1521791136064-7986c2920216"),
        keywords: ["advisors", "handshake"],
      },
    ],
  },
};

/** First keyword hit for the service name, else pack generic image. */
export function matchServiceImage(
  packId: WebsitePackId,
  serviceName: string,
): string {
  const library = PACK_MEDIA[packId];
  if (!library) return "";
  const haystack = serviceName.toLowerCase();
  for (const item of library.items) {
    if (item.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      return item.src;
    }
  }
  return library.generic;
}
