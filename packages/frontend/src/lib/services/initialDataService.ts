import { airtableStore } from "../stores/airtable/airtableStore";
import type { AirtableData } from "$lib/types";

export async function loadInitialData(): Promise<AirtableData> {
  console.log("Starting to load initial data...");
  try {
    // Load data through the store
    const [data] = await airtableStore.getAll();

    // Set the data in the store
    airtableStore.setAllData(data);

    console.log("Initial data loaded successfully");
    console.log("Fetched data:", data);

    return data;
  } catch (error) {
    console.error("Error loading initial data:", error);
    throw error;
  }
}
