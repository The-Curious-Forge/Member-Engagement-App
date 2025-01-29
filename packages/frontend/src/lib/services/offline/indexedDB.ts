import { Dexie } from "dexie";

interface OutboxItem {
  id?: number;
  action: string;
  data: any;
  timestamp: string;
}

interface CacheItem {
  id?: number;
  url: string;
  data: any;
  timestamp: string;
}

class OfflineDatabase extends Dexie {
  outbox: Dexie.Table<OutboxItem, number>;
  cache: Dexie.Table<CacheItem, number>;

  constructor() {
    super("OfflineDatabase");
    this.version(1).stores({
      outbox: "++id, action, timestamp",
      cache: "++id, url, timestamp",
    });
    this.outbox = this.table("outbox");
    this.cache = this.table("cache");
  }

  async addToOutbox(action: string, data: any): Promise<void> {
    await this.outbox.add({
      action,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  async processOutbox(
    processFunction: (item: OutboxItem) => Promise<void>
  ): Promise<void> {
    const items = await this.outbox.toArray();
    for (const item of items) {
      try {
        await processFunction(item);
        await this.outbox.delete(item.id!);
      } catch (error) {
        console.error("Failed to process outbox item:", error);
      }
    }
  }

  async getFromCache(url: string): Promise<any | null> {
    const cacheItem = await this.cache.where("url").equals(url).first();
    if (cacheItem) {
      // You might want to add cache invalidation logic here
      return cacheItem.data;
    }
    return null;
  }

  async addToCache(url: string, data: any): Promise<void> {
    await this.cache.put({
      url,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

export const offlineDB = new OfflineDatabase();
