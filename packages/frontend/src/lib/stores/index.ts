// Core store types and base implementations
export * from "./core/types";
export * from "./core/baseStores";

// Import store instances
import { membersStore } from "./membersStore";
import { activitiesStore } from "./activitiesStore";
import { kudosStore } from "./kudos/kudosStore";
import { messagesStore } from "./messagesStore";
import { memberTypesStore } from "./memberTypesStore";
import { airtableStore } from "./airtable/airtableStore";

// Re-export store instances
export {
  membersStore,
  activitiesStore,
  kudosStore,
  messagesStore,
  memberTypesStore,
  airtableStore,
};

// Store initialization function
export async function initializeStores(): Promise<void> {
  try {
    // Initialize Airtable store which contains all data
    await airtableStore.getCollection();
    console.log("All stores initialized successfully");
  } catch (error) {
    console.error("Error initializing stores:", error);
    throw error;
  }
}

// Store synchronization
export async function syncAllStores(): Promise<void> {
  try {
    await airtableStore.sync();
    console.log("All stores synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing stores:", error);
    throw error;
  }
}

// Store cleanup
export async function cleanupStores(): Promise<void> {
  try {
    // Persist any pending changes
    await airtableStore.persist();
    console.log("All stores cleaned up successfully");
  } catch (error) {
    console.error("Error cleaning up stores:", error);
    throw error;
  }
}

// Export store types
export type {
  Store,
  DomainAPI,
  CacheConfig,
  StoreConfig,
  StoreEvent,
  EventPriority,
  WithId,
  CollectionStore,
  EntityStore,
} from "./core/types";
