import type { MemberType } from "$lib/types";
import { BaseEntityStore } from "../core/baseStores";
import type { DomainAPI } from "../core/types";
import { apiService } from "$lib/services/apiService";

class MemberTypeAPI implements DomainAPI<MemberType> {
  async fetch(id: string): Promise<MemberType> {
    const response = await apiService.get<MemberType>(`/memberTypes/${id}`);
    return response.data;
  }

  async fetchAll(filter?: Partial<MemberType>): Promise<MemberType[]> {
    let url = "/memberTypes";
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
    const response = await apiService.get<MemberType[]>(url);
    return response.data;
  }

  async create(data: Partial<MemberType>): Promise<MemberType> {
    const response = await apiService.post<MemberType>("/memberTypes", data);
    return response.data;
  }

  async update(id: string, data: Partial<MemberType>): Promise<MemberType> {
    const response = await apiService.put<MemberType>(
      `/memberTypes/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/memberTypes/${id}`);
  }
}

class MemberTypeStore extends BaseEntityStore<MemberType> {
  constructor() {
    super({
      name: "MemberType",
      api: new MemberTypeAPI(),
      cacheConfig: {
        maxSize: 50, // Smaller cache as we don't expect many member types
        ttl: 15 * 60 * 1000, // 15 minutes - longer TTL as member types change infrequently
      },
    });
  }

  // MemberType-specific methods
  async getActiveMemberTypes(): Promise<MemberType[]> {
    return this.getAll({ active: true });
  }

  async getMemberTypeByName(name: string): Promise<MemberType | undefined> {
    const memberTypes = await this.getAll();
    return memberTypes.find(
      (mt) => mt.name.toLowerCase() === name.toLowerCase()
    );
  }

  async toggleMemberType(id: string, active: boolean): Promise<MemberType> {
    return this.update(id, { active });
  }

  async updatePermissions(
    id: string,
    permissions: string[]
  ): Promise<MemberType> {
    return this.update(id, { permissions });
  }

  // Helper method to check if a member type has a specific permission
  hasPermission(memberType: MemberType, permission: string): boolean {
    return memberType.permissions?.includes(permission) ?? false;
  }

  // Helper method to get all available permissions
  getAvailablePermissions(): string[] {
    return [
      "SIGN_IN",
      "SIGN_OUT",
      "GIVE_KUDOS",
      "RECEIVE_KUDOS",
      "SEND_MESSAGES",
      "VIEW_DASHBOARD",
      "MANAGE_MEMBERS",
      "MANAGE_ACTIVITIES",
      "MANAGE_MEMBER_TYPES",
    ];
  }

  // Override persist to handle any member type-specific persistence logic
  async persist(): Promise<void> {
    // In this case, we don't need to do anything special
    // as all changes are immediately persisted to the backend
    return Promise.resolve();
  }
}

// Create singleton instance
export const memberTypeStore = new MemberTypeStore();
