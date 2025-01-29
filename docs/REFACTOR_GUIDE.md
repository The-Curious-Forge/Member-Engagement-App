# Store Refactoring Guide

## Overview

The store architecture has been refactored to provide:

- Type-safe store implementations
- Consistent caching behavior
- Unified error handling
- Standardized API interactions
- Better state management

## Store Types

### 1. Entity Stores

For domain objects with unique IDs (Members, Activities, Kudos, Messages, etc.)

```typescript
import { memberStore } from "$lib/stores";

// Using the store
async function getMemberDetails(id: string) {
  const member = await memberStore.get(id);
  return member;
}

// Subscribing to changes
memberStore.subscribe((members) => {
  console.log("Members updated:", members);
});
```

### 2. Collection Stores

For managing collections of data (Airtable data)

```typescript
import { airtableStore } from "$lib/stores";

// Getting collection data
async function getAllData() {
  const data = await airtableStore.getCollection();
  return data;
}

// Subscribing to state changes
airtableStore.subscribeToState((state) => {
  console.log("Airtable state updated:", state);
});
```

## Migration Guide

### 1. Component Updates

Before:

```svelte
<script>
import { getMembers } from '$lib/api';
let members = [];

onMount(async () => {
  members = await getMembers();
});
</script>
```

After:

```svelte
<script>
import { memberStore } from '$lib/stores';
let members = [];

memberStore.subscribe(updatedMembers => {
  members = updatedMembers;
});

onMount(() => {
  memberStore.getAll();
});
</script>
```

### 2. API Interactions

Before:

```typescript
async function signInMember(memberId: string) {
  await fetch("/api/signIn", {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
}
```

After:

```typescript
import { memberStore } from "$lib/stores";

async function signInMember(memberId: string) {
  await memberStore.signIn(memberId);
}
```

### 3. Store Initialization

Add to your app's entry point:

```typescript
import { initializeStores } from "$lib/stores";

onMount(async () => {
  await initializeStores();
});
```

## Best Practices

1. **Store Access**

   - Always import stores from the central `$lib/stores` index
   - Use store methods instead of direct API calls
   - Subscribe to changes instead of polling

2. **Error Handling**

   ```typescript
   try {
     await memberStore.signIn(memberId);
   } catch (error) {
     if (error.status === 404) {
       // Handle member not found
     } else {
       // Handle other errors
     }
   }
   ```

3. **Offline Support**

   - Stores automatically handle offline caching
   - Use store methods to ensure offline-first behavior

   ```typescript
   // Will work offline and sync when online
   await messageStore.sendMessage("Hello");
   ```

4. **State Management**

   - Use store subscriptions for reactive updates
   - Avoid manual state management

   ```svelte
   <script>
   import { memberStore, messageStore } from '$lib/stores';

   $: members = [];
   $: messages = [];

   memberStore.subscribe(m => members = m);
   messageStore.subscribe(m => messages = m);
   </script>
   ```

## Performance Considerations

1. **Caching**

   - Each store has configurable cache settings
   - Adjust TTL and cache size based on data volatility

   ```typescript
   {
     cacheConfig: {
       maxSize: 1000,
       ttl: 5 * 60 * 1000 // 5 minutes
     }
   }
   ```

2. **Batch Operations**

   - Use store methods that support batch operations

   ```typescript
   // Instead of multiple single updates
   await Promise.all(
     members.map((member) => memberStore.update(member.id, { active: true }))
   );
   ```

3. **Selective Subscriptions**

   - Subscribe only to needed data
   - Unsubscribe when component is destroyed

   ```svelte
   <script>
   import { onDestroy } from 'svelte';
   import { memberStore } from '$lib/stores';

   const unsubscribe = memberStore.subscribe(members => {
     // Handle updates
   });

   onDestroy(unsubscribe);
   </script>
   ```

## Testing

1. **Mock Stores**

   ```typescript
   import { BaseEntityStore } from "$lib/stores";

   class MockMemberStore extends BaseEntityStore<Member> {
     constructor() {
       super({
         name: "MockMember",
         api: new MockMemberAPI(),
       });
     }
   }
   ```

2. **Test Utilities**
   ```typescript
   export function createTestStore<T>(initialData: T[]) {
     return new BaseEntityStore<T>({
       name: "Test",
       api: {
         fetch: async () => initialData[0],
         fetchAll: async () => initialData,
         create: async (data) => ({ id: "test", ...data }),
         update: async (id, data) => ({ id, ...data }),
         delete: async () => {},
       },
     });
   }
   ```

## Monitoring and Debugging

1. **Store Metrics**

   - All stores emit performance metrics
   - Monitor cache hit rates and API latencies

   ```typescript
   memberStore.subscribe((data) => {
     console.debug("Store update:", {
       size: data.length,
       timestamp: new Date(),
     });
   });
   ```

2. **Error Tracking**
   - Stores provide detailed error information
   - Integration with error monitoring services
   ```typescript
   try {
     await memberStore.getAll();
   } catch (error) {
     errorMonitoringService.captureError(error);
   }
   ```
