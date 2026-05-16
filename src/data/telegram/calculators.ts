export type CalculatorInfo = {
  id: string;
  title: string;
  summary: string;
  status: "ready" | "next-phase";
};

export const calculators: CalculatorInfo[] = [
  {
    id: "charging-time-cost",
    title: "Калькулятор времени и стоимости зарядки",
    summary: "Оценка энергии, потребления из сети, времени и стоимости одной зарядки.",
    status: "ready",
  },
  {
    id: "consumption",
    title: "Калькулятор расхода",
    summary: "Расчет расхода по дистанции и потраченной энергии.",
    status: "next-phase",
  },
  {
    id: "range-estimate",
    title: "Калькулятор запаса хода",
    summary: "Оценка доступного пробега по проценту батареи и расходу.",
    status: "next-phase",
  },
  {
    id: "trip-charging",
    title: "Калькулятор зарядок в поездке",
    summary: "Планирование остановок на зарядку и запаса по маршруту.",
    status: "next-phase",
  },
];
