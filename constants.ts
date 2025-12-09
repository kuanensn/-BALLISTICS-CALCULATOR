
import { BallisticInput } from './types';

export const DEFAULT_INPUTS: BallisticInput = {
  velocity: 120, // 120 m/s @ 0.20g (approx 1.44J)
  isMetric: true,
  bulletWeight: 0.20, // 0.20g base weight so comparison curves appear correctly initially
  hopUpLevel: 70, // Inside the new 60-80 range
  shooterHeight: 170, // cm (Average shooting stance height)
  temperature: 25, // Celsius
  humidity: 60, // %
  targetSize: 30 // cm (Human torso size)
};

export const RANGE_STEP = 1; // 1 meter steps
export const MAX_RANGE = 120; // Extended max range for sniper simulations