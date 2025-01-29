import { io, Socket } from "socket.io-client";
import { airtableStore } from "../stores/airtable/airtableStore";
import { apiService } from "./apiService";
import type { Member, Message, Kudos } from "$lib/types";

let socket: Socket | null = null;

export function initializeSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_WEBSOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("signInUpdate", (member: Member) => {
      console.log("Received signInUpdate:", member);
      // Use addSignedInMember to handle the update
      airtableStore.addSignedInMember(member);
    });

    socket.on("signOutUpdate", (data: { signInRecordId: string }) => {
      const currentMembers = airtableStore.getSignedInMembers();
      const updatedMembers = currentMembers.filter(
        (member) => member.signInRecordId !== data.signInRecordId
      );
      airtableStore.updateSignedInMembers(updatedMembers);
    });

    socket.on("kudosUpdate", (data: Kudos) => {
      airtableStore.addKudos(data);
    });

    socket.on("newMessage", (data: Message) => {
      airtableStore.addMessage(data);
    });

    socket.on("appNotification", (data: Message) => {
      const notificationMessage = { ...data, appNotification: true };
      airtableStore.addMessage(notificationMessage);
    });
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
