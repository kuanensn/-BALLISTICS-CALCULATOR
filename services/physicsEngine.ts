import { BallisticInput, TrajectoryPoint, SimulationResult } from '../types';
import { MAX_RANGE, RANGE_STEP } from '../constants';

const GRAVITY = 9.81; // m/s^2

/**
 * Advanced Airsoft Ballistics Engine
 * Based on empirical data for spherical projectiles with Magnus Effect.
 * tuned to match Cybersloth data patterns (Flat trajectory for heavy BBs).
 */
const simulateTrajectory = (
  baseInputs: BallisticInput, 
  weightOverride?: number
): SimulationResult => {
  // 1. Calculate the System's Kinetic Energy based on USER INPUTS
  // We strictly trust the user's velocity input for their currently selected weight.
  const baseMassKg = baseInputs.bulletWeight / 1000;
  const baseInputVelMs = baseInputs.isMetric 
    ? baseInputs.velocity 
    : baseInputs.velocity * 0.3048;
  
  // Constant Kinetic Energy of the gun system (Joules)
  const systemEnergy = 0.5 * baseMassKg * Math.pow(baseInputVelMs, 2);

  // 2. Determine Simulation Parameters for CURRENT weight (Main or Comparison)
  const currentWeight = weightOverride || baseInputs.bulletWeight; // grams
  const currentMassKg = currentWeight / 1000;

  // Calculate Muzzle Velocity for this specific weight to maintain Constant Energy
  // v = sqrt(2E / m)
  const muzzleVelocity = Math.sqrt((2 * systemEnergy) / currentMassKg);

  // --- 3. PHYSICS CONSTANTS ---
  
  const diameter = 0.00595; // 5.95mm standard BB
  const radius = diameter / 2;
  const area = Math.PI * Math.pow(radius, 2);
  
  // Environment (Air Density)
  const pressure = 101325;
  const tempK = baseInputs.temperature + 273.15;
  const gasConstant = 287.05;
  let airDensity = pressure / (gasConstant * tempK); 
  // Humidity correction
  airDensity = airDensity * (1 - (baseInputs.humidity / 4000)); 

  // --- 4. AERODYNAMICS TUNING ---

  // Drag Coefficient (Cd)
  const Cd = 0.45; 

  // Spin & Magnus Effect
  const hopMin = 60;
  const hopMax = 80;
  const rawHop = Math.max(hopMin, Math.min(hopMax, baseInputs.hopUpLevel));
  const hopRatio = (rawHop - hopMin) / (hopMax - hopMin); 

  const minSpinRate = 50; 
  const maxSpinRate = 600; 
  
  // Apply non-linear curve
  let currentSpin = minSpinRate + (Math.pow(hopRatio, 1.3) * (maxSpinRate - minSpinRate));
  
  // Lift Coefficient Scalar
  const liftEfficiency = 1.5; 

  // --- 5. SIMULATION LOOP ---
  
  const points: TrajectoryPoint[] = [];
  let x = 0;
  let y = 0; // Relative to muzzle
  
  let vx = muzzleVelocity;
  let vy = 0; 
  let t = 0;
  const dt = 0.001; 

  let maxDist = 0;
  let effectiveRange = 0;
  let hasHitGround = false;
  let lastDist = 0;

  const groundLevelMeters = -(baseInputs.shooterHeight / 100);
  const SIM_LIMIT = 200; 

  while (x < SIM_LIMIT && !hasHitGround) {
    const v = Math.sqrt(vx * vx + vy * vy);
    
    // Drag
    const Fd = 0.5 * airDensity * v * v * area * Cd;
    const ax_drag = -(Fd / currentMassKg) * (vx / v);
    const ay_drag = -(Fd / currentMassKg) * (vy / v);

    // Magnus Lift
    currentSpin *= 0.9993; // Decay
    const LiftForce = (0.5 * airDensity * v * v * area) * ((radius * currentSpin * liftEfficiency) / v);
    
    const lx = -(vy / v); 
    const ly = (vx / v);
    
    const ax_lift = (LiftForce / currentMassKg) * lx;
    const ay_lift = (LiftForce / currentMassKg) * ly;

    // Total Accel
    const ax = ax_drag + ax_lift;
    const ay = -GRAVITY + ay_drag + ay_lift;

    // Integration
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    t += dt;

    // Ground Check
    if (y < groundLevelMeters) { 
        hasHitGround = true;
    }

    // Record Data
    if (x >= lastDist + RANGE_STEP || points.length === 0) {
      const displayDrop = y * 100; // cm

      points.push({
        distance: x,
        drop: displayDrop,
        velocity: v,
        energy: 0.5 * currentMassKg * v * v,
        time: t
      });
      lastDist = x;
      maxDist = x;

      const effectiveZone = baseInputs.targetSize / 2;
      
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
    muzzleEnergy: systemEnergy, // Return the system constant energy
    muzzleVelocity: muzzleVelocity
  };
};

export const calculateAirsoftTrajectory = (inputs: BallisticInput): SimulationResult[] => {
  const current = simulateTrajectory(inputs);

  const standardWeights = [0.20, 0.25, 0.28, 0.30, 0.32, 0.36, 0.40, 0.43, 0.45, 0.48];
  
  let idx = standardWeights.findIndex(w => Math.abs(w - inputs.bulletWeight) < 0.001);
  if (idx === -1) idx = 0; 

  let lighterWeight = 0.20;
  let heavierWeight = 0.30;

  if (inputs.bulletWeight <= 0.20) {
      lighterWeight = 0.12;
      heavierWeight = 0.25;
  } else if (inputs.bulletWeight >= 0.40) {
      lighterWeight = 0.32;
      heavierWeight = 0.48;
  } else {
      lighterWeight = standardWeights[Math.max(0, idx - 2)];
      heavierWeight = standardWeights[Math.min(standardWeights.length - 1, idx + 2)];
  }

  if (lighterWeight === inputs.bulletWeight) lighterWeight = standardWeights[Math.max(0, idx - 1)];
  if (heavierWeight === inputs.bulletWeight) heavierWeight = standardWeights[Math.min(standardWeights.length - 1, idx + 1)];

  const lighter = simulateTrajectory(inputs, lighterWeight);
  const heavier = simulateTrajectory(inputs, heavierWeight);

  return [lighter, current, heavier];
};