import type { Activity } from "$lib/types";
import { BaseEntityStore } from "../core/baseStores";
import type { DomainAPI } from "../core/types";
import { apiService } from "$lib/services/apiService";

class ActivityAPI implements DomainAPI<Activity> {
  async fetch(id: string): Promise<Activity> {
    const response = await apiService.get<Activity>(`/activities/${id}`);
    return response.data;
  }

  async fetchAll(filter?: Partial<Activity>): Promise<Activity[]> {
    let url = "/activities";
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
    const response = await apiService.get<Activity[]>(url);
    return response.data;
  }

  async create(data: Partial<Activity>): Promise<Activity> {
    const response = await apiService.post<Activity>("/activities", data);
    return response.data;
  }

  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    const response = await apiService.put<Activity>(`/activities/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/activities/${id}`);
  }
}

class ActivityStore extends BaseEntityStore<Activity> {
  constructor() {
    super({
      name: "Activity",
      api: new ActivityAPI(),
      cacheConfig: {
        maxSize: 100,
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    });
  }

  // Activity-specific methods
  async getActiveActivities(): Promise<Activity[]> {
    return this.getAll({ active: true });
  }

  async toggleActivity(id: string, active: boolean): Promise<Activity> {
    return this.update(id, { active });
  }

  async getByCategory(category: string): Promise<Activity[]> {
    return this.getAll({ category });
  }

  // Override persist to handle any activity-specific persistence logic
  async persist(): Promise<void> {
    // In this case, we don't need to do anything special
    // as all changes are immediately persisted to the backend
    return Promise.resolve();
  }
}

// Create singleton instance
export const activityStore = new ActivityStore();
