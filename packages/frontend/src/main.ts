import { mount } from "svelte";
import App from "./lib/components/HomeScreen.svelte";
import { setupOfflineSync } from "./lib/services/apiService";
import { registerBackgroundSync } from "./lib/services/backgroundSync";
import { loadInitialData } from "./lib/services/initialDataService";
import { airtableStore } from "./lib/stores/airtable/airtableStore";

async function initializeApp() {
  try {
    console.log("Starting app initialization...");

    // Load initial data
    console.log("Loading initial data...");
    await loadInitialData();
    console.log("Initial data loaded successfully");

    // Log the contents of the airtableStore
    console.log("AirtableStore contents:", {
      members: airtableStore.getMembers(),
      memberTypes: airtableStore.getMemberTypes(),
      activities: airtableStore.getActivities(),
      kudos: airtableStore.getKudos(),
      messages: airtableStore.getMessages(),
      signedInMembers: airtableStore.getSignedInMembers(),
      memberOfTheMonth: airtableStore.getMemberOfTheMonth(),
    });

    // Set up offline sync
    console.log("Setting up offline sync...");
    setupOfflineSync();

    // Initialize the app using Svelte 5's mount function
    console.log("Initializing the app component...");
    const app = mount(App, { target: document.body });

    // Register background sync after app initialization
    console.log("Registering background sync...");
    registerBackgroundSync().catch((error) => {
      console.warn(
        "Background sync registration failed, but app will continue:",
        error
      );
    });

    console.log("App initialization completed successfully");
    return app;
  } catch (error) {
    console.error(
      "Failed to initialize app:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

initializeApp().catch(console.error);
