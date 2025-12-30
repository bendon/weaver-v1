# TravelWeaver Project Completion Plan
**Target: 3-5 Days to Production-Ready MVP**
**Date Created:** 2025-12-30
**GDS:** Amadeus (primary)
**Messaging:** Store only (no delivery for now)

---

## 🎯 Success Criteria

By the end of this sprint, the platform must:
- ✅ Support complete end-to-end booking flow (flights, hotels, transfers, activities)
- ✅ Have working hotel search via Amadeus Hotels API
- ✅ Store messages in database (delivery integration later)
- ✅ Generate PDF itineraries
- ✅ Support file uploads for documents
- ✅ Allow booking editing and management
- ✅ Have complete settings pages (organization, team, integrations)
- ✅ Basic automation rule creation UI
- ✅ All existing routes functional (no stubs)
- ✅ Production-ready deployment configuration
- ✅ Comprehensive testing

---

## 📋 5-Day Sprint Breakdown

### **DAY 1: Hotel Search & Booking** ⭐ PRIORITY 1

#### Backend Tasks
- [ ] **1.1** Research Amadeus Hotel Search API v3
  - Endpoint: `POST /v3/shopping/hotel-offers`
  - Review request/response format
  - Test with Amadeus API credentials

- [ ] **1.2** Add hotel search endpoint to `app/api/routes/hotels.py`
  - `POST /api/hotels/search` - Search hotels by city/location
  - Input: city code, check-in/out dates, guests, rooms
  - Output: Hotel offers with pricing

- [ ] **1.3** Add hotel offer details endpoint
  - `GET /api/hotels/offers/{offerId}` - Get specific hotel offer
  - Used when user selects a hotel from search results

- [ ] **1.4** Enhance create hotel endpoint to accept Amadeus offer data
  - Modify `POST /api/bookings/{booking_id}/hotels`
  - Accept both manual entry AND Amadeus offer object
  - Store Amadeus hotel ID, offer ID, and raw offer data

#### Frontend Tasks
- [ ] **1.5** Create hotel search page `/app/hotels/search/page.tsx`
  - Search form: destination, dates, guests, rooms
  - Similar to flight search UI
  - City/hotel autocomplete

- [ ] **1.6** Create `HotelSearchResults` component
  - Display hotel cards with images, name, rating, price
  - Filter by price, rating, amenities
  - Sort by price, rating, distance

- [ ] **1.7** Create `HotelCard` component
  - Show hotel details, room type, price
  - "View Details" button
  - "Add to Booking" button

- [ ] **1.8** Create hotel detail modal/page
  - Full hotel details, room options
  - Photos, amenities, policies
  - Add to booking functionality

- [ ] **1.9** Add "Search Hotels" button to booking creation flow
  - In booking wizard, after adding flights
  - Opens hotel search with dates pre-filled
  - Add selected hotel to booking

- [ ] **1.10** Update booking detail page to show hotel info
  - Display hotel cards in itinerary
  - Show check-in/out dates, room type
  - Link to hotel details

#### Testing
- [ ] **1.11** Test hotel search with various destinations
- [ ] **1.12** Test adding hotel to booking from search results
- [ ] **1.13** Test manual hotel entry (existing functionality)
- [ ] **1.14** Verify hotel displays correctly in itinerary

**End of Day 1 Deliverable:** Working hotel search integrated with Amadeus, can search and add hotels to bookings

---

### **DAY 2: Transfers, Activities & Message Storage** ⭐ PRIORITY 2

#### Transfer & Activity Tasks
- [ ] **2.1** Improve transfer creation form
  - Add transfer type selector (airport, hotel, station)
  - Vehicle type dropdown (sedan, SUV, van, bus)
  - Supplier/vendor field
  - Better date/time picker

- [ ] **2.2** Improve activity creation form
  - Activity type selector (tour, excursion, dining, event)
  - Duration picker (hours/minutes)
  - Location autocomplete
  - Description/notes field

- [ ] **2.3** Create "Add Transfer" modal in booking detail
  - Quick add from booking page
  - Pre-fill booking dates
  - Immediately appears in itinerary

- [ ] **2.4** Create "Add Activity" modal in booking detail
  - Quick add from booking page
  - Pre-fill booking dates
  - Immediately appears in itinerary

- [ ] **2.5** Add transfer/activity cards to itinerary timeline
  - Visual indicators (car icon, activity icon)
  - Time, location, supplier info
  - Edit/delete buttons

