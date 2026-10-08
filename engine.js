// Sproutmath engine - sprout jar scheduling and sizing.
// Seed table values are published sprouting norms (soak hours, rinses per day,
// days to harvest, typical yield multiplier, seed density per jar volume) and
// are labeled guidance, not guarantees: variety, temperature and hygiene move
// real results. Schedule arithmetic itself is exact.
const SEEDS = {
  alfalfa:   { label: 'Alfalfa',   soakH: 8,  rinses: 2, days: 5, yieldX: 7,   gPerLiter: 12 },
  broccoli:  { label: 'Broccoli',  soakH: 8,  rinses: 2, days: 5, yieldX: 6,   gPerLiter: 12 },
  radish:    { label: 'Radish',    soakH: 8,  rinses: 2, days: 5, yieldX: 6,   gPerLiter: 15 },
  mung:      { label: 'Mung bean', soakH: 12, rinses: 2, days: 4, yieldX: 3,   gPerLiter: 30 },
  lentil:    { label: 'Lentil',    soakH: 12, rinses: 2, days: 3, yieldX: 2.5, gPerLiter: 35 },
  pea:       { label: 'Pea shoot', soakH: 12, rinses: 2, days: 3, yieldX: 2,   gPerLiter: 35 },
  sunflower: { label: 'Sunflower', soakH: 10, rinses: 2, days: 4, yieldX: 2,   gPerLiter: 30 },
};

function plan(seedKey, jarLiters){
  const s = SEEDS[seedKey];
  if (!s) throw new Error('unknown seed - pick one from the list');
  if (!(jarLiters > 0)) throw new Error('jar size must be positive');
  const seedG = s.gPerLiter * jarLiters;
  const harvestG = seedG * s.yieldX;
  // Day-by-day plan: day 0 soak, days 1..days-1 rinse-and-drain, harvest on day `days`.
  const steps = [{ day: 0, what: 'soak ' + s.soakH + ' hours, then drain' }];
  for (let d = 1; d < s.days; d++) steps.push({ day: d, what: 'rinse and drain ' + s.rinses + 'x' });
  steps.push({ day: s.days, what: 'harvest - about ' + Math.round(harvestG) + ' g' });
  return { seed: s.label, seedG, harvestG, soakH: s.soakH, rinsesPerDay: s.rinses,
    daysToHarvest: s.days, yieldX: s.yieldX, steps };
}

// Continuous supply: how often to start a jar, and how many jars that keeps in rotation.
function continuous(seedKey, jarLiters, gramsPerWeek){
  const p = plan(seedKey, jarLiters);
  if (!(gramsPerWeek > 0)) throw new Error('weekly target must be positive');
  const gPerDay = gramsPerWeek / 7;
  const intervalD = p.harvestG / gPerDay; // start a jar this often to match consumption
  if (intervalD < 1) throw new Error('target too big for one jar rhythm - harvest cannot keep up');
  const cycleD = p.daysToHarvest + 1; // harvest day plus a wash
  const jarsInRotation = Math.max(1, Math.ceil(cycleD / intervalD));
  return { intervalDays: intervalD, jarsInRotation, harvestPerJarG: p.harvestG,
    cycleDays: cycleD, weeklyYieldG: p.harvestG * 7 / intervalD };
}

// Overcrowding check: more than the labeled density invites mold, not yield.
function densityCheck(seedKey, jarLiters, seedG){
  const s = SEEDS[seedKey];
  if (!s) throw new Error('unknown seed - pick one from the list');
  if (!(jarLiters > 0)) throw new Error('jar size must be positive');
  if (!(seedG > 0)) throw new Error('seed amount must be positive');
  const maxG = s.gPerLiter * jarLiters;
  const ratio = seedG / maxG;
  const verdict = ratio <= 1 ? 'fits the jar (labeled density)'
    : ratio <= 1.5 ? 'crowded - thin it or expect slow patches (labeled density)'
    : 'overcrowded - mold eats overfilled jars, split it (labeled density)';
  return { maxG, ratio, fits: ratio <= 1, verdict };
}

// Warm rooms want an extra rinse (labeled guidance).
function rinseCheck(seedKey, roomC){
  const s = SEEDS[seedKey];
  if (!s) throw new Error('unknown seed - pick one from the list');
  if (!(roomC > -10 && roomC < 50)) throw new Error('room temperature looks wrong');
  const need = roomC >= 24 ? s.rinses + 1 : s.rinses;
  return { rinsesPerDay: need,
    verdict: roomC >= 24 ? 'warm room - add a rinse (labeled guidance)' : 'standard rhythm (labeled guidance)' };
}

const API = { SEEDS, plan, continuous, densityCheck, rinseCheck };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.Sproutmath = API;
