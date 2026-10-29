
type CacheEntry = {
  value: string;
  expiresAt: number;
};

export class Cache {
  private readonly validityMs: number;

  private readonly store = new Map<string, CacheEntry>();

  constructor(validityMs: number) {
    if (!Number.isFinite(validityMs) || validityMs <= 0) {
      throw new Error("OtpCache validity must be a positive number.");
    }

    this.validityMs = validityMs;
  }

  set(key: string, value: string): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.validityMs,
    });
  }

  get(key: string): string | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  update(key: string, value: string): boolean {
    const currentValue = this.get(key);

    if (currentValue === null) {
      return false;
    }

    this.set(key, value);
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  validate(key: string, value: string): boolean {
    const cachedValue = this.get(key);

    if (cachedValue === null) {
      return false;
    }

    if (cachedValue !== value) {
      return false;
    }

    if (this.isExpired(this.store.get(key)!)) {
      this.store.delete(key);
      return false;
    }

    this.store.delete(key);
    return true;
  }

  clear(): void {
    this.store.clear();
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt <= Date.now();
  }
}

export default Cache;
