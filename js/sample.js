function sampleUniform(min, max) {
  const u = Math.random();
  return min + u * (max - min);
}

function sampleNormal(mean, stddev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stddev + mean;
}

function sampleTriangular(a, b, c) {
  const u = Math.random();
  const F = (c-a)/(b-a);
  if (u < F) {
    return a + Math.sqrt(u * (b-a) * (c-a));
  } else {
    return b - Math.sqrt((1-u) * (b-a) * (b-c));
  }
}

function sampleBinomial(prob) {
  const u = Math.random();
  if (u<=(1-prob)) return 0;
  else return 1;
}

function sampleDiscrete(conf, cums) {
  const u = Math.random();
  let idx = cums.findIndex(c => c>=u);
  return conf[idx].v;
}

function sampleCustom(conf, cums) {
  const u = Math.random();
  let idx = cums.findIndex(c => c>=u);
  const u2 = Math.random();
  return conf[idx].l + (u2 * (conf[idx].h-conf[idx].l));
}
