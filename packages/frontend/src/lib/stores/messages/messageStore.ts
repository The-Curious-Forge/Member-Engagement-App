import type { Message } from "$lib/types";
import { BaseEntityStore } from "../core/baseStores";
import type { DomainAPI } from "../core/types";
import { apiService } from "$lib/services/apiService";

class MessageAPI implements DomainAPI<Message> {
  async fetch(id: string): Promise<Message> {
    const response = await apiService.get<Message>(`/messages/${id}`);
    return response.data;
  }

  async fetchAll(filter?: Partial<Message>): Promise<Message[]> {
    let url = "/messages";
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
    const response = await apiService.get<Message[]>(url);
    return response.data;
  }

  async create(data: Partial<Message>): Promise<Message> {
    const response = await apiService.post<Message>("/messages", data);
    return response.data;
  }

  async update(id: string, data: Partial<Message>): Promise<Message> {
    const response = await apiService.put<Message>(`/messages/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/messages/${id}`);
  }
}

class MessageStore extends BaseEntityStore<Message> {
  constructor() {
    super({
      name: "Message",
      api: new MessageAPI(),
      cacheConfig: {
        maxSize: 200,
        ttl: 2 * 60 * 1000, // 2 minutes - shorter TTL for messages
      },
    });
  }

  // Message-specific methods
  async sendMessage(
    text: string,
    memberId?: string,
    isImportant: boolean = false
  ): Promise<Message> {
    const messageData: Partial<Message> = {
      text,
      memberId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const message = await this.create(messageData);
    this.invalidate(); // Refresh the message list
    return message;
  }

  async markAsRead(id: string): Promise<Message> {
    const message = await this.update(id, { read: true });
    this.invalidate();
    return message;
  }

  async getUnreadMessages(): Promise<Message[]> {
    return this.getAll({ read: false });
  }

  async getMessagesForMember(memberId: string): Promise<Message[]> {
    return this.getAll({ memberId });
  }

  async getRecentMessages(limit: number = 10): Promise<Message[]> {
    const response = await apiService.get<Message[]>(
      `/messages/recent?limit=${limit}`
    );
    const messages = response.data;
    messages.forEach((m) => {
      this.cache.set(m.id, { data: m, timestamp: Date.now() });
    });
    return messages;
  }

  async fetchNotifications(): Promise<Message[]> {
    const response = await apiService.get<Message[]>("/notifications");
    const notifications = response.data;
    notifications.forEach((n) => {
      this.cache.set(n.id, { data: n, timestamp: Date.now() });
    });
    return notifications;
  }

  async markAllAsRead(): Promise<void> {
    const unreadMessages = await this.getUnreadMessages();
    await Promise.all(
      unreadMessages.map((message) => this.markAsRead(message.id))
    );
  }

  // Helper method to format message for display
  formatMessagePreview(message: Message): string {
    const maxLength = 50;
    if (message.text.length <= maxLength) {
      return message.text;
    }
    return `${message.text.substring(0, maxLength)}...`;
  }

  // Override persist to handle any message-specific persistence logic
  async persist(): Promise<void> {
    const unreadMessages = await this.getUnreadMessages();
    if (unreadMessages.length > 0) {
      console.warn(`There are ${unreadMessages.length} unread messages`);
    }
    // In this case, we don't need to do anything special
    // as all changes are immediately persisted to the backend
    return Promise.resolve();
  }
}

// Create singleton instance
export const messageStore = new MessageStore();
