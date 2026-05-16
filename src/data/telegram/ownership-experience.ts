import type { KnowledgeArticle } from "@/types/telegram";

export const ownershipExperienceArticles: KnowledgeArticle[] = [
  {
    id: "first-week-yuan-up",
    slug: "first-week-yuan-up",
    title: "First week with BYD YUAN UP",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "beginner", "setup"],
    summary: "A practical owner-style checklist for the first days after delivery.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "What owners notice first",
        body: "The first week is usually about learning charging habits, display menus, driver assistance settings, and how range changes with weather and speed.",
      },
      {
        heading: "Useful first checks",
        body: "Pair the phone, set preferred charging limits, inspect included cables, check tire pressure, and save trusted charging locations.",
      },
    ],
    tips: ["Keep a small note of questions for the dealer or service center."],
  },
  {
    id: "city-consumption-experience",
    slug: "city-consumption-experience",
    title: "Real city consumption",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "consumption", "city"],
    summary: "Owner-style notes about why city efficiency changes day to day.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Typical pattern",
        body: "City consumption can be efficient because speeds are lower and regenerative braking helps. Short cold trips, heater use, traffic, and tire pressure can change the result.",
      },
      {
        heading: "How to compare",
        body: "Compare similar routes and weather instead of single drives. One unusually high trip does not prove a problem.",
      },
    ],
  },
  {
    id: "highway-consumption-experience",
    slug: "highway-consumption-experience",
    title: "Highway consumption",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "consumption", "highway"],
    summary: "Why faster roads use more energy and need more planning.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Speed matters",
        body: "At highway speeds, air resistance becomes a major energy user. Small speed reductions can noticeably improve range.",
      },
      {
        heading: "Trip planning",
        body: "Plan charging stops with a buffer, especially in cold weather, rain, wind, or when carrying more passengers and luggage.",
      },
    ],
  },
  {
    id: "winter-consumption-experience",
    slug: "winter-consumption-experience",
    title: "Winter consumption",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "winter", "range"],
    summary: "Cold weather range loss explained in owner-friendly terms.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Why winter feels different",
        body: "Heating, cold battery chemistry, winter tires, wet roads, and denser air can all increase energy use.",
      },
      {
        heading: "Better habits",
        body: "Preheat while plugged in when possible, keep tire pressure correct, and plan extra range buffer for long trips.",
      },
    ],
  },
  {
    id: "cabin-comfort-experience",
    slug: "cabin-comfort-experience",
    title: "Cabin comfort",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "comfort", "cabin"],
    summary: "Subjective comfort notes owners often compare after purchase.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "What to observe",
        body: "Seat comfort, visibility, climate behavior, storage space, noise, and rear passenger comfort are best judged on your own common routes.",
      },
      {
        heading: "Small adjustments",
        body: "Spend time with seating position, mirrors, climate presets, and display brightness before judging the cabin.",
      },
    ],
  },
  {
    id: "multimedia-impressions",
    slug: "multimedia-impressions",
    title: "Multimedia impressions",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "multimedia", "settings"],
    summary: "A practical way to evaluate the infotainment system.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Daily usability",
        body: "Owners usually care most about phone connection reliability, navigation comfort, audio controls, camera clarity, and whether common actions are easy while parked.",
      },
      {
        heading: "Setup habit",
        body: "Check permissions, Bluetooth names, language, map settings, and shortcut layout during the first week.",
      },
    ],
  },
  {
    id: "what-owners-like",
    slug: "what-owners-like",
    title: "What owners usually like",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "likes", "community"],
    summary: "Subjective positives commonly discussed by compact EV owners.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Common positives",
        body: "Owners often appreciate quiet city driving, easy home charging, low routine running effort, compact parking, and the feeling of leaving each morning with planned range.",
      },
    ],
    warnings: ["This is owner experience content, not an official product claim."],
  },
  {
    id: "what-owners-complain-about",
    slug: "what-owners-complain-about",
    title: "What owners usually complain about",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "complaints", "community"],
    summary: "Subjective friction points to watch during ownership.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Common friction",
        body: "Complaints often involve winter range, charging app reliability, unfamiliar settings, cable storage, public charger confusion, or service communication.",
      },
      {
        heading: "How to use this",
        body: "Treat complaints as things to check for your own car and market, not as proof that every vehicle has the same issue.",
      },
    ],
  },
  {
    id: "useful-settings-after-purchase",
    slug: "useful-settings-after-purchase",
    title: "Useful settings after purchase",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["settings", "beginner", "delivery"],
    summary: "Settings many new owners review early.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Review list",
        body: "Check charging target, scheduled charging, driver assistance sensitivity, display brightness, language, units, phone pairing, and climate shortcuts.",
      },
      {
        heading: "Take it slowly",
        body: "Change one setting at a time so it is easy to understand what changed.",
      },
    ],
  },
  {
    id: "common-beginner-mistakes",
    slug: "common-beginner-mistakes",
    title: "Common beginner mistakes",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["beginner", "mistakes", "owner experience"],
    summary: "Easy mistakes that make the first EV weeks more confusing.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Charging mistakes",
        body: "New owners may confuse kW with kWh, expect the last 20% to charge quickly, or forget scheduled charging is enabled.",
      },
      {
        heading: "Range mistakes",
        body: "Judging range from one cold short trip can be misleading. Look at patterns over several drives.",
      },
    ],
  },
  {
    id: "long-trip-preparation",
    slug: "long-trip-preparation",
    title: "Long trip preparation",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["trip", "planning", "charging"],
    summary: "A calm checklist before a longer drive.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Before leaving",
        body: "Charge higher if needed, check tire pressure, review route chargers, save backup chargers, and bring the right cable if public AC charging is planned.",
      },
      {
        heading: "During the trip",
        body: "Keep a buffer and avoid arriving at a charger with no backup plan if the station is busy or offline.",
      },
    ],
  },
  {
    id: "real-owner-charging-habits",
    slug: "real-owner-charging-habits",
    title: "Charging habits from real owners",
    category: "Ownership",
    categorySlug: "ownership",
    tags: ["owner experience", "charging habits", "daily"],
    summary: "Typical habits owners build after the first month.",
    updatedAt: "2026-05-16",
    sourceLabel: "Manually curated Phase 1.5",
    sections: [
      {
        heading: "Common routine",
        body: "Many owners stop thinking about charging every day. They plug in on predictable nights, charge more before trips, and use public fast charging only when it saves time.",
      },
    ],
    warnings: ["This is manually curated Phase 1 content. Community import comes later."],
  },
];
