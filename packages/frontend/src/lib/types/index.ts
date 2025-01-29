export interface Member {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  headshot?: string;
  profileImage?: string;
  memberType?: string;
  memberTypes?: {
    id: string;
    group: string;
    sortingOrder?: number;
  }[];
  lastSignIn?: string;
  signInTime?: string;
  signInRecordId?: string;
  signedInType?: string; // Added for signed-in member type
  kudosGiven?: Kudos[];
  kudosReceived?: Kudos[];
  messages?: MemberMessage[];
  updatedQualifications?: string;
  recognitionReason?: string;
  forgeLevel?: string;
  totalHours?: number;
  memberBio?: string;
  topActivities?: (string | null)[];
  isSignedIn?: boolean;
  totalPoints?: number[];
  weeklyStreak?: number;
  searchName?: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  active?: boolean;
}

export interface Message {
  id: string;
  text: string;
  createdAt: string;
  read?: boolean;
  appNotification?: boolean;
  memberId?: string;
}

export interface MemberMessage {
  id: string;
  message: string;
  messageDate: string;
  readDate?: string;
  appNotification?: boolean;
  member?: string[];
}

export interface MemberType {
  id: string;
  name: string;
  description?: string;
  color?: string;
  active?: boolean;
  permissions?: string[];
  group?: string; // Added for member type group
  sortingOrder?: number; // Added for member type sorting
}

export interface Kudos {
  id: string;
  message: string;
  date?: string;
  createdAt?: string;
  from: { id: string; name: string }[];
  to: { id: string; name: string }[];
  fromMemberId?: string;
  toMemberIds?: string[];
}

export interface AirtableState {
  initialized: boolean;
  lastSync: string | null;
  members: Member[];
  memberTypes: MemberType[];
  activities: Activity[];
  kudos: Kudos[];
  messages: Message[];
  signedInMembers: Member[];
  memberOfTheMonth?: Member;
}

export interface AirtableData {
  members: Member[];
  memberTypes: MemberType[];
  activities: Activity[];
  kudos: Kudos[];
  messages: Message[];
  signedInMembers: Member[];
  memberOfTheMonth?: Member;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details: Record<string, unknown>;
}
