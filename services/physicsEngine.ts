import { BallisticInput, TrajectoryPoint, SimulationResult } from '../types';
import { MAX_RANGE, RANGE_STEP } from '../constants';

const GRAVITY = 9.81; // m/s^2

/**
 * Advanced Airsoft Ballistics Engine
 * Based on empirical data for spherical projectiles with Magnus Effect.
 * Tuned to match Cybersloth data patterns (Flat trajectory for heavy BBs).
 */
const simulateTrajectory = (
  baseInputs: BallisticInput, 
  weightOverride?: number
): SimulationResult => {
  const currentWeight = weightOverride || baseInputs.bulletWeight; // grams
  const massKg = currentWeight / 1000;
  
  // --- 1. ENERGY & VELOCITY CALCULATION ---
  
  // Base calculation assumes input velocity is measured with 0.20g standard
  const refWeightKg = 0.0002; // 0.20g
  const inputVelMs = baseInputs.isMetric 
    ? baseInputs.velocity 
    : baseInputs.velocity * 0.3048;

  // Calculate Base Energy (Joules) based on chrono reading
  const baseEnergy = 0.5 * refWeightKg * Math.pow(inputVelMs, 2);

  // Joule Creep Simulation
  // Heavier BBs extract more energy from the cylinder volume/gas expansion before leaving the barrel
  // Factor tuned: 0.20g -> 0J bonus, 0.48g -> Significant bonus (~15-20%)
  const JOULE_CREEP_FACTOR = 0.5; 
  const weightDiff = Math.max(0, currentWeight - 0.20);
  const energyBonus = weightDiff * JOULE_CREEP_FACTOR;
  
  const actualEnergy = baseEnergy + energyBonus;

  // Initial Velocity for the specific weight based on the crept energy
  const muzzleVelocity = Math.sqrt((2 * actualEnergy) / massKg);

  // --- 2. PHYSICS CONSTANTS ---
  
  const diameter = 0.00595; // 5.95mm standard BB
  const radius = diameter / 2;
  const area = Math.PI * Math.pow(radius, 2);
  
  // Environment (Air Density)
  // Standard sea level ~1.225 kg/m^3
  // Adjust for Temp and Humidity roughly
  const pressure = 101325;
  const tempK = baseInputs.temperature + 273.15;
  const gasConstant = 287.05;
  let airDensity = pressure / (gasConstant * tempK); 
  // Humidity correction (humid air is slightly less dense)
  airDensity = airDensity * (1 - (baseInputs.humidity / 4000)); 

  // --- 3. AERODYNAMICS TUNING ---

  // Drag Coefficient (Cd)
  // Standard rough sphere is ~0.47. High polish Airsoft BBs are much smoother.
  // User requested 0.45.
  const Cd = 0.45; 

  // Spin & Magnus Effect
  // HopUp Level (60-80 input) maps to Spin (Rad/s)
  // We treat the slider as "Nub Depth" / "Friction Applied".
  
  const hopMin = 60;
  const hopMax = 80;
  // Clamp input
  const rawHop = Math.max(hopMin, Math.min(hopMax, baseInputs.hopUpLevel));
  // Normalize to 0.0 - 1.0 range
  const hopRatio = (rawHop - hopMin) / (hopMax - hopMin); 

  // Spin rates (Rad/s)
  // 60 setting (0.0) -> Low spin (Underhop for most weights)
  // 80 setting (1.0) -> Extreme spin (Overhop for most weights)
  const minSpinRate = 50; 
  const maxSpinRate = 600; // Increased to ensure even 0.48g can be lifted/overhopped
  
  // Apply non-linear curve - deeper hop adds spin aggressively
  // Power of 1.3 makes the sensitivity feel natural
  let currentSpin = minSpinRate + (Math.pow(hopRatio, 1.3) * (maxSpinRate - minSpinRate));
  
  // Lift Coefficient Scalar
  // Tunes how much the spin actually lifts the object
  // UPDATED: Set to 1.5 to correctly scale Magnus Force against Gravity with Cd=0.45
  const liftEfficiency = 1.5; 

  // --- 4. SIMULATION LOOP ---
  
  const points: TrajectoryPoint[] = [];
  let x = 0;
  let y = 0; // Relative to muzzle height (meters)
  
  let vx = muzzleVelocity;
  let vy = 0; 
  let t = 0;
  const dt = 0.001; // High precision time step (1ms) for smoother curves

  let maxDist = 0;
  let effectiveRange = 0;
  let hasHitGround = false;
  let lastDist = 0;

  // Determine ground impact level relative to muzzle
  const groundLevelMeters = -(baseInputs.shooterHeight / 100);

  // We allow simulation slightly beyond MAX_RANGE to capture the drop
  // Dynamic limit based on energy to prevent infinite loops if something goes wrong, but typically 150m is enough
  const SIM_LIMIT = 200; 

  while (x < SIM_LIMIT && !hasHitGround) {
    const v = Math.sqrt(vx * vx + vy * vy);
    
    // -- DRAG FORCE --
    // Fd = 0.5 * rho * v^2 * A * Cd
    const Fd = 0.5 * airDensity * v * v * area * Cd;
    
    // Drag Acceleration (Opposite to velocity)
    const ax_drag = -(Fd / massKg) * (vx / v);
    const ay_drag = -(Fd / massKg) * (vy / v);

    // -- MAGNUS LIFT FORCE --
    // Fl = 0.5 * rho * v^2 * A * Cl
    // Lift Force is proportional to Velocity * Spin
    
    // Spin Decay: The BB slows its rotation due to air friction
    // Heavier BBs maintain spin momentum slightly better due to mass inertia
    // 0.9993 decay per ms simulates the "drop at the end" characteristic
    currentSpin *= 0.9993; 
    
    const LiftForce = (0.5 * airDensity * v * v * area) * ((radius * currentSpin * liftEfficiency) / v);
    
    // Lift is perpendicular to velocity vector
    // If aiming flat (vx > 0, vy ~ 0), lift is purely UP (+y)
    const lx = -(vy / v); // Normal vector X component
    const ly = (vx / v);  // Normal vector Y component
    
    const ax_lift = (LiftForce / massKg) * lx;
    const ay_lift = (LiftForce / massKg) * ly;

    // -- TOTAL ACCELERATION --
    const ax = ax_drag + ax_lift;
    const ay = -GRAVITY + ay_drag + ay_lift;

    // -- INTEGRATION (Euler) --
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    t += dt;

    // Ground Check
    if (y < groundLevelMeters) { 
        hasHitGround = true;
    }

    // Record Data Points
    // We record every meter (or closest step)
    if (x >= lastDist + RANGE_STEP || points.length === 0) {
      const displayDrop = y * 100; // cm

      points.push({
        distance: x,
        drop: displayDrop,
        velocity: v,
        energy: 0.5 * massKg * v * v,
        time: t
      });
      lastDist = x;
      maxDist = x;

      // Effective Range Calculation
      // Definition: Can hit a target size (diameter) without holdover
      // This means the trajectory stays within +/- (TargetSize / 2) relative to the aim line (0)
      const effectiveZone = baseInputs.targetSize / 2;
      
      // Check if current point is within the vertical window
      if (!hasHitGround && Math.abs(displayDrop) <= effectiveZone && x > 5) {
        effectiveRange = x;
      }
    }
  }

  return {
    weight: currentWeight,
    label: `${currentWeight.toFixed(2)}g`,
    points,
    maxRange: maxDist,
    effectiveRange,
    muzzleEnergy: actualEnergy,
    muzzleVelocity: muzzleVelocity
  };
};

