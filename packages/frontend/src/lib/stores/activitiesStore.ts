import { derived } from "svelte/store";
import { airtableStore } from "./airtable/airtableStore";
import type { Activity } from "$lib/types";

export type { Activity };

export const activitiesStore = derived(airtableStore, ($store) => {
  const data = $store?.[0];
  if (!data) return [];
  console.log("Activities from airtableStore:", data.activities);
  return data.activities;
});

// Log state changes
activitiesStore.subscribe((value) => {
  console.log("Activities store value:", value);
});