#### Message Storage Tasks
- [ ] **2.6** Verify messages table schema is complete
  - Check database.py for message CRUD functions
  - Ensure fields: id, booking_id, traveler_id, type (email/sms/whatsapp), content, status, created_at

- [ ] **2.7** Enhance `POST /api/messages` endpoint
  - Create message (store only, no delivery)
  - Support email, SMS, WhatsApp types
  - Associate with booking and/or traveler
  - Status: "stored" (delivery will be "sent", "delivered", "read" later)

- [ ] **2.8** Create message composer UI at `/bookings/[id]/send`
  - Select message type (email, SMS, WhatsApp)
  - Select travelers (multi-select)
  - Message template selector
  - Preview message
  - "Save Message" button (not "Send" for now)

- [ ] **2.9** Update messages list page `/messages`
  - Show all stored messages
  - Filter by type, booking, traveler, status
  - Search messages
  - Message detail view

- [ ] **2.10** Add message thread view `/messages/[travelerId]`
  - Show conversation history with traveler
  - Create new message
  - Group by booking

- [ ] **2.11** Create simple message templates
  - Booking confirmation template
  - Itinerary update template
  - Payment reminder template
  - Custom template

#### Testing
- [ ] **2.12** Test adding transfers to bookings
- [ ] **2.13** Test adding activities to bookings
- [ ] **2.14** Test creating and storing messages
- [ ] **2.15** Test message filtering and search
- [ ] **2.16** Verify messages appear in booking detail "Messages" tab

**End of Day 2 Deliverable:** Can add transfers/activities to bookings, messages stored in database with UI to compose and view

---

### **DAY 3: Booking Management & Editing** ⭐ PRIORITY 3

#### Booking Edit Page
- [ ] **3.1** Complete `/bookings/[id]/edit` page
  - Load existing booking data
  - Edit trip title, start/end dates, status
  - Can't change core booking items (use add/remove instead)
  - Save changes with optimistic updates

- [ ] **3.2** Add edit buttons to itinerary items
  - Edit flight details (confirmation number, notes)
  - Edit hotel details (room type, confirmation, notes)
  - Edit transfer details (driver, vehicle, time)
  - Edit activity details (time, location, notes)

- [ ] **3.3** Add delete functionality to itinerary items
  - Delete flight from booking
  - Delete hotel from booking
  - Delete transfer from booking
  - Delete activity from booking
  - Confirmation dialog before delete

- [ ] **3.4** Implement booking status management
  - Status dropdown: draft, confirmed, in_progress, completed, cancelled
  - Status badge with colors
  - Status change updates updated_at timestamp

#### Booking Detail Enhancements
- [ ] **3.5** Complete "Overview" tab
  - Trip summary section
  - Traveler list with avatars
  - Quick stats (total cost, duration, destinations)
  - Recent activity/changes log

- [ ] **3.6** Complete "Documents" tab
  - List uploaded documents
  - Upload new document button
  - Document categories (passport, visa, ticket, invoice, other)
  - Download/view document
  - Delete document

- [ ] **3.7** Complete "Messages" tab
  - Show messages related to this booking
  - Quick compose message
  - Message timeline
  - Filter by type/traveler

- [ ] **3.8** Add booking actions dropdown
  - Edit booking
  - Duplicate booking (create template)
  - Send to travelers
  - Generate PDF
  - Export data
  - Cancel booking
  - Delete booking

#### Booking List Enhancements
- [ ] **3.9** Add bulk actions to booking list
  - Select multiple bookings (checkboxes)
  - Bulk status update
  - Bulk export
  - Bulk delete (with confirmation)

- [ ] **3.10** Improve booking filters
  - Filter by status (multi-select)
  - Filter by date range (start date, end date)
  - Filter by traveler
  - Filter by destination
  - Clear all filters button

- [ ] **3.11** Add booking export functionality
  - Export selected bookings as CSV
  - Include all booking details
  - Include travelers, flights, hotels, etc.

#### Testing
- [ ] **3.12** Test editing booking details
- [ ] **3.13** Test editing itinerary items (flights, hotels, etc.)
- [ ] **3.14** Test deleting itinerary items
- [ ] **3.15** Test booking status changes
- [ ] **3.16** Test bulk operations
- [ ] **3.17** Test filtering and export

**End of Day 3 Deliverable:** Complete booking management - edit, delete, status changes, bulk operations, all tabs functional

