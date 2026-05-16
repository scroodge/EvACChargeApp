export type BydGuide = {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  warning?: string;
};

export const bydGuides: BydGuide[] = [
  {
    title: "BYD Yuan Up home charging basics",
    description:
      "A practical setup for routine charging at home with predictable range every morning.",
    steps: [
      "Park close enough that the cable is relaxed and not stretched.",
      "Set a daily target around 80% when the full range is not needed.",
      "Plug in firmly and confirm charging starts on the car or charger.",
      "Check the first few sessions for plug warmth and stable charging power.",
    ],
    tips: [
      "Schedule charging for cheaper overnight electricity when available.",
      "Keep the connector clean and dry before plugging in.",
    ],
  },
  {
    title: "BYD Yuan Up slow AC charging",
    description:
      "How to use low-power AC charging without worrying about long session times.",
    steps: [
      "Enter your current and target battery percentage in the calculator.",
      "Use the charger current limit recommended for the circuit.",
      "Let the car charge while parked for several hours or overnight.",
      "Unplug when the target is reached or before departure.",
    ],
    tips: [
      "Slow charging is ideal when the car sits at home for a long period.",
      "If you need quick turnaround, use a wallbox or public charger instead.",
    ],
  },
  {
    title: "BYD Yuan Up household socket charging",
    description:
      "Safe habits for occasional or low-power charging from a normal socket.",
    steps: [
      "Inspect the socket, plug, and portable charger for damage.",
      "Use a grounded outlet on a circuit that can handle continuous load.",
      "Avoid extension cords and loose adapters.",
      "Stop charging if the plug, socket, or cable becomes hot.",
    ],
    tips: [
      "Use a lower current setting if the circuit is old or shared.",
      "Ask an electrician to inspect the outlet before making it your daily charger.",
    ],
    warning:
      "Household sockets were not always designed for hours of high continuous load. Treat heat, buzzing, discoloration, or tripped breakers as warning signs.",
  },
  {
    title: "BYD Yuan Up winter charging",
    description:
      "What to expect when cold weather reduces charging speed and range.",
    steps: [
      "Charge after driving when the battery is already warmer if practical.",
      "Allow extra time for overnight sessions in freezing weather.",
      "Keep the car plugged in before departure when possible.",
      "Use cabin preheating while plugged in if your version supports it.",
    ],
    tips: [
      "Do not panic if charging power starts low in deep cold.",
      "Plan a larger range buffer for winter trips.",
    ],
  },
  {
    title: "BYD Yuan Up battery care",
    description:
      "Simple daily habits that reduce stress on the battery over time.",
    steps: [
      "Use 20-80% as the normal daily range.",
      "Charge to 100% when the trip needs it, then drive soon after.",
      "Avoid leaving the car very low for long periods.",
      "Prefer AC charging for normal daily use.",
    ],
    tips: [
      "Follow the owner manual for your exact battery chemistry and market version.",
      "Stable habits matter more than perfect percentages.",
    ],
  },
  {
    title: "BYD Yuan Up charging troubleshooting",
    description:
      "A quick checklist when charging starts, stops, or runs slower than expected.",
    steps: [
      "Confirm the connector is fully seated.",
      "Check the car charging limit and scheduled charging settings.",
      "Inspect charger lights or app messages.",
      "Try a known-good charger if the issue continues.",
    ],
    tips: [
      "Cold batteries and high target percentages can both reduce power.",
      "Record error messages before contacting service.",
    ],
    warning:
      "Do not keep retrying on equipment that smells hot, sparks, or trips protection devices.",
  },
];
