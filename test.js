const e = require('./engine.js');
const exp = require('./expected.json');
let pass = 0, fail = 0;
const close = (a, b, tol) => (typeof a === 'boolean' && a === b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)));
function cmp(g, w, path){
  if (Array.isArray(w)){ if (g.length !== w.length) throw new Error(path + '.length'); g.forEach((g2, i) => cmp(g2, w[i], path + '[' + i + ']')); return; }
  if (typeof w === 'string'){ if (g !== w) throw new Error(path + ': got "' + g + '" want "' + w + '"'); return; }
  if (typeof w === 'object' && w !== null){ Object.keys(w).forEach(k => cmp(g[k], w[k], path + '.' + k)); return; }
  if (!close(g, w, 1e-12)) throw new Error(path + ': got ' + g + ' want ' + w);
}
exp.cases.forEach((c, i) => {
  try {
    const got = c.kind === 'plan' ? e.plan(...c.args) : c.kind === 'continuous' ? e.continuous(...c.args) : c.kind === 'density' ? e.densityCheck(...c.args) : e.rinseCheck(...c.args);
    cmp(got, c.out, 'case' + i);
    pass++;
  } catch (err){ fail++; console.log('FAIL case', i, c.kind, err.message); }
});
// Anchors: table lookups and exact arithmetic.
(function(){
  const p = e.plan('alfalfa', 1);
  if (p.seedG !== 12 || p.harvestG !== 84 || p.steps.length !== 6) throw new Error('anchor plan');
  if (p.steps[0].day !== 0 || p.steps[5].day !== 5) throw new Error('anchor steps');
  const c = e.continuous('alfalfa', 1, 168); // 24 g/day -> interval exactly 84/24 = 3.5
  if (Math.abs(c.intervalDays - 3.5) > 1e-12) throw new Error('anchor interval');
  if (c.jarsInRotation !== Math.ceil(6 / 3.5)) throw new Error('anchor jars');
  const d = e.densityCheck('alfalfa', 1, 12);
  if (d.ratio !== 1 || !d.fits) throw new Error('anchor density');
  const r = e.rinseCheck('alfalfa', 24);
  if (r.rinsesPerDay !== 3) throw new Error('anchor rinse boundary');
  pass += 6;
})();
// Properties.
(function(){
  // Bigger jar: proportionally bigger harvest.
  const a = e.plan('mung', 1), b = e.plan('mung', 2);
  if (Math.abs(b.harvestG - 2 * a.harvestG) > 1e-9) throw new Error('jar linearity');
  // Higher target: shorter interval, never more jars than ceil(cycle).
  const c1 = e.continuous('alfalfa', 1, 100), c2 = e.continuous('alfalfa', 1, 400);
  if (!(c2.intervalDays < c1.intervalDays)) throw new Error('interval monotonicity');
  if (!(c2.jarsInRotation >= c1.jarsInRotation)) throw new Error('jars monotonicity');
  // Warm room never fewer rinses.
  Object.keys(e.SEEDS).forEach(k => {
    if (e.rinseCheck(k, 30).rinsesPerDay < e.rinseCheck(k, 18).rinsesPerDay) throw new Error('rinse monotonicity');
  });
  pass += 4;
})();
// Error cases.
(function(){
  const bad = [
    () => e.plan('kale', 1),
    () => e.plan('alfalfa', 0),
    () => e.continuous('alfalfa', 1, 0),
    () => e.continuous('alfalfa', 1, 10000),
    () => e.densityCheck('alfalfa', 1, 0),
    () => e.rinseCheck('alfalfa', 100),
  ];
  bad.forEach((f2, i) => {
    try { f2(); fail++; console.log('FAIL error case', i, 'did not throw'); }
    catch (err){ pass++; }
  });
})();
console.log(pass + '/' + (pass + fail) + ' checks pass');
process.exit(fail ? 1 : 0);