---

### **DAY 4: Documents, Settings & Automation UI** ⭐ PRIORITY 4

#### File Upload & Document Management
- [ ] **4.1** Create file upload backend
  - `POST /api/files/upload` - Upload file
  - Store files in `/uploads` directory (or S3 if configured)
  - Save metadata in files table (id, booking_id, traveler_id, filename, file_type, file_size, storage_path)
  - Return file URL and metadata

- [ ] **4.2** Create file management endpoints
  - `GET /api/files/{id}` - Get file metadata
  - `GET /api/files/{id}/download` - Download file
  - `DELETE /api/files/{id}` - Delete file
  - `GET /api/bookings/{booking_id}/files` - List booking files
  - `GET /api/travelers/{traveler_id}/files` - List traveler files

- [ ] **4.3** Create file upload component
  - Drag & drop file upload
  - File type validation (PDF, JPG, PNG, DOC, etc.)
  - File size limit (10MB)
  - Upload progress indicator
  - Multiple file upload

- [ ] **4.4** Integrate file upload in booking documents tab
  - Upload documents to booking
  - Categorize documents
  - View/download uploaded files

- [ ] **4.5** Integrate file upload in traveler profile
  - Upload passport, visa, etc.
  - Associate with traveler
  - View in traveler detail page

#### PDF Generation
- [ ] **4.6** Install PDF generation library
  - `pip install reportlab` or `pip install weasyprint`
  - Test PDF generation

- [ ] **4.7** Create PDF itinerary template
  - Professional layout with branding
  - Booking details, traveler info
  - Day-by-day itinerary
  - Flight details with times, airports
  - Hotel details with addresses
  - Transfers and activities
  - Contact information

- [ ] **4.8** Create PDF generation endpoint
  - `GET /api/bookings/{id}/pdf` - Generate and return PDF
  - Cached for performance
  - Include booking reference number

- [ ] **4.9** Add "Download PDF" button to booking detail
  - In booking actions dropdown
  - Opens PDF in new tab or downloads
  - Shows loading state during generation

#### Settings Pages
- [ ] **4.10** Complete `/settings/organization` page
  - Organization name, logo
  - Contact information
  - Business details (address, phone, email)
  - Currency preference
  - Timezone
  - Save changes API call

- [ ] **4.11** Complete `/settings/team` page
  - List all team members
  - Show name, email, role, last active
  - Remove member button (with confirmation)
  - Role display (prepare for future RBAC)

- [ ] **4.12** Complete `/settings/team/invite` page
  - Invite form (email, role)
  - Send invite (store in invites table for now)
  - List pending invites
  - Cancel invite
  - Note: Actual email sending comes later

- [ ] **4.13** Complete `/settings/integrations` page
  - Show Amadeus integration status (connected/disconnected)
  - Test connection button
  - API credentials form (masked)
  - Future: Add more integrations (Twilio, SendGrid)

- [ ] **4.14** Complete `/settings/billing` page
  - Current plan display (free tier for now)
  - Usage statistics (bookings count, travelers count)
  - Upgrade plan button (placeholder for now)
  - Billing history (placeholder)

#### Automation UI
- [ ] **4.15** Create automation rule creation page
  - Rule name and description
  - Trigger selector (booking confirmed, booking cancelled, flight departure in 24h, etc.)
  - Action selector (create message, update status, send notification)
  - Message template selector
  - Enabled/disabled toggle
  - Save rule

- [ ] **4.16** Create rule creation API
  - `POST /api/automation/rules` - Create rule
  - Store rule configuration as JSON
  - Validation

- [ ] **4.17** Create rule deletion API
  - `DELETE /api/automation/rules/{id}` - Delete rule
  - Confirmation required

- [ ] **4.18** Update automation list page
  - Add "Create Rule" button
  - Better rule cards with description
  - Edit button (opens creation form with data)
  - Delete button
  - Enable/disable toggle

- [ ] **4.19** Create automation templates
  - Pre-defined rule templates
  - E.g., "Send booking confirmation", "Send departure reminder"
  - One-click to create from template

#### Testing
- [ ] **4.20** Test file upload and download
- [ ] **4.21** Test PDF generation
- [ ] **4.22** Test all settings pages (save/load)
- [ ] **4.23** Test automation rule creation, editing, deletion

**End of Day 4 Deliverable:** File uploads working, PDF itineraries generated, settings pages complete, automation rules can be created/managed (execution later)

