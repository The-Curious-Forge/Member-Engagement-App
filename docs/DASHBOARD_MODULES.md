# Dashboard Module System

The dashboard module system provides a flexible, grid-based layout for displaying various components of the member engagement application. Each module is a self-contained component that can be positioned, resized, and configured independently.

## Grid Layout

The dashboard uses a 6x6 grid system that allows for flexible module placement and sizing:

- Small modules: 1x1 (alerts, mentors)
- Medium modules: 2x1 (member search), 1x2 (recent kudos)
- Large modules: 2x2 (recognition), 3x2 (active members)

The grid system ensures consistent spacing and alignment while allowing modules to be rearranged through drag-and-drop in edit mode.

## Module Types

### Fixed Size Modules

- Member Search (2x1)
- Alerts (1x1)
- Recognition (2x2)
- Mentors (1x1)

### Expandable Modules

- Active Members (3x2, expands to 3x3)
- Recent Kudos (1x2, expands to 2x2)
- Today's Events (2x1, expands to 2x2)

## Creating New Modules

To create a new module:

1. Create a new component in `src/components/dashboard/modules/`
2. Implement the required module interface:

```typescript
interface ModuleProps {
  config: ModuleConfig;
  isExpanded: boolean;
}
```

3. Add module configuration to `ModuleID` enum and `defaultModuleConfigs`:

```typescript
export enum ModuleID {
  YourModule = "your-module",
}

const defaultModuleConfigs: Record<ModuleID, ModuleConfig> = {
  [ModuleID.YourModule]: {
    id: ModuleID.YourModule,
    title: "Your Module",
    defaultSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 2 }, // Optional, for expandable modules
    isExpandable: false,
    defaultPosition: { x: 0, y: 0 },
  },
};
```

4. Register the module in the main dashboard:

```typescript
import YourModule from "../components/dashboard/modules/YourModule.svelte";

const moduleContent = {
  [ModuleID.YourModule]: YourModule,
};
```

## Module Features

### Drag and Drop

- Modules can be repositioned in edit mode
- Grid snapping ensures consistent alignment
- Position constraints prevent modules from overlapping or exceeding grid bounds

### Expansion/Collapse

- Expandable modules can toggle between default and maximum size
- Expansion is disabled in edit mode
- Layout adjusts automatically to accommodate expanded modules

### State Management

- Module positions and expanded states are persisted in localStorage
- Layout can be reset to default configuration
- Edit mode changes are only saved when explicitly confirmed

## Best Practices

1. **Module Independence**

   - Modules should be self-contained and not depend on other modules
   - Use stores for sharing data between modules
   - Handle loading and error states within the module

2. **Responsive Design**

   - Design modules to work at their minimum size
   - Use scrolling for overflow content
   - Consider both expanded and collapsed states

3. **Performance**

   - Lazy load data when possible
   - Use efficient update strategies
   - Consider using web workers for heavy computations

4. **Accessibility**
   - Ensure proper keyboard navigation
   - Maintain ARIA attributes
   - Support screen readers

## Module Communication

Modules can communicate through several methods:

1. **Event Dispatch**

   - Use Svelte's createEventDispatcher for module-specific events
   - Handle events at the dashboard level when needed

2. **Stores**

   - Use shared stores for global state
   - Create module-specific stores for complex state management

3. **Props**
   - Pass configuration through the ModuleConfig interface
   - Use the isExpanded prop for expansion state

## Testing

When creating new modules:

1. Test basic rendering
2. Verify expansion behavior (if applicable)
3. Test drag and drop functionality
4. Verify state persistence
5. Test responsive behavior
6. Verify accessibility requirements
