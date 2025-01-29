export interface WithId {
  id: string;
}

export interface Store<T> {
  get(id: string): Promise<T>;
  getAll(filter?: Partial<T>): Promise<T[]>;
  subscribe(callback: (data: T[]) => void): () => void;
  invalidate(): void;
  persist(): Promise<void>;
}

export interface DomainAPI<T> {
  fetch(id: string): Promise<T>;
  fetchAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
}

export interface StoreConfig<T> {
  name: string;
  api: DomainAPI<T>;
  cacheConfig?: Partial<CacheConfig>;
}

export enum EventPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  BACKGROUND = 3,
}

export interface StoreEvent<T> {
  type: "create" | "update" | "delete";
  priority: EventPriority;
  payload: T;
  timestamp: number;
}

export interface CollectionStore<T> extends Store<T> {
  getCollection(): Promise<T>;
  updateCollection(data: T): Promise<void>;
}

export interface EntityStore<T extends WithId> extends Store<T> {
  getById(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface StoreMetrics {
  cacheHits: number;
  cacheMisses: number;
  apiLatency: number;
  errorCount: number;
}

export interface StoreError extends Error {
  code: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface StorePersistenceOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface StoreSubscriptionOptions {
  immediate?: boolean;
  filter?: (data: unknown) => boolean;
  transform?: (data: unknown) => unknown;
}

export interface StoreValidationError extends Error {
  field: string;
  value: unknown;
  constraint: string;
}

export type StoreErrorHandler = (error: StoreError) => void;
export type StoreMetricsHandler = (metrics: StoreMetrics) => void;
export type StoreValidator<T> = (data: Partial<T>) => StoreValidationError[];

export interface StoreHooks<T> {
  beforeCreate?: (data: Partial<T>) => Promise<Partial<T>>;
  afterCreate?: (data: T) => Promise<void>;
  beforeUpdate?: (id: string, data: Partial<T>) => Promise<Partial<T>>;
  afterUpdate?: (data: T) => Promise<void>;
  beforeDelete?: (id: string) => Promise<void>;
  afterDelete?: (id: string) => Promise<void>;
}

export interface StoreCacheOptions extends CacheConfig {
  strategy: "lru" | "fifo" | "none";
  persistent?: boolean;
  compression?: boolean;
  validateOnRead?: boolean;
}

export interface StoreOptions<T> extends StoreConfig<T> {
  cache?: Partial<StoreCacheOptions>;
  hooks?: Partial<StoreHooks<T>>;
  validators?: StoreValidator<T>[];
  errorHandler?: StoreErrorHandler;
  metricsHandler?: StoreMetricsHandler;
  persistence?: Partial<StorePersistenceOptions>;
}