export const calculateAirsoftTrajectory = (inputs: BallisticInput): SimulationResult[] => {
  const current = simulateTrajectory(inputs);

  const standardWeights = [0.20, 0.25, 0.28, 0.30, 0.32, 0.36, 0.40, 0.43, 0.45, 0.48];
  
  let idx = standardWeights.findIndex(w => Math.abs(w - inputs.bulletWeight) < 0.001);
  if (idx === -1) idx = 0; 

  // Intelligent Comparison Logic:
  // Show distinct weight classes to help user choose.
  // If user selects heavy, compare with medium. If light, compare with slightly heavier.
  
  let lighterWeight = 0.20;
  let heavierWeight = 0.30;

  if (inputs.bulletWeight <= 0.20) {
      lighterWeight = 0.12;
      heavierWeight = 0.25;
  } else if (inputs.bulletWeight >= 0.40) {
      lighterWeight = 0.32;
      heavierWeight = 0.48;
  } else {
      // Middle weights (0.25 - 0.36)
      lighterWeight = standardWeights[Math.max(0, idx - 2)];
      heavierWeight = standardWeights[Math.min(standardWeights.length - 1, idx + 2)];
  }

  // Ensure we don't compare the same weight
  if (lighterWeight === inputs.bulletWeight) lighterWeight = standardWeights[Math.max(0, idx - 1)];
  if (heavierWeight === inputs.bulletWeight) heavierWeight = standardWeights[Math.min(standardWeights.length - 1, idx + 1)];

  const lighter = simulateTrajectory(inputs, lighterWeight);
  const heavier = simulateTrajectory(inputs, heavierWeight);

  return [lighter, current, heavier];
};