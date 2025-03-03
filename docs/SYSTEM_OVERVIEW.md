# The Curious Forge Member Engagement Application

## System Overview

The Curious Forge Member Engagement Application is a comprehensive kiosk-based system designed to manage member interactions, track engagement, and facilitate community building within the makerspace. The application follows an offline-first, real-time architecture with a focus on reliability and user experience.

## Technical Stack

### Frontend (SvelteKit)

- **Framework**: SvelteKit with TypeScript
- **State Management**: Custom Svelte stores
- **Real-time Updates**: Socket.IO client
- **Offline Support**: Service Workers + IndexedDB
- **UI Components**: Custom Svelte components
- **Build Tool**: Vite

### Backend (Node.js)

- **Runtime**: Node.js with Express
- **Real-time**: Socket.IO server
- **Data Storage**: Airtable as primary database
- **Caching**: Redis for performance optimization
- **API Design**: RESTful with WebSocket events

## Core Features

1. **Member Management**

   - Sign-in/out tracking
   - Member profiles and activity history
   - Membership type management
   - Points and engagement tracking

2. **Activity Tracking**

   - Time allocation across different activities
   - Usage logging and analytics
   - Activity categorization
   - Historical activity reporting

3. **Community Features**

   - Kudos system for peer recognition
   - Messaging system (member-to-staff)
   - Monthly member recognition
   - Mentorship program management

4. **Real-time Updates**

   - Instant sign-in/out notifications
   - Live kudos feed
   - Active member list
   - System alerts and notifications

5. **Offline Capabilities**
   - Offline-first architecture
   - Background sync
   - Local data persistence
   - Conflict resolution

## Backend Architecture

### API Routes Structure

```
routes/
├── activities.js    # Activity tracking endpoints
├── airtable.js     # Direct Airtable operations
├── kudos.js        # Kudos management
├── members.js      # Member operations
├── messages.js     # Messaging system
├── notifications.js # System notifications
├── signIn.js       # Sign-in process
├── signOut.js      # Sign-out process
└── system.js       # System-wide operations
```

### Service Layer

```
services/
├── activitiesService.js  # Activity tracking logic
├── airtableClient.js     # Airtable integration
├── kudosService.js       # Kudos management
├── membersService.js     # Member operations
├── messagesService.js    # Messaging system
└── systemService.js      # System operations
```

### Core Services Implementation

#### Member Service

- **Member Search**: Fuzzy search across preferred and last names
- **Active Member Management**:
  - Real-time tracking of signed-in members
  - Member type validation
  - Profile data aggregation
- **Sign In/Out Processing**:
  - Transaction handling for sign-in/out operations
  - Activity logging
  - Usage tracking
- **Data Aggregation**:
  - Comprehensive member data retrieval
  - Related data correlation (kudos, messages, activities)
  - Monthly recognition integration

#### Real-time Event System

```javascript
// Socket.IO integration
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("error", (err) => console.error("Socket error:", err));
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Event broadcasting in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
```

### Error Handling

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});
```

## Frontend Component Structure

### Frontend Components

```
src/
├── components/
│   ├── AlertsView.svelte       # System alerts and notifications
│   ├── CalendarView.svelte     # Calendar and scheduling
│   ├── DashboardContent.svelte # Main dashboard layout
│   ├── DashboardSidebar.svelte # Navigation sidebar
│   ├── KudosView.svelte       # Kudos feed and management
│   ├── MemberDashboard.svelte # Member-specific dashboard
│   ├── MemberListView.svelte  # Active members list
│   ├── MentorsView.svelte     # Mentorship program interface
│   ├── RecognitionView.svelte # Member recognition display
│   ├── SignInScreen.svelte    # Sign-in interface
│   ├── SignOutScreen.svelte   # Sign-out interface
│   └── Sidebar.svelte         # Main navigation
├── stores/
│   ├── appStore.js            # Application state
│   └── socket.js              # WebSocket management
└── lib/
    └── offline.js             # Offline functionality
```

## Data Architecture

### Core Tables (Airtable)

1. **mastersheet**: Primary member records
2. **Member Types**: Membership categories
3. **Signed In**: Active member sessions
4. **Use Log**: Historical usage records
5. **Activity Log**: Detailed activity tracking
6. **Kudos**: Peer recognition system
7. **Messages**: Communication records
8. **Mentors**: Mentorship program data

## Key Workflows

### Sign-In Process

1. Member selects membership type
2. System validates membership status
3. Creates sign-in record
4. Broadcasts real-time update
5. Updates local and remote state

### Sign-Out Process

1. Member selects activities
2. Allocates time across activities
3. System calculates points/hours
4. Updates multiple records (Use Log, Activity Log)
5. Broadcasts completion

### Kudos System

1. Member initiates kudos
2. System validates recipients
3. Creates kudos record
4. Updates point calculations
5. Broadcasts to live feed

## Technical Requirements

### Frontend

- Modern browser with WebSocket support
- Service Worker compatibility
- Local storage availability
- Minimum resolution support: 1024x768

### Backend

- Node.js 16+
- Redis server
- Airtable API access
- Socket.IO support
- SSL/TLS for secure communication

### Network

- WebSocket support
- Reliable internet connection (with offline fallback)
- Low-latency requirements for real-time features

## Security Considerations

1. **Authentication**

   - Member verification
   - Staff access controls
   - Session management

2. **Data Protection**

   - Encrypted communication
   - Secure data storage
   - Privacy compliance

3. **System Security**
   - Rate limiting
   - Input validation
   - Error handling

## Monitoring and Maintenance

1. **System Health**

   - Service uptime monitoring
   - Performance metrics
   - Error tracking
   - Resource utilization

2. **Data Integrity**

   - Backup systems
   - Data validation
   - Conflict resolution
   - Audit trails

3. **User Experience**
   - Usage analytics
   - Performance monitoring
   - Error reporting
   - User feedback collection

## Scaling Considerations

1. **Horizontal Scaling**

   - Multiple kiosk support
   - Load balancing
   - Session management
   - Cache distribution

2. **Data Scaling**
   - Efficient querying
   - Data archiving
   - Cache optimization
   - Background processing

## Future Considerations

1. **Feature Expansion**

   - Advanced analytics
   - Mobile application
   - Integration capabilities
   - Automated reporting

2. **Technical Improvements**
   - Performance optimization
   - Enhanced offline capabilities
   - Advanced caching strategies
   - Improved real-time features

This documentation provides a comprehensive overview of the system architecture, components, and requirements. Regular updates should be made to reflect system changes and improvements.
