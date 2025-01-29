import { offlineDB } from "./offline/indexedDB";
import { airtableStore } from "../stores/airtable/airtableStore";
import { apiService } from "./apiService";

declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    };
  }

  interface Window {
    SyncManager: any;
  }
}

export async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers not supported");
    return;
  }

  if (!("SyncManager" in window)) {
    console.log("Background sync not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log("No service worker registration found");
      return;
    }

    if (registration.active) {
      await registration.sync.register("sync-outbox");
      console.log("Background sync registered successfully");
    } else {
      console.log("Service worker is not yet active");
    }
  } catch (err) {
    console.error("Background sync registration failed:", err);
    // Continue with app initialization even if background sync fails
  }
}

export async function performBackgroundSync() {
  console.log("Performing background sync");
  try {
    await offlineDB.processOutbox(async (item) => {
      const { method = "GET", body } = item.data || {};
      if (method === "GET") {
        await apiService.get(item.action);
      } else if (method === "POST" && body) {
        await apiService.post(item.action, body);
      } else if (method === "PUT" && body) {
        await apiService.put(item.action, body);
      } else if (method === "DELETE") {
        await apiService.delete(item.action);
      }
    });
    await airtableStore.sync();
    console.log("Background sync completed successfully");
  } catch (error) {
    console.error("Error during background sync:", error);
    throw error;
  }
}

export async function startAutoSync() {
  try {
    await airtableStore.sync();
    console.log("Initial sync completed");
  } catch (error) {
    console.error("Error during initial sync:", error);
  }

  // Set up periodic sync
  setInterval(async () => {
    try {
      await airtableStore.sync();
      console.log("Auto sync completed");
    } catch (error) {
      console.error("Error during auto sync:", error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

export async function handleResync() {
  try {
    await airtableStore.sync();
    console.log("Manual sync completed");
  } catch (error) {
    console.error("Error during manual sync:", error);
  }
}
