# TravelWeaver Frontend Implementation Plan

## Current Status

### Existing Routes (9 routes)
- `/` - Landing page (needs to become dashboard when authenticated)
- `/login` - Login page ✓
- `/traveler` - Traveler workspace ✓
- `/traveler/[itineraryId]` - Traveler itinerary detail ✓
- `/traveler/code/[bookingCode]` - Booking code lookup ✓
- `/dmc` - DMC control panel ✓
- `/dmc/[itineraryId]` - DMC itinerary detail ✓
- `/flights/search` - Flight search ✓
- `/pnr/import` - PNR import ✓
- `/ai-assistant` - AI booking assistant ✓

### Required Routes (35 total)
- `/register` - Organization registration
- `/` - Dashboard (when authenticated)
- `/bookings` - Bookings list
- `/bookings/new` - Redirect to chat
- `/bookings/[id]` - Booking detail
- `/bookings/[id]/edit` - Edit booking
- `/bookings/[id]/itinerary` - Full itinerary editor
- `/bookings/[id]/send` - Send to traveler flow
- `/travelers` - Travelers directory
- `/travelers/new` - Add traveler
- `/travelers/[id]` - Traveler profile
- `/travelers/[id]/edit` - Edit traveler
- `/chat` - New AI conversation
- `/chat/[conversationId]` - Continue conversation
- `/messages` - WhatsApp inbox
- `/messages/[travelerId]` - Conversation thread
- `/flights` - Flight monitor dashboard
- `/flights/[flightId]` - Flight detail
- `/automation` - Automation rules
- `/automation/[ruleId]` - Edit rule
- `/automation/templates` - Message templates
- `/settings` - Settings overview
- `/settings/organization` - Organization settings
- `/settings/team` - Team management
- `/settings/team/invite` - Invite member
- `/settings/integrations` - Integrations
- `/settings/billing` - Billing
- `/itinerary/[code]` - Public itinerary (no auth)

## Implementation Priority

### Phase 1: Foundation (Current)
1. ✅ Shared layout components (Sidebar, Header)
2. ✅ Register page
3. ✅ Dashboard route

### Phase 2: Core Features
4. Bookings routes (list, detail, edit, send)
5. Travelers routes (list, new, detail, edit)
6. Chat routes (new, continue)

### Phase 3: Communication
7. Messages routes (inbox, thread)
8. Flights routes (monitor, detail)

### Phase 4: Configuration
9. Automation routes
10. Settings routes

### Phase 5: Public
11. Public itinerary route

## Shared Components Needed

### Layout Components
- [x] Sidebar navigation
- [x] Header with breadcrumbs
- [x] User menu dropdown

### UI Components
- [ ] StatusBadge
- [ ] AvatarInitials
- [ ] EmptyState
- [ ] DataTable
- [ ] DateRangePicker
- [ ] SearchInput
- [ ] ConfirmModal

## API Integration Status

Most API endpoints are already defined in `src/services/api.ts`. Need to verify:
- Dashboard summary endpoints
- Activity feed endpoints
- Alert endpoints
- Flight monitoring endpoints
- Automation endpoints
- Settings endpoints

