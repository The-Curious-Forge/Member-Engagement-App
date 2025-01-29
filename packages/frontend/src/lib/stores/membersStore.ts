import { derived } from "svelte/store";
import { airtableStore } from "./airtable/airtableStore";
import type { Member } from "$lib/types";

export type { Member };

export const membersStore = derived(airtableStore, ($store) => {
  const data = $store?.[0];
  if (!data) return [];
  console.log("Members from airtableStore:", data.members);
  return data.members;
});

// Log state changes
membersStore.subscribe((value) => {
  console.log("Members store value:", value);
});
