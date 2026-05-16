export type ExplainerCard = {
  title: string;
  summary: string;
  detail: string;
};

export const chargingExplainers: ExplainerCard[] = [
  {
    title: "kW vs kWh",
    summary: "Power is speed. Energy is amount.",
    detail:
      "A 2.2 kW socket adds energy slowly. A 45 kWh battery describes how much energy the pack can store.",
  },
  {
    title: "AC vs DC charging",
    summary: "Home charging is usually AC. Fast charging is usually DC.",
    detail:
      "With AC charging, the car converts power for the battery. DC fast chargers feed the battery more directly and can deliver much higher power.",
  },
  {
    title: "Slow charging explained",
    summary: "Low-power AC charging is simple and battery-friendly.",
    detail:
      "Slow charging works well overnight or during long parking sessions. The tradeoff is time, not complexity.",
  },
  {
    title: "Why 20-80% is useful",
    summary: "The middle of the battery is the easiest daily zone.",
    detail:
      "Keeping the battery away from very low and very high states of charge reduces stress and leaves headroom for regenerative braking.",
  },
  {
    title: "Why charging slows near 100%",
    summary: "The car tapers power to protect the pack.",
    detail:
      "As cells fill up, the battery management system reduces current. This is normal and most visible during fast charging.",
  },
  {
    title: "Winter charging behavior",
    summary: "Cold batteries charge slower and use more energy.",
    detail:
      "Low temperatures can limit charging power. Some energy may go into warming the battery and cabin instead of range.",
  },
  {
    title: "Home socket vs wallbox",
    summary: "Sockets are convenient. Wallboxes are better for daily use.",
    detail:
      "A wallbox can offer higher power, better protection, cleaner cable management, and current settings designed for long charging sessions.",
  },
  {
    title: "Charging efficiency losses",
    summary: "Not every kWh from the wall reaches the battery.",
    detail:
      "Cable heat, onboard electronics, temperature control, and standby systems all consume energy. A realistic home estimate is often around 85-95% efficiency.",
  },
];
