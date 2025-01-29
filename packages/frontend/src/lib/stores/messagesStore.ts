import { derived } from "svelte/store";
import { airtableStore } from "./airtable/airtableStore";
import type { Message } from "$lib/types";

export type { Message };

export const messagesStore = derived(airtableStore, ($store) => {
  const data = $store?.[0];
  if (!data) return [];
  console.log("Messages from airtableStore:", data.messages);
  return data.messages;
});

// Log state changes
messagesStore.subscribe((value) => {
  console.log("Messages store value:", value);
});
