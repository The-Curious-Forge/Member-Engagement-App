import type { Member } from "$lib/types";
import { BaseEntityStore } from "../core/baseStores";
import type { DomainAPI } from "../core/types";
import { apiService } from "$lib/services/apiService";

class MemberAPI implements DomainAPI<Member> {
  async fetch(id: string): Promise<Member> {
    const response = await apiService.get<Member>(`/members/${id}`);
    return response.data;
  }

  async fetchAll(filter?: Partial<Member>): Promise<Member[]> {
    let url = "/members";
    if (filter) {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    const response = await apiService.get<Member[]>(url);
    return response.data;
  }

  async create(data: Partial<Member>): Promise<Member> {
    const response = await apiService.post<Member>("/members", data);
    return response.data;
  }

  async update(id: string, data: Partial<Member>): Promise<Member> {
    const response = await apiService.put<Member>(`/members/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/members/${id}`);
  }
}

class MemberStore extends BaseEntityStore<Member> {
  constructor() {
    super({
      name: "Member",
      api: new MemberAPI(),
      cacheConfig: {
        maxSize: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    });
  }

  // Member-specific methods
  async search(query: string): Promise<Member[]> {
    const url = `/members/search?q=${encodeURIComponent(query)}`;
    const response = await apiService.get<Member[]>(url);
    return response.data;
  }

  async getSignedInMembers(): Promise<Member[]> {
    const response = await apiService.get<Member[]>("/members/signed-in");
    const members = response.data;
    members.forEach((member) => {
      this.cache.set(member.id, {
        data: member,
        timestamp: Date.now(),
      });
    });
    return members;
  }

  async signIn(memberId: string, memberType: string): Promise<void> {
    await apiService.post("/signIn", { memberId, memberType });
    this.invalidate();
  }

  async signOut(
    signInRecordId: string,
    activities: { id: string; time: number }[]
  ): Promise<void> {
    await apiService.post("/signOut", { signInRecordId, activities });
    this.invalidate();
  }

  async signOutAll(): Promise<void> {
    await apiService.post<void>("/signOut/all", {});
    this.invalidate();
  }

  // Override persist to handle any member-specific persistence logic
  async persist(): Promise<void> {
    // In this case, we don't need to do anything special
    // as all changes are immediately persisted to the backend
    return Promise.resolve();
  }
}

// Create singleton instance
export const memberStore = new MemberStore();
