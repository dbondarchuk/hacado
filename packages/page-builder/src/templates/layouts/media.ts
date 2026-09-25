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
    before: u("photo-1542727365-19732a80dcfd"),
    after: u("photo-1611501275019-9b5cda994e8d"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["tattoo", "ink", "studio"],
      },
      {
        src: u("photo-1542727365-19732a80dcfd"),
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
      {
        src: u("photo-1590247813693-5541d1c609fd"),
        keywords: ["ink", "arm"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
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
      {
        src: u("photo-1540555700478-4be289fbecef"),
        keywords: ["spa", "relax", "calm"],
      },
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["massage", "deep", "tissue"],
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
      {
        src: u("photo-1522071820081-009f0129c71c"),
        keywords: ["team", "meeting"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
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
        src: u("photo-1542038784456-1ea8e935640e"),
        keywords: ["gallery", "lens"],
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
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["family", "patient"],
      },
      {
        src: u("photo-1559839734-2b71ea197ec2"),
        keywords: ["physician", "consult"],
      },
      {
        src: u("photo-1584433144859-1fc3ab64a957"),
        keywords: ["nurse", "patient"],
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
      {
        src: u("photo-1601758228041-f3b2795255f1"),
        keywords: ["groom", "bath"],
      },
      {
        src: u("photo-1530281700549-e82e7bf110d6"),
        keywords: ["walk", "outdoor"],
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
      {
        src: u("photo-1520607162513-77705c0f0d4a"),
        keywords: ["office", "laptop"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  nails: {
    generic: u("photo-1604654894610-df63bc536371"),
    before: u("photo-1519014816548-bf5fe059798b"),
    after: u("photo-1604654894610-df63bc536371"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1604654894610-df63bc536371"),
        keywords: ["gel", "manicure", "nails"],
      },
      {
        src: u("photo-1519014816548-bf5fe059798b"),
        keywords: ["acrylic", "set", "sculpt", "builder"],
      },
      {
        src: u("photo-1632345031435-8727f6897d53"),
        keywords: ["art", "design", "chrome", "statement"],
      },
      {
        src: u("photo-1607779097040-26e80aa78e66"),
        keywords: ["fill", "refresh", "polish", "express"],
      },
      {
        src: u("photo-1522337660859-02fbefca4702"),
        keywords: ["studio", "hands", "beauty", "glass"],
      },
      {
        src: u("photo-1596462502278-27bfdc403348"),
        keywords: ["tools", "cuticle"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["glow", "finish", "atelier"],
      },
      {
        src: u("photo-1604654894610-df63bc536371"),
        keywords: ["nails", "gallery"],
      },
    ],
  },
  lash: {
    generic: u("photo-1583001931096-959e9a1a6223"),
    before: u("photo-1616394584738-fc6e612e71b9"),
    after: u("photo-1583001931096-959e9a1a6223"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["classic", "lash", "extensions", "silk", "map"],
      },
      {
        src: u("photo-1522335789203-aabd1fc54bc9"),
        keywords: ["volume", "makeup", "eyes", "soft", "couture", "mega"],
      },
      {
        src: u("photo-1616394584738-fc6e612e71b9"),
        keywords: ["brow", "lamination", "tint", "sculpt"],
      },
      {
        src: u("photo-1512496015851-a90fb38ba796"),
        keywords: ["fill", "refresh", "hybrid", "two-week"],
      },
      {
        src: u("photo-1526045478516-99145907023c"),
        keywords: ["beauty", "portrait"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["spa", "calm", "room"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["studio", "glow"],
      },
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["lash", "gallery"],
      },
    ],
  },
  salon_b: {
    generic: u("photo-1560066984-138dadb4c035"),
    before: u("photo-1562322140-8baeececf3df"),
    after: u("photo-1560066984-138dadb4c035"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["cut", "precision", "editorial"],
      },
      {
        src: u("photo-1562322140-8baeececf3df"),
        keywords: ["balayage", "color"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["mani", "nails"],
      },
      {
        src: u("photo-1516975080664-ed2fc6a32937"),
        keywords: ["styling", "event"],
      },
      {
        src: u("photo-1521590832167-7bcbfaa6381f"),
        keywords: ["salon", "interior"],
      },
      {
        src: u("photo-1492106087820-71f1a00d2b11"),
        keywords: ["hair", "finish"],
      },
      {
        src: u("photo-1522337360788-8b13dee7a37e"),
        keywords: ["cut", "style"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  tattoo_b: {
    generic: u("photo-1542727365-19732a80dcfd"),
    before: u("photo-1542051841857-5f90071e7989"),
    after: u("photo-1611501275019-9b5cda994e8d"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1542727365-19732a80dcfd"),
        keywords: ["fine", "line", "custom"],
      },
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["tattoo", "ink"],
      },
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["blackwork"],
      },
      {
        src: u("photo-1605497788044-5a32c7078486"),
        keywords: ["artist", "studio"],
      },
      {
        src: u("photo-1542051841857-5f90071e7989"),
        keywords: ["cover", "touch"],
      },
      {
        src: u("photo-1614850715649-1d0106293bd1"),
        keywords: ["touch", "refresh"],
      },
      {
        src: u("photo-1590247813693-5541d1c609fd"),
        keywords: ["ink", "arm"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  spa_b: {
    generic: u("photo-1544161515-4ab6ce6db874"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["massage"],
      },
      {
        src: u("photo-1540555700478-4be289fbecef"),
        keywords: ["spa", "relax"],
      },
      {
        src: u("photo-1600334129128-685c5582fd35"),
        keywords: ["scrub", "steam", "stone"],
      },
      {
        src: u("photo-1519823551278-64ac92734fb1"),
        keywords: ["facial", "glow"],
      },
      {
        src: u("photo-1596178060671-7a80dc8059ea"),
        keywords: ["soak", "private"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["treatment", "body"],
      },
      {
        src: u("photo-1515377905703-c4788e51af15"),
        keywords: ["ritual", "oil"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  coach_b: {
    generic: u("photo-1551836022-d5d88e9218df"),
    logos: TEMPLATE_LOGOS.slice(3, 11).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1551836022-d5d88e9218df"),
        keywords: ["executive", "intensive"],
      },
      {
        src: u("photo-1522202176988-66273c2fd55f"),
        keywords: ["coach", "meeting"],
      },
      {
        src: u("photo-1552664730-d307ca884978"),
        keywords: ["retainer", "leadership"],
      },
      {
        src: u("photo-1517245386807-bb43f82c33c4"),
        keywords: ["manager", "launch"],
      },
      {
        src: u("photo-1573496359142-b8d87734a5a2"),
        keywords: ["board", "prep"],
      },
      {
        src: u("photo-1600880292203-757bb62b4baf"),
        keywords: ["growth", "planning"],
      },
      {
        src: u("photo-1522071820081-009f0129c71c"),
        keywords: ["team", "meeting"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  fitness_b: {
    generic: u("photo-1517836357463-d25dfeac3438"),
    before: u("photo-1571019614242-c5c5dee9f50b"),
    after: u("photo-1517836357463-d25dfeac3438"),
    logos: TEMPLATE_LOGOS.slice(4, 12).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1517836357463-d25dfeac3438"),
        keywords: ["strength", "personal"],
      },
      {
        src: u("photo-1534438327276-14e5300c3a48"),
        keywords: ["gym", "fitness"],
      },
      {
        src: u("photo-1571019614242-c5c5dee9f50b"),
        keywords: ["conditioning", "engine"],
      },
      {
        src: u("photo-1581009146145-b5ef050c2e1e"),
        keywords: ["recovery", "mobility"],
      },
      {
        src: u("photo-1549060279-7e168fcee0c2"),
        keywords: ["team", "group"],
      },
      {
        src: u("photo-1571902943202-507ec2618e8f"),
        keywords: ["studio", "workout"],
      },
      {
        src: u("photo-1576678927484-cc907957088c"),
        keywords: ["gym", "rack"],
      },
      {
        src: u("photo-1434494878577-86c23bcb06b9"),
        keywords: ["training", "watch"],
      },
    ],
  },
  photography_b: {
    generic: u("photo-1492691527719-9d1e07e534b4"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1492691527719-9d1e07e534b4"),
        keywords: ["portrait", "golden"],
      },
      {
        src: u("photo-1554048612-b6a482bc67e5"),
        keywords: ["photo", "camera"],
      },
      {
        src: u("photo-1531684096782-1af8c28ddb95"),
        keywords: ["founder", "brand"],
      },
      {
        src: u("photo-1452587925148-ce544e77e70d"),
        keywords: ["product"],
      },
      {
        src: u("photo-1452587925148-ce544e77e70d"),
        keywords: ["event", "documentary"],
      },
      {
        src: u("photo-1542038784456-1ea8e935640e"),
        keywords: ["gallery", "lens"],
      },
      {
        src: u("photo-1516035069371-29a1b244cc32"),
        keywords: ["studio", "light"],
      },
      {
        src: u("photo-1507003211169-0a1dd7228f2d"),
        keywords: ["portrait", "face"],
      },
    ],
  },
  clinic_b: {
    generic: u("photo-1576091160399-112ba8d25d1d"),
    logos: TEMPLATE_LOGOS.slice(5, 13).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1576091160399-112ba8d25d1d"),
        keywords: ["wellness", "checkup"],
      },
      {
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["clinic", "care"],
      },
      {
        src: u("photo-1631217868264-e5b90bb7e133"),
        keywords: ["sick", "urgent"],
      },
      {
        src: u("photo-1666214280557-f1b5022eb634"),
        keywords: ["video", "telehealth"],
      },
      {
        src: u("photo-1584820927498-cfe5211fd8bf"),
        keywords: ["travel", "vaccine"],
      },
      {
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["family", "patient"],
      },
      {
        src: u("photo-1559839734-2b71ea197ec2"),
        keywords: ["physician", "consult"],
      },
      {
        src: u("photo-1584433144859-1fc3ab64a957"),
        keywords: ["nurse", "patient"],
      },
    ],
  },
  pet_b: {
    generic: u("photo-1587300003388-59208cc962cb"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1587300003388-59208cc962cb"),
        keywords: ["groom", "trail"],
      },
      {
        src: u("photo-1548199973-03cce0bbc87b"),
        keywords: ["pet", "dog"],
      },
      {
        src: u("photo-1516734212186-a967f81ad0d7"),
        keywords: ["walk", "adventure"],
      },
      {
        src: u("photo-1546527868-ccb7ee7dfa6a"),
        keywords: ["puppy"],
      },
      {
        src: u("photo-1450778869180-41d0601e046e"),
        keywords: ["deshed"],
      },
      {
        src: u("photo-1583511655857-d19b40a7a54e"),
        keywords: ["care", "happy"],
      },
      {
        src: u("photo-1601758228041-f3b2795255f1"),
        keywords: ["groom", "bath"],
      },
      {
        src: u("photo-1530281700549-e82e7bf110d6"),
        keywords: ["walk", "outdoor"],
      },
    ],
  },
  home_services_b: {
    generic: u("photo-1556911220-bff31c812dba"),
    logos: TEMPLATE_LOGOS.slice(6, 13).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1556911220-bff31c812dba"),
        keywords: ["handyman", "punch"],
      },
      {
        src: u("photo-1581578731548-c64695cc6952"),
        keywords: ["clean", "weekly"],
      },
      {
        src: u("photo-1621905251189-08b45d6a269e"),
        keywords: ["move", "detail"],
      },
      {
        src: u("photo-1504328345606-18bbc8c9d7d1"),
        keywords: ["fixture", "maintenance"],
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
        src: u("photo-1600585154526-990dced4db0d"),
        keywords: ["interior", "room"],
      },
      {
        src: u("photo-1600566753086-00f18fb6b3ea"),
        keywords: ["kitchen", "detail"],
      },
    ],
  },
  professional_b: {
    generic: u("photo-1556761175-b413da4baf72"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1556761175-b413da4baf72"),
        keywords: ["controller", "meeting"],
      },
      {
        src: u("photo-1454165804606-c3d57bc86b40"),
        keywords: ["books", "cleanup"],
      },
      {
        src: u("photo-1460925895917-afdab827c52f"),
        keywords: ["process", "ops"],
      },
      {
        src: u("photo-1507679799987-c73779587ccf"),
        keywords: ["tax"],
      },
      {
        src: u("photo-1554224155-6726b3ff858f"),
        keywords: ["finance", "reports"],
      },
      {
        src: u("photo-1521791136064-7986c2920216"),
        keywords: ["advisors", "handshake"],
      },
      {
        src: u("photo-1520607162513-77705c0f0d4a"),
        keywords: ["office", "laptop"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  nails_b: {
    generic: u("photo-1632345031435-8727f6897d53"),
    before: u("photo-1519014816548-bf5fe059798b"),
    after: u("photo-1632345031435-8727f6897d53"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1604654894610-df63bc536371"),
        keywords: ["gel", "manicure", "nails"],
      },
      {
        src: u("photo-1519014816548-bf5fe059798b"),
        keywords: ["acrylic", "set", "sculpt", "builder"],
      },
      {
        src: u("photo-1632345031435-8727f6897d53"),
        keywords: ["art", "design", "chrome", "statement"],
      },
      {
        src: u("photo-1607779097040-26e80aa78e66"),
        keywords: ["fill", "refresh", "polish", "express"],
      },
      {
        src: u("photo-1522337660859-02fbefca4702"),
        keywords: ["studio", "hands", "beauty", "glass"],
      },
      {
        src: u("photo-1596462502278-27bfdc403348"),
        keywords: ["tools", "cuticle"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["glow", "finish", "atelier"],
      },
      {
        src: u("photo-1632345031435-8727f6897d53"),
        keywords: ["nails", "gallery"],
      },
    ],
  },
  lash_b: {
    generic: u("photo-1522335789203-aabd1fc54bc9"),
    before: u("photo-1616394584738-fc6e612e71b9"),
    after: u("photo-1522335789203-aabd1fc54bc9"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["classic", "lash", "extensions", "silk", "map"],
      },
      {
        src: u("photo-1522335789203-aabd1fc54bc9"),
        keywords: ["volume", "makeup", "eyes", "soft", "couture", "mega"],
      },
      {
        src: u("photo-1616394584738-fc6e612e71b9"),
        keywords: ["brow", "lamination", "tint", "sculpt"],
      },
      {
        src: u("photo-1512496015851-a90fb38ba796"),
        keywords: ["fill", "refresh", "hybrid", "two-week"],
      },
      {
        src: u("photo-1526045478516-99145907023c"),
        keywords: ["beauty", "portrait"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["spa", "calm", "room"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["studio", "glow"],
      },
      {
        src: u("photo-1522335789203-aabd1fc54bc9"),
        keywords: ["lash", "gallery"],
      },
    ],
  },
  salon_c: {
    generic: u("photo-1522337360788-8b13dee7a37e"),
    before: u("photo-1519699047748-de8e457a634e"),
    after: u("photo-1522337360788-8b13dee7a37e"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1522337360788-8b13dee7a37e"),
        keywords: ["blowout", "style"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["color", "balayage"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["cut", "shape"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["event", "glam"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["salon", "hair"],
      },
      {
        src: u("photo-1519699047748-de8e457a634e"),
        keywords: ["before", "finish"],
      },
      {
        src: u("photo-1562322140-8baeececf3df"),
        keywords: ["salon", "stylist"],
      },
      {
        src: u("photo-1516975080664-ed2fc6a32937"),
        keywords: ["nails", "gel"],
      },
    ],
  },
  tattoo_c: {
    generic: u("photo-1611501275019-9b5cda994e8d"),
    before: u("photo-1542051841857-5f90071e7989"),
    after: u("photo-1611501275019-9b5cda994e8d"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1542727365-19732a80dcfd"),
        keywords: ["fine", "line"],
      },
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["blackwork", "tattoo"],
      },
      {
        src: u("photo-1542727365-19732a80dcfd"),
        keywords: ["custom", "consult"],
      },
      {
        src: u("photo-1590247813693-5541d1c609fd"),
        keywords: ["touch", "healed"],
      },
      {
        src: u("photo-1542051841857-5f90071e7989"),
        keywords: ["ink", "studio"],
      },
      {
        src: u("photo-1558618666-fcd25c85cd64"),
        keywords: ["artist", "gallery"],
      },
      {
        src: u("photo-1605497788044-5a32c7078486"),
        keywords: ["artist", "needle"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  spa_c: {
    generic: u("photo-1540555700478-4be289fbecef"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["massage", "mineral"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["facial", "botanical"],
      },
      {
        src: u("photo-1600334129128-685c5582fd35"),
        keywords: ["scrub", "steam"],
      },
      {
        src: u("photo-1507652313519-d4e9174996dd"),
        keywords: ["soak", "private"],
      },
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["spa", "ritual"],
      },
      {
        src: u("photo-1540555700478-4be289fbecef"),
        keywords: ["wellness", "calm"],
      },
      {
        src: u("photo-1515377905703-c4788e51af15"),
        keywords: ["ritual", "oil"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  coach_c: {
    generic: u("photo-1573496359142-b8d87734a5a2"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1551836022-d5d88e9218df"),
        keywords: ["leadership", "intensive"],
      },
      {
        src: u("photo-1552664730-d307ca884978"),
        keywords: ["career", "pivot"],
      },
      {
        src: u("photo-1522071820081-009f0129c71c"),
        keywords: ["manager", "launch"],
      },
      {
        src: u("photo-1517245386807-bb43f82c33c4"),
        keywords: ["accountability", "check"],
      },
      {
        src: u("photo-1600880292203-757bb62b4baf"),
        keywords: ["coaching", "meeting"],
      },
      {
        src: u("photo-1573496359142-b8d87734a5a2"),
        keywords: ["executive", "portrait"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  fitness_c: {
    generic: u("photo-1534438327276-14e5300c3a48"),
    before: u("photo-1517836357463-d25dfeac3438"),
    after: u("photo-1534438327276-14e5300c3a48"),
    logos: TEMPLATE_LOGOS.slice(3, 11).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1517836357463-d25dfeac3438"),
        keywords: ["strength"],
      },
      {
        src: u("photo-1571902943202-507ec2618e8f"),
        keywords: ["conditioning", "engine"],
      },
      {
        src: u("photo-1583454110551-21f2fa2afe61"),
        keywords: ["mobility", "recovery"],
      },
      {
        src: u("photo-1571019614242-c5c5dee9f50b"),
        keywords: ["team", "group"],
      },
      {
        src: u("photo-1574680096145-d05b474e2155"),
        keywords: ["gym", "training"],
      },
      {
        src: u("photo-1534438327276-14e5300c3a48"),
        keywords: ["athletics", "fitness"],
      },
      {
        src: u("photo-1576678927484-cc907957088c"),
        keywords: ["gym", "rack"],
      },
      {
        src: u("photo-1434494878577-86c23bcb06b9"),
        keywords: ["training", "watch"],
      },
    ],
  },
  photography_c: {
    generic: u("photo-1492691527719-9d1e07e534b4"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1516035069371-29a1b244cc32"),
        keywords: ["portrait"],
      },
      {
        src: u("photo-1554048612-b6a482bc67e5"),
        keywords: ["brand", "story"],
      },
      {
        src: u("photo-1492684223066-81342ee5ff30"),
        keywords: ["event"],
      },
      {
        src: u("photo-1526170375885-4d8ecf77b99f"),
        keywords: ["product"],
      },
      {
        src: u("photo-1502920917128-1aa500764cbd"),
        keywords: ["camera", "studio"],
      },
      {
        src: u("photo-1492691527719-9d1e07e534b4"),
        keywords: ["cinematic", "photo"],
      },
      {
        src: u("photo-1507003211169-0a1dd7228f2d"),
        keywords: ["portrait", "face"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  clinic_c: {
    generic: u("photo-1631217868264-e5b90bb7e133"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1576091160399-112ba8d25d1d"),
        keywords: ["wellness", "checkup"],
      },
      {
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["sick", "urgent"],
      },
      {
        src: u("photo-1666214280557-f1b5022eb634"),
        keywords: ["travel", "vaccine"],
      },
      {
        src: u("photo-1584820927498-cfe5211fd8bf"),
        keywords: ["video", "telehealth"],
      },
      {
        src: u("photo-1579684385127-1ef15d508118"),
        keywords: ["clinic", "care"],
      },
      {
        src: u("photo-1631217868264-e5b90bb7e133"),
        keywords: ["medical", "exam"],
      },
      {
        src: u("photo-1559839734-2b71ea197ec2"),
        keywords: ["physician", "consult"],
      },
      {
        src: u("photo-1584433144859-1fc3ab64a957"),
        keywords: ["nurse", "patient"],
      },
    ],
  },
  pet_c: {
    generic: u("photo-1548199973-03cce0bbc87b"),
    before: u("photo-1546527868-ccb7ee7dfa6a"),
    after: u("photo-1548199973-03cce0bbc87b"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1587300003388-59208cc962cb"),
        keywords: ["groom"],
      },
      {
        src: u("photo-1516734212186-a967f81ad0d7"),
        keywords: ["walk", "adventure"],
      },
      {
        src: u("photo-1450778869180-41d0601e046e"),
        keywords: ["puppy"],
      },
      {
        src: u("photo-1546527868-ccb7ee7dfa6a"),
        keywords: ["deshed"],
      },
      {
        src: u("photo-1583511655857-d19b40a7a54e"),
        keywords: ["dog", "pet"],
      },
      {
        src: u("photo-1548199973-03cce0bbc87b"),
        keywords: ["play", "happy"],
      },
      {
        src: u("photo-1601758228041-f3b2795255f1"),
        keywords: ["groom", "bath"],
      },
      {
        src: u("photo-1530281700549-e82e7bf110d6"),
        keywords: ["walk", "outdoor"],
      },
    ],
  },
  home_services_c: {
    generic: u("photo-1581578731548-c64695cc6952"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1556911220-bff31c812dba"),
        keywords: ["clean", "weekly"],
      },
      {
        src: u("photo-1621905251189-08b45d6a269e"),
        keywords: ["handyman", "punch"],
      },
      {
        src: u("photo-1504328345606-18bbc8c9d7d1"),
        keywords: ["move", "detail"],
      },
      {
        src: u("photo-1600585154340-be6161a56a0c"),
        keywords: ["fixture", "filter"],
      },
      {
        src: u("photo-1484154218962-a197022b5858"),
        keywords: ["home", "kitchen"],
      },
      {
        src: u("photo-1581578731548-c64695cc6952"),
        keywords: ["cleaning", "service"],
      },
      {
        src: u("photo-1600585154526-990dced4db0d"),
        keywords: ["interior", "room"],
      },
      {
        src: u("photo-1600566753086-00f18fb6b3ea"),
        keywords: ["kitchen", "detail"],
      },
    ],
  },
  professional_c: {
    generic: u("photo-1454165804606-c3d57bc86b40"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1556761175-b413da4baf72"),
        keywords: ["controller", "meeting"],
      },
      {
        src: u("photo-1454165804606-c3d57bc86b40"),
        keywords: ["books", "cleanup"],
      },
      {
        src: u("photo-1460925895917-afdab827c52f"),
        keywords: ["process", "ops"],
      },
      {
        src: u("photo-1507679799987-c73779587ccf"),
        keywords: ["tax"],
      },
      {
        src: u("photo-1554224155-6726b3ff858f"),
        keywords: ["finance", "reports"],
      },
      {
        src: u("photo-1521791136064-7986c2920216"),
        keywords: ["advisors", "handshake"],
      },
      {
        src: u("photo-1520607162513-77705c0f0d4a"),
        keywords: ["office", "laptop"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  nails_c: {
    generic: u("photo-1607779097040-26e80aa78e66"),
    before: u("photo-1519014816548-bf5fe059798b"),
    after: u("photo-1607779097040-26e80aa78e66"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1604654894610-df63bc536371"),
        keywords: ["gel", "manicure", "nails"],
      },
      {
        src: u("photo-1519014816548-bf5fe059798b"),
        keywords: ["acrylic", "set", "sculpt", "builder"],
      },
      {
        src: u("photo-1632345031435-8727f6897d53"),
        keywords: ["art", "design", "chrome", "statement"],
      },
      {
        src: u("photo-1607779097040-26e80aa78e66"),
        keywords: ["fill", "refresh", "polish", "express"],
      },
      {
        src: u("photo-1522337660859-02fbefca4702"),
        keywords: ["studio", "hands", "beauty", "glass"],
      },
      {
        src: u("photo-1596462502278-27bfdc403348"),
        keywords: ["tools", "cuticle"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["glow", "finish", "atelier"],
      },
      {
        src: u("photo-1607779097040-26e80aa78e66"),
        keywords: ["nails", "gallery"],
      },
    ],
  },
  lash_c: {
    generic: u("photo-1512496015851-a90fb38ba796"),
    before: u("photo-1616394584738-fc6e612e71b9"),
    after: u("photo-1512496015851-a90fb38ba796"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["classic", "lash", "extensions", "silk", "map"],
      },
      {
        src: u("photo-1522335789203-aabd1fc54bc9"),
        keywords: ["volume", "makeup", "eyes", "soft", "couture", "mega"],
      },
      {
        src: u("photo-1616394584738-fc6e612e71b9"),
        keywords: ["brow", "lamination", "tint", "sculpt"],
      },
      {
        src: u("photo-1512496015851-a90fb38ba796"),
        keywords: ["fill", "refresh", "hybrid", "two-week"],
      },
      {
        src: u("photo-1526045478516-99145907023c"),
        keywords: ["beauty", "portrait"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["spa", "calm", "room"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["studio", "glow"],
      },
      {
        src: u("photo-1512496015851-a90fb38ba796"),
        keywords: ["lash", "gallery"],
      },
    ],
  },
  salon_d: {
    generic: u("photo-1522338140262-f46f5913618a"),
    video:
      "https://cdn.coverr.co/videos/coverr-hairdresser-cutting-hair-4065/1080p.mp4",
    before: u("photo-1516975080664-ed2fc6a32937"),
    after: u("photo-1522338140262-f46f5913618a"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["cut", "shape"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["color", "glass"],
      },
      {
        src: u("photo-1522337360788-8b13dee7a37e"),
        keywords: ["blowout", "blow"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["event", "finish"],
      },
      {
        src: u("photo-1521590832167-7bcbfaa6381f"),
        keywords: ["salon", "hair"],
      },
      {
        src: u("photo-1519699047748-de8e457a634e"),
        keywords: ["lookbook", "portrait"],
      },
      {
        src: u("photo-1562322140-8baeececf3df"),
        keywords: ["salon", "stylist"],
      },
      {
        src: u("photo-1516975080664-ed2fc6a32937"),
        keywords: ["nails", "gel"],
      },
    ],
  },
  tattoo_d: {
    generic: u("photo-1611501275019-9b5cda994e8d"),
    video:
      "https://cdn.coverr.co/videos/coverr-hairdresser-cutting-hair-4065/1080p.mp4",
    before: u("photo-1542727365-19732a80dcfd"),
    after: u("photo-1611501275019-9b5cda994e8d"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1542727365-19732a80dcfd"),
        keywords: ["fine", "line"],
      },
      {
        src: u("photo-1611501275019-9b5cda994e8d"),
        keywords: ["blackwork", "tattoo"],
      },
      {
        src: u("photo-1542051841857-5f90071e7989"),
        keywords: ["custom", "consult"],
      },
      {
        src: u("photo-1590247813693-5541d1c609fd"),
        keywords: ["touch", "healed"],
      },
      {
        src: u("photo-1558618666-fcd25c85cd64"),
        keywords: ["artist", "gallery"],
      },
      {
        src: u("photo-1605497788044-5a32c7078486"),
        keywords: ["ink", "studio"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  spa_d: {
    generic: u("photo-1540555700478-4be289fbecef"),
    video:
      "https://cdn.coverr.co/videos/coverr-woman-getting-a-facial-treatment-5585/1080p.mp4",
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1544161515-4ab6ce6db874"),
        keywords: ["massage", "mineral"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["facial", "botanical"],
      },
      {
        src: u("photo-1600334129128-685c5582fd35"),
        keywords: ["scrub", "steam"],
      },
      {
        src: u("photo-1507652313519-d4e9174996dd"),
        keywords: ["soak", "private"],
      },
      {
        src: u("photo-1515377905703-c4788e51af15"),
        keywords: ["spa", "ritual"],
      },
      {
        src: u("photo-1540555700478-4be289fbecef"),
        keywords: ["wellness", "calm"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  coach_d: {
    generic: u("photo-1573496359142-b8d87734a5a2"),
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-working-on-a-laptop-5633/1080p.mp4",
    logos: TEMPLATE_LOGOS.slice(3, 11).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1551836022-d5d88e9218df"),
        keywords: ["leadership", "intensive"],
      },
      {
        src: u("photo-1522071820081-009f0129c71c"),
        keywords: ["career", "pivot"],
      },
      {
        src: u("photo-1556761175-b413da4baf72"),
        keywords: ["manager", "launch"],
      },
      {
        src: u("photo-1517245386807-bb43f82c33c4"),
        keywords: ["accountability", "check"],
      },
      {
        src: u("photo-1552664730-d307ca884978"),
        keywords: ["coach", "draft"],
      },
      {
        src: u("photo-1507679799987-c73779587ccf"),
        keywords: ["executive", "meeting"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
      {
        src: u("photo-1560066984-138dadb4c035"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  fitness_d: {
    generic: u("photo-1534438327276-14e5300c3a48"),
    video:
      "https://cdn.coverr.co/videos/coverr-working-out-in-the-gym-5631/1080p.mp4",
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1517836357463-d25dfeac3438"),
        keywords: ["strength"],
      },
      {
        src: u("photo-1571019614242-c5c5dee9f50b"),
        keywords: ["conditioning", "engine"],
      },
      {
        src: u("photo-1583454110551-21f2fa2afe61"),
        keywords: ["mobility", "recovery"],
      },
      {
        src: u("photo-1540497077202-7c8a3999166f"),
        keywords: ["team", "group"],
      },
      {
        src: u("photo-1518611012118-696072aa579a"),
        keywords: ["gym", "volt"],
      },
      {
        src: u("photo-1434494878577-86c23bcb06b9"),
        keywords: ["training", "class"],
      },
      {
        src: u("photo-1576678927484-cc907957088c"),
        keywords: ["gym", "rack"],
      },
      {
        src: u("photo-1534438327276-14e5300c3a48"),
        keywords: ["studio", "class"],
      },
    ],
  },
  photography_d: {
    generic: u("photo-1492691527719-9d1e07e534b4"),
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-working-on-a-laptop-5633/1080p.mp4",
    before: u("photo-1516035069371-29a1b244cc32"),
    after: u("photo-1492691527719-9d1e07e534b4"),
    logos: TEMPLATE_LOGOS.slice(4, 12).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1507003211169-0a1dd7228f2d"),
        keywords: ["portrait"],
      },
      {
        src: u("photo-1531746020798-e6953c6e8e04"),
        keywords: ["brand", "story"],
      },
      {
        src: u("photo-1469334031218-e382a71b716b"),
        keywords: ["event"],
      },
      {
        src: u("photo-1542038784456-1ea8e935640e"),
        keywords: ["product"],
      },
      {
        src: u("photo-1554048612-b6a482bc67e5"),
        keywords: ["camera", "field"],
      },
      {
        src: u("photo-1516035069371-29a1b244cc32"),
        keywords: ["studio", "light"],
      },
      {
        src: u("photo-1492691527719-9d1e07e534b4"),
        keywords: ["camera", "lens"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  clinic_d: {
    generic: u("photo-1576091160399-112ba8d25d1d"),
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-working-on-a-laptop-5633/1080p.mp4",
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1631217868264-e5b90bb7e133"),
        keywords: ["wellness", "checkup"],
      },
      {
        src: u("photo-1584820927498-cfe5211fd8bf"),
        keywords: ["sick", "urgent"],
      },
      {
        src: u("photo-1579684385127-1ef15d508118"),
        keywords: ["travel", "vaccine"],
      },
      {
        src: u("photo-1559839734-2b71ea197ec2"),
        keywords: ["video", "telehealth"],
      },
      {
        src: u("photo-1584433144859-1fc3ab64a957"),
        keywords: ["clinic", "care"],
      },
      {
        src: u("photo-1519494026892-80bbd2d6fd0d"),
        keywords: ["team", "nurse"],
      },
      {
        src: u("photo-1576091160399-112ba8d25d1d"),
        keywords: ["clinic", "care"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  pet_d: {
    generic: u("photo-1587300003388-59208cc962cb"),
    video:
      "https://cdn.coverr.co/videos/coverr-woman-getting-a-facial-treatment-5585/1080p.mp4",
    before: u("photo-1548199973-03cce0bbc87b"),
    after: u("photo-1587300003388-59208cc962cb"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1601758228041-f3b2795255f1"),
        keywords: ["groom"],
      },
      {
        src: u("photo-1530281700549-e82e7bf110d6"),
        keywords: ["walk", "adventure"],
      },
      {
        src: u("photo-1583511655857-d19b40a7a54e"),
        keywords: ["puppy"],
      },
      {
        src: u("photo-1450778869180-41d0601e046e"),
        keywords: ["deshed"],
      },
      {
        src: u("photo-1516734212186-a967f81ad0d7"),
        keywords: ["dog", "trail"],
      },
      {
        src: u("photo-1548199973-03cce0bbc87b"),
        keywords: ["pet", "play"],
      },
      {
        src: u("photo-1587300003388-59208cc962cb"),
        keywords: ["dog", "happy"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  home_services_d: {
    generic: u("photo-1581578731548-c64695cc6952"),
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-working-on-a-laptop-5633/1080p.mp4",
    before: u("photo-1560185127-6ed189bf02f4"),
    after: u("photo-1600585154340-be6161a56a0c"),
    logos: TEMPLATE_LOGOS.slice(0, 8).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1556912173-46c336c7fd55"),
        keywords: ["clean", "weekly"],
      },
      {
        src: u("photo-1484154218962-a197022b5858"),
        keywords: ["handyman", "punch"],
      },
      {
        src: u("photo-1600566753190-17f0baa2a6c3"),
        keywords: ["move", "detail"],
      },
      {
        src: u("photo-1600585154526-990dced4db0d"),
        keywords: ["filter", "fixture"],
      },
      {
        src: u("photo-1581578731548-c64695cc6952"),
        keywords: ["home", "threshold"],
      },
      {
        src: u("photo-1600585154340-be6161a56a0c"),
        keywords: ["project", "finish"],
      },
      {
        src: u("photo-1600566753086-00f18fb6b3ea"),
        keywords: ["kitchen", "detail"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  professional_d: {
    generic: u("photo-1454165804606-c3d57bc86b40"),
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-working-on-a-laptop-5633/1080p.mp4",
    logos: TEMPLATE_LOGOS.slice(3, 11).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1554224155-6726b3ff858f"),
        keywords: ["books", "cleanup"],
      },
      {
        src: u("photo-1460925895917-afdab827c52f"),
        keywords: ["controller", "fractional"],
      },
      {
        src: u("photo-1551836022-4c4c79ecde51"),
        keywords: ["process", "ops"],
      },
      {
        src: u("photo-1507679799987-c73779587ccf"),
        keywords: ["tax"],
      },
      {
        src: u("photo-1556761175-5973dc0f32e7"),
        keywords: ["ledger", "finance"],
      },
      {
        src: u("photo-1520607162513-77705c0f0d4a"),
        keywords: ["advisors", "desk"],
      },
      {
        src: u("photo-1454165804606-c3d57bc86b40"),
        keywords: ["desk", "work"],
      },
      {
        src: u("photo-1522338140262-f46f5913618a"),
        keywords: ["gallery", "look"],
      },
    ],
  },
  nails_d: {
    generic: u("photo-1522337660859-02fbefca4702"),
    before: u("photo-1519014816548-bf5fe059798b"),
    after: u("photo-1522337660859-02fbefca4702"),
    logos: TEMPLATE_LOGOS.slice(1, 9).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1604654894610-df63bc536371"),
        keywords: ["gel", "manicure", "nails"],
      },
      {
        src: u("photo-1519014816548-bf5fe059798b"),
        keywords: ["acrylic", "set", "sculpt", "builder"],
      },
      {
        src: u("photo-1632345031435-8727f6897d53"),
        keywords: ["art", "design", "chrome", "statement"],
      },
      {
        src: u("photo-1607779097040-26e80aa78e66"),
        keywords: ["fill", "refresh", "polish", "express"],
      },
      {
        src: u("photo-1522337660859-02fbefca4702"),
        keywords: ["studio", "hands", "beauty", "glass"],
      },
      {
        src: u("photo-1596462502278-27bfdc403348"),
        keywords: ["tools", "cuticle"],
      },
      {
        src: u("photo-1487412947147-5cebf100ffc2"),
        keywords: ["glow", "finish", "atelier"],
      },
      {
        src: u("photo-1522337660859-02fbefca4702"),
        keywords: ["nails", "gallery"],
      },
    ],
  },
  lash_d: {
    generic: u("photo-1583001931096-959e9a1a6223"),
    before: u("photo-1616394584738-fc6e612e71b9"),
    after: u("photo-1583001931096-959e9a1a6223"),
    logos: TEMPLATE_LOGOS.slice(2, 10).map((l) => ({ ...l })),
    items: [
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["classic", "lash", "extensions", "silk", "map"],
      },
      {
        src: u("photo-1522335789203-aabd1fc54bc9"),
        keywords: ["volume", "makeup", "eyes", "soft", "couture", "mega"],
      },
      {
        src: u("photo-1616394584738-fc6e612e71b9"),
        keywords: ["brow", "lamination", "tint", "sculpt"],
      },
      {
        src: u("photo-1512496015851-a90fb38ba796"),
        keywords: ["fill", "refresh", "hybrid", "two-week"],
      },
      {
        src: u("photo-1526045478516-99145907023c"),
        keywords: ["beauty", "portrait"],
      },
      {
        src: u("photo-1570172619644-dfd03ed5d881"),
        keywords: ["spa", "calm", "room"],
      },
      {
        src: u("photo-1595476108010-b4d1f102b1b1"),
        keywords: ["studio", "glow"],
      },
      {
        src: u("photo-1583001931096-959e9a1a6223"),
        keywords: ["lash", "gallery"],
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
