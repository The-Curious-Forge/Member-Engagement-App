/// <reference types="vite/client" />
import type {
  ApiResponse,
  ApiError,
  Member,
  Activity,
  Kudos,
  Message,
  MemberType,
} from "$lib/types";
import { offlineDB } from "./offline/indexedDB";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export interface AirtableData {
  members: Member[];
  memberTypes: MemberType[];
  activities: Activity[];
  kudos: Kudos[];
  messages: Message[];
  signedInMembers: Member[];
  memberOfTheMonth?: Member;
}

class ApiService {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (!navigator.onLine) {
      if (options.method === "GET" || !options.method) {
        const cachedData = await offlineDB.getFromCache(url);
        if (cachedData) {
          return {
            data: cachedData as T,
            status: 200,
            message: "Retrieved from cache",
          };
        }
      }
      await offlineDB.addToOutbox(url, config);
      throw new Error("Offline: Request added to outbox");
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData: Record<string, unknown> = {};

        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: await response.text() };
          }
        } else {
          errorData = { message: await response.text() };
        }

        const error: ApiError = {
          status: response.status,
          message: (errorData.message as string) || "An error occurred",
          details: (errorData.details as Record<string, unknown>) || {},
        };
        throw error;
      }

      const data = await response.json();

      if (options.method === "GET" || !options.method) {
        await offlineDB.addToCache(url, data);
      }

      return {
        data: data as T,
        status: response.status,
        message: data.message,
      };
    } catch (error) {
      if (!navigator.onLine) {
        await offlineDB.addToOutbox(url, config);
        throw new Error("Offline: Request added to outbox");
      }
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiService = new ApiService();

// Offline sync setup
export function setupOfflineSync() {
  window.addEventListener("online", syncOfflineData);
}

export async function syncOfflineData() {
  await offlineDB.processOutbox(async (item) => {
    const url = `${API_URL}${item.action}`;
    const response = await fetch(url, item.data);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}
