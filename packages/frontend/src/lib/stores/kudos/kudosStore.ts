import { derived } from "svelte/store";
import { airtableStore } from "../airtable/airtableStore";
import type { Kudos } from "$lib/types";

export type { Kudos };

export const kudosStore = derived(airtableStore, ($store) => {
  const data = $store?.[0];
  if (!data) return [];
  console.log("Kudos from airtableStore:", data.kudos);
  return data.kudos;
});

// Log state changes
kudosStore.subscribe((value) => {
  console.log("Kudos store value:", value);
});
