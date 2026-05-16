import type { KnowledgeArticle } from "@/data/telegram/categories";

export const chargingGuides: KnowledgeArticle[] = [
  {
    id: "home-charging-basics",
    title: "Home charging basics",
    category: "Charging",
    tags: ["home", "daily charging", "AC"],
    summary: "A simple owner-friendly routine for charging BYD YUAN UP at home.",
    sections: [
      {
        heading: "What home charging means",
        body: "Home charging is usually AC charging while the car is parked for several hours. It is the most convenient way to keep the car ready for city driving.",
      },
      {
        heading: "Daily routine",
        body: "Plug in when the car will sit for a while, set a sensible target if your car or charger supports it, and confirm charging starts before walking away.",
      },
    ],
    tips: [
      "Use overnight charging if your electricity plan is cheaper at night.",
      "Check the plug and cable temperature during the first sessions.",
    ],
    warnings: ["Use properly rated equipment and a safe grounded circuit."],
    relatedIds: ["twenty-eighty-rule", "charging-troubleshooting"],
  },
  {
    id: "slow-ac-charging",
    title: "Slow AC charging",
    category: "Charging",
    tags: ["slow charging", "AC", "battery care"],
    summary: "Why slow AC charging is useful for daily ownership.",
    sections: [
      {
        heading: "Best use case",
        body: "Slow AC charging works well when the car is parked overnight or during a long workday. It trades speed for simplicity and lower heat.",
      },
      {
        heading: "Owner expectation",
        body: "At low power, charging can take many hours. That is normal and not a fault if the car still reaches the target by departure.",
      },
    ],
    tips: ["Use the calculator to estimate whether overnight charging is enough."],
    relatedIds: ["household-socket-charging"],
  },
  {
    id: "household-socket-charging",
    title: "Charging from household socket",
    category: "Charging",
    tags: ["socket", "portable EVSE", "safety"],
    summary: "How to think about occasional household socket charging safely.",
    sections: [
      {
        heading: "When it helps",
        body: "A household socket can be useful for occasional top-ups, travel stays, or backup charging when no wallbox is available.",
      },
      {
        heading: "What to check",
        body: "The outlet should be grounded, undamaged, and suitable for continuous load. Avoid loose adapters and damaged portable chargers.",
      },
    ],
    tips: ["Lower current is safer on unknown wiring.", "Stop if the plug or outlet becomes hot."],
    warnings: [
      "Do not use ordinary light-duty extension cords for EV charging.",
      "Ask an electrician before making a household socket your daily charger.",
    ],
  },
  {
    id: "wallbox-charging",
    title: "Charging from wallbox",
    category: "Charging",
    tags: ["wallbox", "home", "AC"],
    summary: "Why a wallbox is usually the cleaner daily home charging setup.",
    sections: [
      {
        heading: "Why owners choose it",
        body: "A wallbox can provide a neater cable setup, better protection, current limits, and faster AC charging than a household socket.",
      },
      {
        heading: "Installation",
        body: "A qualified installer should size the circuit, protection, and cable routing for your home.",
      },
    ],
    tips: ["Choose a wallbox with clear current settings and scheduling if possible."],
    warnings: ["Do not self-install high-power electrical equipment."],
  },
  {
    id: "public-ac-charging",
    title: "Public AC charging",
    category: "Charging",
    tags: ["public charging", "AC", "cable"],
    summary: "Useful for longer parking sessions in cities and shopping areas.",
    sections: [
      {
        heading: "How it feels",
        body: "Public AC charging is usually slower than DC fast charging, but it is convenient while shopping, working, or parking for a few hours.",
      },
      {
        heading: "Cable planning",
        body: "Some stations require your own Type 2 cable. Keep the cable accessible and clean.",
      },
    ],
    tips: ["Check station rules for idle fees before leaving the car."],
  },
  {
    id: "public-dc-charging",
    title: "Public DC charging",
    category: "Charging",
    tags: ["public charging", "DC", "road trip"],
    summary: "Fast charging basics for road trips and quick stops.",
    sections: [
      {
        heading: "When to use it",
        body: "DC charging is best when time matters, such as road trips or busy days. It is not required for most home-based daily use.",
      },
      {
        heading: "Power taper",
        body: "Charging power often drops at higher battery percentages. A shorter stop to around 80% can be faster than waiting for 100%.",
      },
    ],
    tips: ["Arrive with a warm battery when possible in winter.", "Plan backup stations on long trips."],
    relatedIds: ["charging-slows-near-full"],
  },
  {
    id: "winter-charging",
    title: "Winter charging",
    category: "Charging",
    tags: ["winter", "cold", "battery"],
    summary: "Cold weather can reduce charging speed and increase energy use.",
    sections: [
      {
        heading: "What changes",
        body: "Cold batteries may accept less power, and some energy may be used to warm the battery or cabin.",
      },
      {
        heading: "Practical habit",
        body: "If possible, charge after driving when the battery is warmer, and allow more time in freezing weather.",
      },
    ],
    tips: ["Keep a larger range buffer in winter.", "Use preheating while plugged in if available."],
  },
  {
    id: "battery-care",
    title: "Battery care",
    category: "Charging",
    tags: ["battery", "daily charging", "health"],
    summary: "Simple habits that reduce battery stress.",
    sections: [
      {
        heading: "Daily use",
        body: "Many owners use the middle of the battery for daily driving and charge higher only when needed.",
      },
      {
        heading: "Heat and extremes",
        body: "Avoid leaving the car very low or very high for long periods when you can. Temperature and time both matter.",
      },
    ],
    tips: ["Stable habits matter more than perfect percentages."],
    relatedIds: ["twenty-eighty-rule", "charging-to-100"],
  },
  {
    id: "twenty-eighty-rule",
    title: "20-80% daily charging rule",
    category: "Charging",
    tags: ["20-80", "battery", "daily"],
    summary: "A practical daily range many EV owners use.",
    sections: [
      {
        heading: "Why it helps",
        body: "The middle of the battery is comfortable for daily use. It avoids very low charge and reduces time spent near full.",
      },
      {
        heading: "Not a strict law",
        body: "Use the full battery when you need range. The rule is a daily habit, not a reason to avoid useful trips.",
      },
    ],
    tips: ["Charge higher before road trips, then drive soon after charging finishes."],
  },
  {
    id: "charging-to-100",
    title: "Charging to 100%",
    category: "Charging",
    tags: ["100%", "range", "trip"],
    summary: "When full charging makes sense and how to use it calmly.",
    sections: [
      {
        heading: "Good reasons",
        body: "Charge to 100% before long drives, remote routes, or days when you cannot rely on charging.",
      },
      {
        heading: "Timing",
        body: "Try to finish close to departure instead of leaving the car full for a long time.",
      },
    ],
    tips: ["Use scheduled charging if your car or charger supports it."],
  },
  {
    id: "charging-slows-near-full",
    title: "Why charging slows near 80-100%",
    category: "Charging",
    tags: ["charging curve", "80%", "100%"],
    summary: "Charging taper is normal battery protection behavior.",
    sections: [
      {
        heading: "What is happening",
        body: "As the battery fills, the car reduces power to manage heat and cell balance. The last part can take much longer.",
      },
      {
        heading: "What owners do",
        body: "For fast stops, many owners leave around 80% unless they need the extra range.",
      },
    ],
  },
  {
    id: "charging-troubleshooting",
    title: "Charging troubleshooting",
    category: "Charging",
    tags: ["troubleshooting", "fault", "charger"],
    summary: "A quick checklist when charging does not behave as expected.",
    sections: [
      {
        heading: "First checks",
        body: "Confirm the connector is seated, the charger is active, the car has no schedule blocking charging, and the target limit is above the current battery level.",
      },
      {
        heading: "If it stops",
        body: "Look for charger messages, vehicle alerts, overheating plugs, or circuit protection trips.",
      },
    ],
    tips: ["Take a photo of error messages before contacting support."],
    warnings: ["Do not keep retrying equipment that smells hot, sparks, or trips breakers."],
  },
  {
    id: "slow-charging-checks",
    title: "What to check if charging is slower than expected",
    category: "Charging",
    tags: ["slow", "checks", "power"],
    summary: "Common causes of unexpectedly low charging power.",
    sections: [
      {
        heading: "Common causes",
        body: "Car limits, charger limits, cable ratings, cold battery temperature, shared circuits, and station load management can all reduce power.",
      },
      {
        heading: "Owner approach",
        body: "Change one thing at a time: charger setting, cable, station, or battery temperature. This makes the cause easier to identify.",
      },
    ],
  },
  {
    id: "cable-adapter-basics",
    title: "Cable and adapter basics",
    category: "Charging",
    tags: ["cable", "adapter", "Type 2"],
    summary: "Keep charging cables simple, rated, and easy to inspect.",
    sections: [
      {
        heading: "Cable role",
        body: "The cable must match the station and the car inlet, and it must be rated for the intended current.",
      },
      {
        heading: "Adapter caution",
        body: "Adapters add failure points. Use only quality equipment designed for EV charging and legal in your region.",
      },
    ],
    warnings: ["Avoid improvised adapters for EV charging."],
  },
  {
    id: "home-charging-safety",
    title: "Safety rules for home charging",
    category: "Charging",
    tags: ["safety", "home", "electrical"],
    summary: "Simple safety rules before turning home charging into a routine.",
    sections: [
      {
        heading: "Core rule",
        body: "EV charging is a long continuous electrical load. The circuit, outlet, charger, and cable must all be designed for that use.",
      },
      {
        heading: "Warning signs",
        body: "Heat, smell, discoloration, buzzing, loose plugs, or frequent breaker trips mean charging should stop until checked.",
      },
    ],
    warnings: ["Electrical safety problems need a qualified professional."],
  },
];
