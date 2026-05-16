export type ChargingCalculatorInput = {
  batteryCapacity: number;
  currentPercent: number;
  targetPercent: number;
  chargingPower: number;
  electricityPrice: number;
  efficiency: number;
};

export type ChargingCalculatorResult = {
  energyNeeded: number;
  gridEnergy: number;
  timeHours: number;
  cost: number;
  recommendation: string;
  errors: string[];
};

export const defaultChargingCalculatorInput: ChargingCalculatorInput = {
  batteryCapacity: 45,
  currentPercent: 20,
  targetPercent: 80,
  chargingPower: 2.2,
  electricityPrice: 0.25,
  efficiency: 90,
};

export function calculateCharging(
  input: ChargingCalculatorInput,
): ChargingCalculatorResult {
  const errors = validateChargingInput(input);

  if (errors.length > 0) {
    return {
      energyNeeded: 0,
      gridEnergy: 0,
      timeHours: 0,
      cost: 0,
      recommendation: "Исправьте значения, чтобы рассчитать зарядку.",
      errors,
    };
  }

  const energyNeeded =
    input.batteryCapacity * ((input.targetPercent - input.currentPercent) / 100);
  const gridEnergy = energyNeeded / (input.efficiency / 100);
  const timeHours = gridEnergy / input.chargingPower;
  const cost = gridEnergy * input.electricityPrice;

  return {
    energyNeeded,
    gridEnergy,
    timeHours,
    cost,
    recommendation: getRecommendation(input, timeHours),
    errors,
  };
}

export function formatChargingTime(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) return `${minutes} мин`;
  if (minutes === 0) return `${wholeHours} ч`;

  return `${wholeHours} ч ${minutes} мин`;
}

function validateChargingInput(input: ChargingCalculatorInput) {
  const errors: string[] = [];

  if (input.batteryCapacity <= 0) {
    errors.push("Емкость батареи должна быть больше 0 кВт⋅ч.");
  }

  if (input.currentPercent < 0 || input.currentPercent > 100) {
    errors.push("Текущий заряд должен быть от 0% до 100%.");
  }

  if (input.targetPercent < 0 || input.targetPercent > 100) {
    errors.push("Целевой заряд должен быть от 0% до 100%.");
  }

  if (input.targetPercent <= input.currentPercent) {
    errors.push("Целевой заряд должен быть выше текущего.");
  }

  if (input.chargingPower <= 0) {
    errors.push("Мощность зарядки должна быть больше 0 кВт.");
  }

  if (input.efficiency < 1 || input.efficiency > 100) {
    errors.push("Эффективность зарядки должна быть от 1% до 100%.");
  }

  return errors;
}

function getRecommendation(
  input: ChargingCalculatorInput,
  timeHours: number,
) {
  if (input.targetPercent > 90) {
    return "Для ежедневных поездок часто удобно останавливаться около 80%, если полный запас хода не нужен.";
  }

  if (input.chargingPower <= 2.5 && timeHours > 10) {
    return "Для бытовой розетки это нормально. Обычно такой режим используют на ночь.";
  }

  if (input.currentPercent < 15) {
    return "Старайтесь подключаться до очень низкого заряда, особенно в холодную погоду.";
  }

  return "Похоже на спокойную ежедневную зарядку без лишней нагрузки для батареи.";
}
