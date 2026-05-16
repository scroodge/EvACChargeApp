export type CalculatorInfo = {
  id: string;
  title: string;
  summary: string;
  status: "ready" | "next-phase";
};

export const calculators: CalculatorInfo[] = [
  {
    id: "charging-time-cost",
    title: "Charging time and cost calculator",
    summary: "Estimate energy, grid draw, time, and cost for one charging session.",
    status: "ready",
  },
  {
    id: "consumption",
    title: "Consumption calculator",
    summary: "Convert trip distance and energy used into consumption.",
    status: "next-phase",
  },
  {
    id: "range-estimate",
    title: "Range estimate calculator",
    summary: "Estimate usable range from battery percentage and consumption.",
    status: "next-phase",
  },
  {
    id: "trip-charging",
    title: "Trip charging estimate calculator",
    summary: "Plan charging stops and buffer for a route.",
    status: "next-phase",
  },
];
