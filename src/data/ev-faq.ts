export const faqCategories = [
  "Home charging",
  "Slow charging",
  "Battery health",
  "Winter charging",
  "BYD Yuan Up",
  "Safety",
  "Cost",
] as const;

export type FaqCategory = (typeof faqCategories)[number];

export type FaqItem = {
  question: string;
  answer: string;
  category: FaqCategory;
};

export const evFaqItems: FaqItem[] = [
  {
    question: "What is slow charging?",
    category: "Slow charging",
    answer:
      "Slow charging usually means AC charging at lower power, often from a household socket or small wallbox. It is gentle, simple, and useful when the car can stay plugged in for several hours.",
  },
  {
    question: "Is slow charging better for battery health?",
    category: "Battery health",
    answer:
      "Slow AC charging produces less heat than frequent high-power DC charging, so it is usually a battery-friendly daily habit. Battery temperature, state of charge, and charging frequency still matter.",
  },
  {
    question: "What is the difference between kW and kWh?",
    category: "Home charging",
    answer:
      "kW measures charging power, like the speed of energy flow. kWh measures energy, like the amount added to the battery or used for a trip.",
  },
  {
    question: "Why does charging slow down after 80%?",
    category: "Battery health",
    answer:
      "Near high state of charge, the car protects the battery by reducing power. The last 20% can take disproportionately longer, especially on DC fast chargers.",
  },
  {
    question: "Is it safe to charge from a household socket?",
    category: "Safety",
    answer:
      "It can be safe when the socket, wiring, grounding, and portable charger are rated for continuous load. Avoid damaged outlets, extension cords, and hot plugs. If unsure, ask a qualified electrician.",
  },
  {
    question: "Should I charge to 100% every day?",
    category: "Battery health",
    answer:
      "For daily use, 70-80% is usually enough and gentler for the battery. Charge to 100% when you need the range, then drive soon after it finishes.",
  },
  {
    question: "What is the best charging range for daily use?",
    category: "Battery health",
    answer:
      "A common daily target is to keep the battery roughly between 20% and 80%. Your manual may give model-specific guidance, so follow that first.",
  },
  {
    question: "Why does charging take longer in winter?",
    category: "Winter charging",
    answer:
      "Cold batteries accept less power and the car may spend energy warming the pack. Cabin heating and lower charging efficiency can also increase total energy use.",
  },
  {
    question: "How much does home charging cost?",
    category: "Cost",
    answer:
      "Multiply grid energy in kWh by your electricity price. For example, adding 30 kWh at 0.25 per kWh costs about 7.50 before any fixed fees.",
  },
  {
    question: "Can I leave the car charging overnight?",
    category: "Home charging",
    answer:
      "Yes, if the equipment and circuit are suitable. Set a target charge if your car or charger supports it, and make sure the plug and cable remain cool during charging.",
  },
  {
    question: "What charging power is normal for AC charging?",
    category: "Home charging",
    answer:
      "Household sockets often deliver about 1.8-2.4 kW. Single-phase wallboxes often provide around 3.7-7.4 kW, while three-phase setups may be higher if the car supports it.",
  },
  {
    question: "What should I do if charging is slower than expected?",
    category: "Safety",
    answer:
      "Check the car limit, charger setting, cable rating, socket temperature, battery temperature, and whether other loads share the circuit. Reduce current if anything feels hot.",
  },
  {
    question: "Does BYD Yuan Up support home charging?",
    category: "BYD Yuan Up",
    answer:
      "Yes. BYD Yuan Up can be charged at home with compatible AC charging equipment. Use the cable and current limits recommended for your market and vehicle version.",
  },
  {
    question: "How should I charge BYD Yuan Up in winter?",
    category: "BYD Yuan Up",
    answer:
      "Plug in after driving while the battery is warmer when possible, expect lower power in deep cold, and use scheduled charging or preconditioning features if available.",
  },
  {
    question: "Should I preheat the battery before charging?",
    category: "Winter charging",
    answer:
      "Preheating helps most before faster charging in cold weather. For slow home charging, plugging in after a drive or letting the car manage temperature is often enough.",
  },
  {
    question: "Can frequent fast charging damage the battery?",
    category: "Battery health",
    answer:
      "Modern battery systems manage fast charging carefully, but frequent high-power charging adds more heat and stress than slower AC charging. Use fast charging when it saves time.",
  },
  {
    question: "Do I need a wallbox at home?",
    category: "Home charging",
    answer:
      "A wallbox is not always required, but it is usually faster, neater, and safer for repeated charging than a household socket. It should be installed by a qualified electrician.",
  },
  {
    question: "What is charging efficiency?",
    category: "Cost",
    answer:
      "Efficiency is the share of electricity from the wall that reaches the battery. Some energy is lost as heat or used by vehicle systems, so grid energy is higher than battery energy.",
  },
  {
    question: "Why is my range lower after charging in cold weather?",
    category: "Winter charging",
    answer:
      "Cold weather raises energy use for heating and increases battery resistance. The car may show lower predicted range even at the same percentage.",
  },
  {
    question: "Can rain affect EV charging safety?",
    category: "Safety",
    answer:
      "Proper EV connectors are designed for outdoor use, but equipment must be undamaged and correctly connected. Do not use a wet, damaged, or unprotected household extension.",
  },
  {
    question: "How do tariffs change charging cost?",
    category: "Cost",
    answer:
      "Time-of-use tariffs can make overnight charging much cheaper. If your charger or car supports scheduling, set it to charge during low-price hours.",
  },
  {
    question: "What target should I use before a road trip?",
    category: "Home charging",
    answer:
      "Charge higher when you need range, including 100% if your route requires it. Try to finish close to departure so the battery does not sit full for a long time.",
  },
];
