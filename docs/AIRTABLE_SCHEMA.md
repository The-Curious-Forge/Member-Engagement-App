# Airtable Schema for The Curious Forge Kiosk App

This document outlines the **core Airtable schema** as of the current version. Note that fields and tables may change over time as features evolve.

## Master Sheet (Table: "mastersheet")

- **Preferred Name** (single line text)
- **Last Name** (single line text)
- **Member Types** (linked to the **"Member Types"** table)
- **Sign In App Messaging** (linked to **"All Sign In App Messages"** table)
- **totalHours** (number)
- **updatedQualifications** (long text, comma-separated)
- **Total Points** (number)
- **Point Breakdown** (long text, comma-separated)
- **WeeklyStreak** (number)
- **ForgeLevel** (linked record to **"Forge Levels"**)
- **Member Bio** (long text)
- **Headshot** (attachment)
- **topActivities** (comma-seperated list of activities)

> **Filtered View**: "Sign-in App" filters only **active members** and only the **relevant columns** for sign-in kiosk usage.

---

## Member Types (Table: "Member Types")

- **Group** (text)
- **Members** (linked to **mastersheet**; shows who belongs to each type)
- **Show Sign In Option** (checkbox to indicate if type is shown in kiosk sign-in list)
- **SortingOrder** (number to control the display order)

---

## Signed In (Table: "Signed In")

- **Member** (linked to **mastersheet**; who is currently signed in)
- **SignInTime** (date/time)
- **SignedInType** (linked to **Member Types**)

This table lists members currently in the space. Deleting a record or marking it "ended" is how sign-out occurs.

---

## Use Log (Table: "Use Log")

Indicates each session a member spends in the space:

- **Member** (linked to **mastersheet**)
- **SignInTime** (date/time)
- **SignOutTime** (date/time)
- **SignedInAs** (linked to **Member Types**)
- **Activitiy Log** (linked to **Activity Log** entries, i.e., sub-activities done during the session)

---

## Activity Log (Table: "Activity Log")

Each row records a **single activity** done during a session:

- **Activity** (linked to **Activity List**)
- **ActivityTime** (number field, hours spent)
- **LogInSession** (linked to **Use Log**; indicates which session this activity was part of)

---

## Activity List (Table: "Activity List")

- **Activity** (text field with the name of the activity)

Used for sign-out sliders (members allocate time spent across multiple activities).

---

## All Sign In App Messages (Table: "All Sign In App Messages")

- **Message** (long text)
- **Message Date** (date/time)
- **Member** (linked to **mastersheet**; who it’s addressed to)
- **Read Date** (date/time, set when user views or marks it as read)
- **Important** (checkbox)
- **App Notification** (checkbox to display it as a banner notification on the home screen)

---

## Received Sign In App Messages (Table: "Received Sign In App Messages")

- **Message** (long text)
- **Message Date** (date/time)
- **Member** (linked to **mastersheet**; if known who sent it)
- **Important** (checkbox)
- Additional fields as needed.

This table is for messages that members send to staff/office.

---

## Qualifications (Table: "Qualification Classes")

- **Qualification** (Text field with the name of each qualification)

## Kudos (Table: "Kudos")

- **From** (linked to **mastersheet**; who sent the kudo, could be optional or "anonymous")
- **To** (linked to **mastersheet**, possibly multiple links)
- **Message** (long text)
- **Date** (date/time, when the kudo was sent)

---

## Forge Levels (Table: "Member Engagement Levels")

- **Level Name** (text)
- **Minimum Points** (number; threshold for that level)

---

## Monthly Recognition (Table: "Monthly Recognition")

- **Month** (date picker, set to a specific month)
- **Member of the Month** (linked to **mastersheet**)
- **Member Recognition Reason** (long text)

---

## Mentors (Table: "Mentors")

- **Mentor** (linked to **mastersheet**)
- **Area** (linked to an Areas table, or text, indicating which studio(s) or area(s) they mentor)

---

### Notes on Schema Changes

As the kiosk and makerspace needs evolve, new fields/tables may be added, and existing fields may be renamed or removed. The front-end and back-end are designed to **accommodate flexible schemas** wherever possible.
