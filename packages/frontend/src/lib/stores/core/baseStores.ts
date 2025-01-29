import type {
  Store,
  DomainAPI,
  CacheConfig,
  StoreConfig,
  StoreEvent,
  WithId,
  EntityStore,
  CollectionStore,
} from "./types";
import { writable } from "svelte/store";
import { debounce } from "$lib/utils/debounce";

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
};

abstract class BaseStoreImpl<T> implements Store<T> {
  protected cache: Map<string, { data: T; timestamp: number }>;
  protected subscribers: Set<(data: T[]) => void>;
  protected store = writable<T[]>([]);

  constructor(protected config: StoreConfig<T>) {
    this.cache = new Map();
    this.subscribers = new Set();

    this.store.subscribe((data) => {
      this.subscribers.forEach((callback) => callback(data));
    });
  }

  abstract get(id: string): Promise<T>;
  abstract getAll(filter?: Partial<T>): Promise<T[]>;

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

  protected pruneCache(): void {
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
  }

  protected logMetric(method: string, duration: number): void {
    console.debug(`[${this.config.name}Store] ${method} took ${duration}ms`);
  }
}

export class BaseEntityStore<T extends WithId>
  extends BaseStoreImpl<T>
  implements EntityStore<T>
{
  async get(id: string): Promise<T> {
    return this.getById(id);
  }

  async getById(id: string): Promise<T> {
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
    data.forEach((item) => {
      this.cache.set(item.id, { data: item, timestamp: Date.now() });
    });
    this.pruneCache();
    this.store.set(data);
    return data;
  }

  async create(data: Partial<T>): Promise<T> {
    const created = await this.config.api.create(data);
    this.cache.set(created.id, { data: created, timestamp: Date.now() });
    this.invalidate();
    return created;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const updated = await this.config.api.update(id, data);
    this.cache.set(updated.id, { data: updated, timestamp: Date.now() });
    this.invalidate();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.config.api.delete(id);
    this.cache.delete(id);
    this.invalidate();
  }

  protected async handleEvent(event: StoreEvent<T>): Promise<void> {
    const debouncedInvalidate = debounce(() => this.invalidate(), 100);

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
  }
}

export class BaseCollectionStore<T>
  extends BaseStoreImpl<T>
  implements CollectionStore<T>
{
  private collectionCache?: { data: T; timestamp: number };

  async get(): Promise<T> {
    return this.getCollection();
  }

  async getCollection(): Promise<T> {
    const now = Date.now();

    if (
      this.collectionCache &&
      now - this.collectionCache.timestamp <
        (this.config.cacheConfig?.ttl ?? DEFAULT_CACHE_CONFIG.ttl)
    ) {
      return this.collectionCache.data;
    }

    const data = await this.config.api.fetch("collection");
    this.collectionCache = { data, timestamp: now };
    return data;
  }

  async getAll(): Promise<T[]> {
    const collection = await this.getCollection();
    return [collection];
  }

  async updateCollection(data: T): Promise<void> {
    await this.config.api.update("collection", data);
    this.collectionCache = { data, timestamp: Date.now() };
    this.store.set([data]);
  }

  protected async handleEvent(event: StoreEvent<T>): Promise<void> {
    const debouncedInvalidate = debounce(() => this.invalidate(), 100);
    this.collectionCache = undefined;
    debouncedInvalidate();
  }
}
