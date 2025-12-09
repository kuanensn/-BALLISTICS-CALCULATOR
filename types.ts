
export interface BallisticInput {
  velocity: number; // raw value input by user
  isMetric: boolean; // true = m/s, false = fps
  bulletWeight: number; // grams (e.g., 0.20, 0.25, 0.30)
  hopUpLevel: number; // 60 to 80 (percentage of backspin)
  shooterHeight: number; // cm (Height of muzzle from ground)
  temperature: number; // Celsius
  humidity: number; // Percentage
  targetSize: number; // cm (diameter of target for effective range)
}

export interface TrajectoryPoint {
  distance: number; // meters
  drop: number; // cm (height relative to line of sight)
  velocity: number; // m/s
  energy: number; // Joules
  time: number; // seconds
}

export interface SimulationResult {
  weight: number;
  label: string;
  points: TrajectoryPoint[];
  maxRange: number;
  effectiveRange: number;
  muzzleEnergy: number; // Joules
  muzzleVelocity: number; // m/s
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
