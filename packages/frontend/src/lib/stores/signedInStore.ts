import { derived } from "svelte/store";
import { airtableStore } from "./airtable/airtableStore";
import type { Member } from "$lib/types";

export const signedInStore = derived<typeof airtableStore, Member[]>(
  airtableStore,
  ($store, set) => {
    const data = $store?.[0];
    if (!data) {
      set([]);
      return;
    }

    // Sort by sign-in time
    const sortedMembers = [...data.signedInMembers].sort(
      (a, b) =>
        new Date(b.signInTime || "").getTime() -
        new Date(a.signInTime || "").getTime()
    );

    console.log("SignedIn store updating with:", sortedMembers);
    set(sortedMembers);
  },
  [] // initial value
);

// Log state changes
signedInStore.subscribe((value) => {
  console.log("SignedIn store value:", value);
});
