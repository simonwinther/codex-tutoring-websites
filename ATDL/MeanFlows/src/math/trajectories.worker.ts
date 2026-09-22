import { gaussian, integrate, mixtureVelocity, rng, type Vec } from "./flow";
const cache = new Map<number, Vec[][]>();
self.onmessage = (event: MessageEvent<{ id: number; seed: number }>) => {
  const { id, seed } = event.data;
  if (!cache.has(seed)) {
    const random = rng(seed);
    const paths = Array.from({ length: 260 }, () =>
      integrate(
        mixtureVelocity,
        [gaussian(random), gaussian(random)],
        1,
        0,
        128,
      ),
    );
    cache.set(seed, paths);
    if (cache.size > 4) cache.delete(cache.keys().next().value!);
  }
  self.postMessage({ id, paths: cache.get(seed) });
};
