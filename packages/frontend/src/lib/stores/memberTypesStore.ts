import { derived } from "svelte/store";
import { airtableStore } from "./airtable/airtableStore";
import type { MemberType } from "$lib/types";

export type { MemberType };

export const memberTypesStore = derived(airtableStore, ($store) => {
  const data = $store?.[0];
  if (!data) return [];
  console.log("Member types from airtableStore:", data.memberTypes);
  return data.memberTypes;
});

// Log state changes
memberTypesStore.subscribe((value) => {
  console.log("MemberTypes store value:", value);
});