---

### **DAY 5: Testing, Polish & Deployment** ⭐ PRIORITY 5

#### Route Completion (Fill Remaining Stubs)
- [ ] **5.1** Review `/ai-assistant` page
  - Should redirect to `/chat` or be same as chat
  - Ensure consistent experience

- [ ] **5.2** Review `/pnr/import` page
  - Ensure basic PNR import works or show "Coming Soon"
  - If not working, create stub with clear message

- [ ] **5.3** Review `/flights/[flightId]` page
  - Show individual flight details
  - Flight status, aircraft, route
  - Link back to booking if applicable

- [ ] **5.4** Review `/automation/[ruleId]` page
  - Show rule details
  - Execution history (empty for now)
  - Edit rule button

- [ ] **5.5** Review `/automation/templates` page
  - List automation templates
  - Preview template
  - Create rule from template button

- [ ] **5.6** Clarify DMC and Traveler public routes
  - `/dmc/[itineraryId]` - Decision: Keep or remove?
  - `/traveler`, `/traveler/[itineraryId]`, `/traveler/code/[bookingCode]`
  - Ensure they work or redirect appropriately

#### Component Library Cleanup
- [ ] **5.7** Extract reusable Modal component
  - Used in hotel detail, add transfer, add activity, confirmations
  - Props: isOpen, onClose, title, children

- [ ] **5.8** Extract reusable ConfirmDialog component
  - Used for deletions, cancellations
  - Props: isOpen, onClose, onConfirm, title, message

- [ ] **5.9** Extract reusable EmptyState component
  - Used when no bookings, travelers, messages, etc.
  - Props: icon, title, description, action button

- [ ] **5.10** Create reusable DataTable component (if time permits)
  - Sorting, filtering, pagination
  - Used in bookings, travelers, messages
  - Or just ensure consistency across existing tables

#### E2E Testing
- [ ] **5.11** Write E2E test: Complete booking creation flow
  - Login → Create booking → Add traveler → Search flight → Add flight
  - Search hotel → Add hotel → Add transfer → Add activity → View itinerary

- [ ] **5.12** Write E2E test: Booking management
  - Edit booking details
  - Edit itinerary items
  - Delete itinerary items
  - Change booking status

- [ ] **5.13** Write E2E test: Message creation
  - Open booking → Send → Create message → Save → View in messages list

- [ ] **5.14** Write E2E test: Document upload
  - Upload file to booking
  - View in documents tab
  - Download file

- [ ] **5.15** Write E2E test: PDF generation
  - Open booking → Generate PDF → Verify download

- [ ] **5.16** Write E2E test: Settings
  - Update organization settings
  - Invite team member
  - Create automation rule

- [ ] **5.17** Run all E2E tests
  - Fix any failures
  - Ensure 100% pass rate

#### UI Polish
- [ ] **5.18** Review all pages for consistent styling
  - Headers, buttons, cards, forms
  - Ensure design system is applied consistently

- [ ] **5.19** Add loading states where missing
  - Skeleton loaders on all data fetching
  - Button loading states during mutations

- [ ] **5.20** Add error handling where missing
  - Error messages for failed API calls
  - Retry buttons
  - Fallback UI

- [ ] **5.21** Improve mobile responsiveness
  - Test on mobile viewport
  - Fix any layout issues
  - Ensure touch targets are adequate

- [ ] **5.22** Add keyboard shortcuts help modal
  - Press `?` to show shortcuts
  - Document common shortcuts
  - Implement at least search (`Cmd+K`)

#### Database & Performance
- [ ] **5.23** Database cleanup
  - Remove any unused tables
  - Add indexes for common queries (booking_id, organization_id)
  - Vacuum database

- [ ] **5.24** API performance review
  - Add pagination where missing
  - Optimize slow queries
  - Add caching headers

- [ ] **5.25** Frontend performance
  - Lazy load heavy components
  - Optimize images
  - Minimize bundle size

#### Deployment Preparation
- [ ] **5.26** Environment configuration
  - Create `.env.production` template
  - Document all required environment variables
  - Ensure secrets are not in git

- [ ] **5.27** Database migration to PostgreSQL (if deploying to production)
  - Install PostgreSQL
  - Create migration script from SQLite to PostgreSQL
  - Test migration
  - Update database connection string

