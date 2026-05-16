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
      recommendation: "Adjust the highlighted values to estimate charging.",
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

  if (wholeHours === 0) return `${minutes} min`;
  if (minutes === 0) return `${wholeHours} h`;

  return `${wholeHours} h ${minutes} min`;
}

function validateChargingInput(input: ChargingCalculatorInput) {
  const errors: string[] = [];

  if (input.batteryCapacity <= 0) {
    errors.push("Battery capacity must be greater than 0 kWh.");
  }

  if (input.currentPercent < 0 || input.currentPercent > 100) {
    errors.push("Current battery must be between 0% and 100%.");
  }

  if (input.targetPercent < 0 || input.targetPercent > 100) {
    errors.push("Target battery must be between 0% and 100%.");
  }

  if (input.targetPercent <= input.currentPercent) {
    errors.push("Target battery must be greater than current battery.");
  }

  if (input.chargingPower <= 0) {
    errors.push("Charging power must be greater than 0 kW.");
  }

  if (input.efficiency < 1 || input.efficiency > 100) {
    errors.push("Charging efficiency must be between 1% and 100%.");
  }

  return errors;
}

function getRecommendation(
  input: ChargingCalculatorInput,
  timeHours: number,
) {
  if (input.targetPercent > 90) {
    return "For daily driving, consider stopping around 80% unless you need the full range.";
  }

  if (input.chargingPower <= 2.5 && timeHours > 10) {
    return "This is normal for household socket charging. Overnight charging is the usual pattern.";
  }

  if (input.currentPercent < 15) {
    return "Try to plug in before the battery gets very low, especially in cold weather.";
  }

  return "This looks like a battery-friendly daily charging session.";
}
