# Sproutmath

Sprout jars without the mold. Pick a seed and a jar size; get the day-by-day plan (soak, rinse rhythm, harvest day), the seed-to-harvest forecast, a start rhythm for continuous supply, an overcrowding verdict, and a warm-room rinse check.

## Anchors

- Seed table (soak hours, rinses/day, days to harvest, yield multiplier, grams of seed per jar liter) is published sprouting norm data - labeled guidance, not a guarantee.
- Schedule arithmetic is exact: harvest = seed x yield multiplier; rotation interval = jar harvest / daily appetite; rotation jars = ceil(cycle days / interval).

## Labeled simplifications

Norms vary by variety, temperature and hygiene. The warm-room rule (add a rinse at 24&deg;C+) and density limits are labeled guidance.

## Run tests

```
node test.js
```

201 checks: 185 randomized cases against an independent Python oracle, exact anchors (table lookups, interval arithmetic, rinse boundary at 24&deg;C), monotonicity properties, and error cases.