- [ ] **5.28** Create deployment documentation
  - `DEPLOYMENT.md` with step-by-step instructions
  - Prerequisites (Node.js, Python, PostgreSQL)
  - Installation steps
  - Configuration steps
  - Running the application
  - Troubleshooting

- [ ] **5.29** Create Docker configuration (optional but recommended)
  - `Dockerfile` for backend
  - `Dockerfile` for frontend
  - `docker-compose.yml` for complete stack
  - Test Docker build and run

- [ ] **5.30** Production build test
  - `npm run build` - Ensure frontend builds successfully
  - Fix any build errors
  - Test production build locally

- [ ] **5.31** Security review
  - Ensure API endpoints have authentication
  - Check for SQL injection vulnerabilities
  - Verify CORS configuration
  - Check environment variables are loaded correctly

#### Final Testing & Documentation
- [ ] **5.32** Manual testing checklist
  - Test all critical user flows end-to-end
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile devices
  - Test error scenarios

- [ ] **5.33** Update README.md
  - Clear project description
  - Features list
  - Installation instructions
  - Usage guide
  - API documentation link
  - License

- [ ] **5.34** Create USER_GUIDE.md
  - How to create a booking
  - How to search flights/hotels
  - How to manage travelers
  - How to use AI assistant
  - How to send messages
  - How to configure settings

- [ ] **5.35** Create API_DOCUMENTATION.md (or use Swagger)
  - List all API endpoints
  - Request/response formats
  - Authentication
  - Error codes

- [ ] **5.36** Final git cleanup
  - Remove any debug code
  - Remove console.logs
  - Ensure .gitignore is correct
  - Commit all changes

**End of Day 5 Deliverable:** Fully tested, polished, documented, deployment-ready application

---

## 📊 Progress Tracking

### Daily Checkpoints

**End of Day 1:**
- [ ] Hotel search working with Amadeus
- [ ] Can add hotels to bookings from search results
- [ ] Hotels display in itinerary

**End of Day 2:**
- [ ] Can add transfers and activities to bookings
- [ ] Messages stored in database
- [ ] Message composition UI complete

**End of Day 3:**
- [ ] Can edit bookings and itinerary items
- [ ] Can delete itinerary items
- [ ] All booking detail tabs functional
- [ ] Bulk operations working

**End of Day 4:**
- [ ] File upload working
- [ ] PDF itineraries generated
- [ ] Settings pages complete
- [ ] Automation rules can be created

**End of Day 5:**
- [ ] All routes functional (no stubs)
- [ ] E2E tests passing
- [ ] Application polished
- [ ] Deployment documentation complete
- [ ] Ready to deploy

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrated to PostgreSQL
- [ ] Frontend built successfully (`npm run build`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Amadeus API credentials verified
- [ ] CORS configured for production domain
- [ ] HTTPS/SSL configured
- [ ] Domain DNS configured
- [ ] Monitoring/logging configured (optional but recommended)
- [ ] Backup strategy in place
- [ ] All tests passing
- [ ] Documentation complete

---

## 📝 Notes & Decisions

### Deprioritized (Later Integration)
- ✋ WhatsApp/SMS/Email actual delivery (Twilio, SendGrid)
- ✋ Automation rule execution engine
- ✋ Real-time flight status monitoring
- ✋ Payment processing
- ✋ Billing/subscription system
- ✋ Advanced analytics/reporting
- ✋ Additional GDS integrations (Sabre, Travelport)

### Quick Wins Already Done
- ✅ Toast notifications
- ✅ Loading states (skeletons)
- ✅ Form validation
- ✅ Error boundaries
- ✅ AI Assistant fully functional
- ✅ Flight search with Amadeus
- ✅ Airport autocomplete
- ✅ Public itineraries
- ✅ Breadcrumb navigation

### Design Decisions
- Use local file storage (can migrate to S3 later)
- Use SQLite for development, PostgreSQL for production
- Focus on Amadeus for all search (flights, hotels)
- Transfers and activities are manual entry (no search API)
- Messages stored but not delivered (delivery layer added later)
- Basic automation UI (execution engine added later)

---

## 🎯 Success Metrics

By end of sprint:
- [ ] 0 stub/placeholder pages (all functional or removed)
- [ ] 100% E2E test coverage for critical flows
- [ ] < 3 second page load time
- [ ] 0 console errors in production
- [ ] Complete user documentation
- [ ] Successful deployment to production

---

**Let's build this! 🚀**
