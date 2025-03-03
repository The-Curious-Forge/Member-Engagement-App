# Dashboard Layout Design

## Core Concepts

1. **Variable Module Sizes**

   - Modules can occupy different grid spaces (1x1, 2x1, 2x2, etc.)
   - Size reflects the module's importance and content needs
   - Grid layout ensures all modules fit together without gaps

2. **Selective Expansion**

   - Not all modules need expansion capability
   - Some modules work best at fixed sizes
   - Expansion should be purpose-driven, not a universal feature

3. **Edit Mode**
   - Toggle between View and Edit modes
   - Edit mode enables:
     - Drag-and-drop module repositioning
     - Module size adjustments (within grid constraints)
     - Module collapse/expand settings
   - Changes persist in local storage

## Main Dashboard Layout Example

Default arrangement (6x6 grid, modules can span multiple cells):

```
+----------------+----------------+----------------+
|    Member Search (2x1)         |     Alerts    |
|    [no expansion]              |     (1x1)     |
+----------------+----------------+----------------+
|                Who's Signed In                  |
|                     (3x2)                      |
|              [expandable to 3x3]               |
+----------------+----------------+----------------+
|    Recent      |   Today's     |    Mentors    |
|    Kudos       |    Events     |     (1x1)     |
|     (1x2)      |    (1x1)      |[no expansion] |
+----------------+----------------+----------------+
```

## Module Size Guidelines

### Fixed-Size Modules

- **Alerts** (1x1): Quick notifications
- **Member Search** (2x1): Efficient search bar
- **Mentors** (1x1): Available mentor count

### Variable-Size Modules

- **Who's Signed In** (3x2 default, expandable to 3x3)
- **Recent Kudos** (1x2 default, expandable to 2x2)
- **Today's Events** (1x1 default, expandable to 2x2)

## Edit Mode Interface

```
+------------------------------------------+
|                 Toolbar                   |
| [Edit Mode] [Save Layout] [Reset Default] |
+------------------------------------------+

When in Edit Mode:
+----------------+
|   Module       | <- Drag handles on corners
|   [↔️ Resize]   | <- Resize indicators
|   [↕️ Move]     | <- Move indicators
+----------------+
```

## Grid System

- Base grid of 6x6 cells
- Modules snap to grid lines
- Minimum module size: 1x1
- Maximum module size: 3x3
- System prevents invalid arrangements

## Module States

### Fixed Modules

```
+------------------------+
| Module Title          |
+------------------------+
| Static Content        |
| (optimized for size)  |
+------------------------+
```

### Expandable Modules

```
+------------------------+
| Module Title      [↕️] |
+------------------------+
| Dynamic Content       |
| (adapts to size)      |
+------------------------+
```

## Personal Dashboard Layout

Similar principles apply to the personal dashboard, with module sizes optimized for member-specific functions:

```
+----------------+----------------+----------------+
|     Sign In/Out (2x2)          |   Messages    |
|     [primary interaction]       |    (1x2)     |
|                                |              |
+----------------+----------------+----------------+
|     Stats      |   Feedback    |     Help      |
|     (2x1)      |    (1x1)     |    (1x1)     |
+----------------+----------------+----------------+
```

## Implementation Considerations

### Grid System

- Use CSS Grid with `grid-template-areas`
- Define breakpoints for responsive behavior
- Maintain aspect ratios during resizing

### Drag and Drop

- Implement using a library like `svelte-dnd-action`
- Store layout in local storage
- Validate moves to prevent invalid layouts

### Module Configuration

```typescript
interface ModuleConfig {
  id: string;
  title: string;
  defaultSize: {
    width: number; // Grid units
    height: number; // Grid units
  };
  maxSize?: {
    width: number;
    height: number;
  };
  isExpandable: boolean;
  defaultPosition: {
    x: number;
    y: number;
  };
}
```

### Layout Persistence

- Save layouts per user/device
- Include module positions and sizes
- Provide reset to default option

This revised design emphasizes the variable nature of modules while maintaining a cohesive grid-based layout system. The edit mode provides flexibility for customization while ensuring the layout remains functional and organized.
