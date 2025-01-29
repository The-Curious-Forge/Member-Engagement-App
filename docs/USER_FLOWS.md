# User Flows

This file details the main user flows and how users interact with the kiosk app.

## Home Screen

- **Left Column**: Recent Kudos feed
- **Center**: 
  - Notifications / Alerts at the top
  - Search Bar in the middle ("Search for your name...")
  - Mentorship & Calendar buttons at the bottom
- **Right Column**: List of currently signed-in members (name + type + time)

### Searching for a Member

1. User types the first few letters of first or last name in search bar.
2. Auto-complete finds matching **active** members from local store.
3. Selecting a name → opens the Dashboard Modal.

## Dashboard Modal

Displays:
- Member’s **name**, **Forge Level**, membership stats.
- List of **messages** sent to the member.
- **Actions** panel on the right:
  - **Sign In** / **Sign Out** (depending on current status)
  - **Give Kudos**
  - **Send a Message**
  - **Close** button

### Sign In

1. Modal shows **"Sign In"** if the user is currently not signed in.
2. If user has multiple possible types (Member, Staff, etc.), show a type selection prompt.
3. On confirm → new record in "Signed In" table → broadcast signIn event.
4. Modal closes, user name appears in Signed-In list.

### Sign Out

1. Modal shows **"Sign Out"** if user is currently signed in, plus how long they’ve been signed in.
2. On click, show activity allocation (sliders, 0–100%, must total 100%).
3. Confirm sign-out → remove from "Signed In" + create "Use Log" + multiple "Activity Log" entries.
4. WebSocket broadcast → kiosk updates.

### Give Kudos

1. Button is always available on the dashboard (even if user is not signed in).
2. Opens kudos form (select "From" if not auto-determined, select multiple "To," enter message).
3. Submit → new record in "Kudos" table + real-time broadcast → feed updates.

### Send a Message

1. Opens a text input form to send a message to the office.
2. Submit → new record in "Received Sign In App Messages" table + optional broadcast for staff.

## Additional Features

- **Mentorship**: button on home screen leads to a list or sign-up flow (optional).
- **Calendar**: button on home screen shows upcoming events from an events table or "Calendar" table.