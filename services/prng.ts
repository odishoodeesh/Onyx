
/**
 * Simple Seeded Random Number Generator (Linear Congruential Generator)
 */
export class PRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a random float between 0 and 1
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  // Returns a random integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick a random item from an array
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}
