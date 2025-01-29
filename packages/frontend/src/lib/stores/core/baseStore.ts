import type {
  Store,
  DomainAPI,
  CacheConfig,
  StoreConfig,
  StoreEvent,
  WithId,
} from "./types";
import { writable } from "svelte/store";
import { debounce } from "$lib/utils/debounce";

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export abstract class BaseStore<T> implements Store<T> {
  protected cache: Map<string, CacheEntry<T>>;
  protected subscribers: Set<(data: T[]) => void>;
  protected store = writable<T[]>([]);

  constructor(protected config: StoreConfig<T>) {
    this.cache = new Map();
    this.subscribers = new Set();

    // Initialize the store with subscription handling
    this.store.subscribe((data) => {
      this.subscribers.forEach((callback) => callback(data));
    });
  }

  async get(id: string): Promise<T> {
    const cached = this.cache.get(id);
    const now = Date.now();

    if (
      cached &&
      now - cached.timestamp <
        (this.config.cacheConfig?.ttl ?? DEFAULT_CACHE_CONFIG.ttl)
    ) {
      return cached.data;
    }

    const data = await this.config.api.fetch(id);
    this.cache.set(id, { data, timestamp: now });
    this.pruneCache();
    return data;
  }

  async getAll(filter?: Partial<T>): Promise<T[]> {
    const data = await this.config.api.fetchAll(filter);
    if (data.length > 0 && this.hasId(data[0])) {
      data.forEach((item) => {
        this.cache.set((item as WithId).id, {
          data: item,
          timestamp: Date.now(),
        });
      });
    } else if (data.length > 0) {
      // For collections without IDs, store as a single cache entry
      this.cache.set("collection", { data: data[0], timestamp: Date.now() });
    }
    this.pruneCache();
    this.store.set(data);
    return data;
  }

  subscribe(callback: (data: T[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  invalidate(): void {
    this.cache.clear();
    this.getAll().catch(console.error);
  }

  async persist(): Promise<void> {
    // Implement in derived classes if needed
  }

  protected async handleEvent(event: StoreEvent<T>): Promise<void> {
    const debouncedInvalidate = debounce(() => this.invalidate(), 100);

    if (this.hasId(event.payload)) {
      switch (event.type) {
        case "create":
        case "update":
          this.cache.set(event.payload.id, {
            data: event.payload,
            timestamp: event.timestamp,
          });
          debouncedInvalidate();
          break;
        case "delete":
          this.cache.delete(event.payload.id);
          debouncedInvalidate();
          break;
      }
    } else {
      // For collections without IDs, always invalidate the entire cache
      debouncedInvalidate();
    }
  }

  private pruneCache(): void {
    const maxSize =
      this.config.cacheConfig?.maxSize ?? DEFAULT_CACHE_CONFIG.maxSize;
    const ttl = this.config.cacheConfig?.ttl ?? DEFAULT_CACHE_CONFIG.ttl;
    const now = Date.now();

    // Remove expired entries
    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttl) {
        this.cache.delete(id);
      }
    }

    // Remove oldest entries if cache is too large
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const entriesToRemove = entries.slice(0, this.cache.size - maxSize);
      entriesToRemove.forEach(([id]) => this.cache.delete(id));
    }
  }

  protected logError(method: string, error: unknown): void {
    console.error(`[${this.config.name}Store] Error in ${method}:`, error);
    // Could be extended to send to error monitoring service
  }

  protected logMetric(method: string, duration: number): void {
    console.debug(`[${this.config.name}Store] ${method} took ${duration}ms`);
    // Could be extended to send to metrics monitoring service
  }

  protected hasId(item: unknown): item is WithId {
    return Boolean(
      item &&
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof (item as WithId).id === "string"
    );
  }
}
