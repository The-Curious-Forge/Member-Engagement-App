import type {
  AirtableData,
  Member,
  Activity,
  Message,
  MemberType,
  AirtableState,
  Kudos,
} from "$lib/types";
import { BaseCollectionStore } from "../core/baseStores";
import type { DomainAPI } from "../core/types";
import { apiService } from "$lib/services/apiService";
import { writable, get, type Writable } from "svelte/store";

export const isSyncing = writable(false);
export const lastSyncTime = writable<Date | null>(null);

class AirtableAPI implements DomainAPI<AirtableData> {
  async fetch(): Promise<AirtableData> {
    const response = await apiService.get<AirtableData>("/airtable/allData");
    return response.data;
  }

  async fetchAll(): Promise<AirtableData[]> {
    const data = await this.fetch();
    return [data];
  }

  // These methods are not used for Airtable store as it's read-only
  async create(): Promise<AirtableData> {
    throw new Error("Create operation not supported for Airtable store");
  }

  async update(id: string, data: AirtableData): Promise<AirtableData> {
    // For Airtable store, update is a no-op since it's read-only
    // Just return the data as-is
    return data;
  }

  async delete(): Promise<void> {
    throw new Error("Delete operation not supported for Airtable store");
  }
}

class AirtableStore extends BaseCollectionStore<AirtableData> {
  private state = writable<AirtableState>({
    initialized: false,
    lastSync: null,
    members: [],
    memberTypes: [],
    activities: [],
    kudos: [],
    messages: [],
    signedInMembers: [],
    memberOfTheMonth: undefined,
  });

  constructor() {
    super({
      name: "Airtable",
      api: new AirtableAPI(),
      cacheConfig: {
        maxSize: 1,
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    });

    // Subscribe to collection updates
    this.subscribe(([data]) => {
      if (data) {
        this.state.update((state) => ({
          ...state,
          ...data,
          initialized: true,
          lastSync: new Date().toISOString(),
        }));
      }
    });
  }

  // Helper methods to access specific data types
  getMembers(): Member[] {
    return get(this.state).members;
  }

  getMemberTypes(): MemberType[] {
    return get(this.state).memberTypes;
  }

  getActivities(): Activity[] {
    return get(this.state).activities;
  }

  getKudos(): Kudos[] {
    return get(this.state).kudos;
  }

  getMessages(): Message[] {
    return get(this.state).messages;
  }

  getSignedInMembers(): Member[] {
    return get(this.state).signedInMembers;
  }

  getMemberOfTheMonth(): Member | undefined {
    return get(this.state).memberOfTheMonth;
  }

  isInitialized(): boolean {
    return get(this.state).initialized;
  }

  getLastSync(): string | null {
    return get(this.state).lastSync;
  }

  // Method to manually trigger a sync
  async sync(): Promise<void> {
    if (get(isSyncing)) {
      console.log("Sync already in progress, skipping");
      return;
    }

    isSyncing.set(true);
    try {
      await this.invalidate();
      lastSyncTime.set(new Date());
      console.log("Airtable data synced successfully");
    } catch (error) {
      console.error("Error syncing Airtable data:", error);
      throw error;
    } finally {
      isSyncing.set(false);
    }
  }

  // Subscribe to state changes
  subscribeToState(callback: (state: AirtableState) => void): () => void {
    return this.state.subscribe(callback);
  }

  // Override persist to handle the collection update
  async persist(): Promise<void> {
    const currentState = get(this.state);
    await this.updateCollection(currentState);
  }

  // Helper methods to update specific data types
  setAllData(data: AirtableData) {
    this.state.update((state) => {
      const newState = {
        ...state,
        ...data,
        initialized: true,
        lastSync: new Date().toISOString(),
      };
      this.store.set([newState]);
      return newState;
    });
  }

  updateMembers(members: Member[]) {
    this.state.update((state) => {
      const newState = { ...state, members };
      this.store.set([newState]);
      return newState;
    });
  }

  updateMemberTypes(memberTypes: MemberType[]) {
    this.state.update((state) => {
      const newState = { ...state, memberTypes };
      this.store.set([newState]);
      return newState;
    });
  }

  updateActivities(activities: Activity[]) {
    this.state.update((state) => {
      const newState = { ...state, activities };
      this.store.set([newState]);
      return newState;
    });
  }

  updateKudos(kudos: Kudos[]) {
    this.state.update((state) => {
      const newState = { ...state, kudos };
      this.store.set([newState]);
      return newState;
    });
  }

  updateMessages(messages: Message[]) {
    this.state.update((state) => {
      const newState = { ...state, messages };
      this.store.set([newState]);
      return newState;
    });
  }

  updateSignedInMembers(signedInMembers: Member[]) {
    console.log("Updating signed-in members:", signedInMembers);
    this.state.update((state) => {
      const newState = {
        ...state,
        signedInMembers: [...signedInMembers].sort(
          (a, b) =>
            new Date(b.signInTime || "").getTime() -
            new Date(a.signInTime || "").getTime()
        ),
      };
      console.log("New state:", newState);
      // Important: Update both the state and the store
      this.store.set([newState]);
      return newState;
    });
  }

  addSignedInMember(member: Member) {
    console.log("Adding signed-in member:", member);
    this.state.update((state) => {
      const currentMembers = [...state.signedInMembers];
      const existingIndex = currentMembers.findIndex((m) => m.id === member.id);

      if (existingIndex !== -1) {
        currentMembers[existingIndex] = member;
      } else {
        currentMembers.push(member);
      }

      // Sort by sign-in time
      const sortedMembers = currentMembers.sort(
        (a, b) =>
          new Date(b.signInTime || "").getTime() -
          new Date(a.signInTime || "").getTime()
      );

      const newState = {
        ...state,
        signedInMembers: sortedMembers,
      };

      console.log("New state after adding member:", newState);
      // Important: Update both the state and the store
      this.store.set([newState]);
      return newState;
    });
  }

  markMessageAsRead(messageId: string) {
    this.state.update((state) => {
      const newState = {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        ),
        members: state.members.map((member) => ({
          ...member,
          messages:
            member.messages?.map((msg) =>
              msg.id === messageId ? { ...msg, read: true } : msg
            ) || [],
        })),
      };
      this.store.set([newState]);
      return newState;
    });
  }

  addKudos(kudos: Kudos) {
    this.state.update((store) => {
      // Check if the kudos already exists in the store
      const kudosExists = store.kudos.some((k) => k.id === kudos.id);
      if (kudosExists) {
        return store; // If it exists, don't add it again
      }

      const newState = {
        ...store,
        kudos: [kudos, ...store.kudos],
        members: store.members.map((member) => {
          if (member.id === kudos.fromMemberId) {
            return {
              ...member,
              kudosGiven: [...(member.kudosGiven || []), kudos],
            };
          }
          if (kudos.toMemberIds?.includes(member.id)) {
            return {
              ...member,
              kudosReceived: [...(member.kudosReceived || []), kudos],
            };
          }
          return member;
        }),
      };
      this.store.set([newState]);
      return newState;
    });
  }

  addMessage(message: Message) {
    this.state.update((store) => {
      const newState = {
        ...store,
        messages: [message, ...store.messages],
      };
      this.store.set([newState]);
      return newState;
    });
  }

  updateMemberOfTheMonth(memberOfTheMonth: Member | undefined) {
    this.state.update((store) => {
      const newState = { ...store, memberOfTheMonth };
      this.store.set([newState]);
      return newState;
    });
  }
}

// Create singleton instance
export const airtableStore = new AirtableStore();
