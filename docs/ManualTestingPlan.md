# 📋 Comprehensive Manual Testing Plan for NextUp - TV Show Tracker

## 🚀 Pre-Testing Setup

1. **Start the development server**: `yarn start`
2. **Launch on your preferred platform**:
   - iOS Simulator: `yarn ios`
   - Android Emulator: `yarn android`  
   - Web: `yarn web`
3. **Clear any existing data** (if needed) by resetting the simulator/emulator

---

## 🔐 Phase 1: Authentication Flow Testing

### Test 1.1: Initial App Launch
- [ ] App launches without crashes
- [ ] Shows AuthScreen with Sign Up form by default
- [ ] **Sign Up form contains**:
  - [ ] "Create Account" title
  - [ ] Username input field
  - [ ] Email input field (optional)
  - [ ] "Create Account" button (initially disabled)
  - [ ] "Already have an account? Sign In" link

### Test 1.2: Sign Up Flow
- [ ] **Username validation**:
  - [ ] Button remains disabled with empty username
  - [ ] Button remains disabled with spaces only
  - [ ] Button enables with valid username (3+ characters)
  - [ ] Error appears with invalid characters (test: `user@name!`)
- [ ] **Email validation**:
  - [ ] Valid email accepted: `test@example.com`
  - [ ] Invalid email shows error: `invalid-email`
- [ ] **Successful sign up**:
  - [ ] Enter username: `testuser`
  - [ ] Enter email: `test@example.com` (optional)
  - [ ] Tap "Create Account"
  - [ ] Loading state shows briefly
  - [ ] App navigates to main tabs automatically

### Test 1.3: Sign In Flow
- [ ] **Switch to Sign In**:
  - [ ] Tap "Already have an account? Sign In"
- [ ] Form switches to Sign In view
- [ ] Shows "Welcome Back" title
- [ ] Only username field visible (no email)
- [ ] **Sign in with existing user**:
  - [ ] Enter username: `testuser`
  - [ ] Tap "Sign In" button
  - [ ] Successfully logs in to main app
- [ ] **Sign in with non-existent user**:
  - [ ] Enter username: `nonexistent`
  - [ ] Tap "Sign In"
  - [ ] Shows error: "User not found"
- [ ] **Error clearing**:
  - [ ] Start typing after error appears
  - [ ] Error message clears automatically

### Test 1.4: Form Switching
- [ ] Switch back and forth between Sign Up and Sign In
- [ ] Form fields reset when switching
- [ ] No crashes or UI glitches during switches

---

## 📱 Phase 2: Main Navigation Testing

### Test 2.1: Bottom Tab Navigation
- [ ] **Tab bar visible** with three tabs:
  - [ ] "Watching" (television icon)
  - [ ] "Search" (magnify icon)
  - [ ] "Profile" (account icon)
- [ ] **Tab switching**:
  - [ ] Tap each tab successfully
  - [ ] Active tab highlights correctly
  - [ ] Screen content changes appropriately

### Test 2.2: Currently Watching Screen (Empty State)
- [ ] Shows "Currently Watching" title
- [ ] Shows "No shows yet" message
- [ ] Shows description about using Search tab
- [ ] **Status chips display with counts**:
  - [ ] "Watching (0)"
  - [ ] "Want to Watch (0)"
  - [ ] "Completed (0)"
  - [ ] "Paused (0)"

---

## 🔍 Phase 3: Search & Discovery Testing

### Test 3.1: Search Interface
- [ ] **Initial state**:
  - [ ] Search input field visible at top
  - [ ] "Discover" section title
  - [ ] "Popular Shows" section
  - [ ] Trending content loads automatically
- [ ] **Search input behavior**:
  - [ ] Can type in search field
  - [ ] Search is debounced (doesn't search every keystroke)
  - [ ] Loading indicator shows during search

### Test 3.2: Search Functionality
- [ ] **Popular search terms**:
  - [ ] Search: `Breaking Bad`
  - [ ] Results appear with poster images
  - [ ] Show titles and years display correctly
- [ ] **Various search terms**:
  - [ ] Search: `Game of Thrones`
  - [ ] Search: `The Office`
  - [ ] Search: `Stranger Things`
- [ ] **No results**:
  - [ ] Search: `xyznonexistentshow`
  - [ ] Shows appropriate "no results" message

### Test 3.3: Search Results Interaction
- [ ] **Show card display**:
  - [ ] Poster images load correctly
  - [ ] Title, year, and rating display
  - [ ] Overview text visible
- [ ] **Add to tracking**:
  - [ ] Tap "Add to Tracking" button on a show
  - [ ] Success alert appears: "Show has been added to your tracking list!"
  - [ ] Button changes state or shows feedback

---

## 📺 Phase 4: Show Details Testing

### Test 4.1: Navigation to Show Details
- [ ] **From search results**:
  - [ ] Tap on a show card (not the add button)
  - [ ] Navigate to ShowDetailsScreen
  - [ ] Header shows "Show Details"
  - [ ] Back button works

### Test 4.2: Show Details Content
- [ ] **Loading state**:
  - [ ] Shows "Loading show details..." initially
- [ ] **Show information displays**:
  - [ ] Show title (e.g., "Breaking Bad")
  - [ ] Year and rating (e.g., "2008 • ⭐ 9.3")
  - [ ] Backdrop image (if available)
  - [ ] Poster image
  - [ ] Overview section with description
- [ ] **Tracking section**:
  - [ ] "Tracking" section visible
  - [ ] Shows appropriate buttons based on auth/tracking status

### Test 4.3: Show Details Authentication States
- [ ] **Unauthenticated user**:
  - [ ] Tracking section visible but no "Add to Tracking" button
- [ ] **Authenticated user (not tracking)**:
  - [ ] "Add to Tracking" button visible
  - [ ] Button functions correctly
- [ ] **Error handling**:
  - [ ] Navigate to invalid show ID
  - [ ] Shows "Show not found" message
  - [ ] Error alert displays

---

## 📊 Phase 5: Show Tracking & Management

### Test 5.1: Adding Shows to Tracking
- [ ] **Add first show**:
  - [ ] Search for "Breaking Bad"
  - [ ] Tap "Add to Tracking"
  - [ ] Success alert appears
  - [ ] Navigate to "Watching" tab
  - [ ] Show appears in "Want to Watch" section

### Test 5.2: Currently Watching Screen (With Shows)
- [ ] **Want to Watch section**:
- [ ] Shows "Want to Watch (1)"
- [ ] Lists the added show
- [ ] Shows "Added [date]" under show title
- [ ] "Start Watching" button present
- [ ] Start watching a show:
- [ ] Tap "Start Watching" button
- [ ] Show moves to "Currently Watching" section
- [ ] Shows "S1E1" progress indicator
- [ ] Status chips update counts
### Test 5.3: Multiple Shows Management
- [ ] Add multiple shows:
- [ ] Add 3-4 different shows via search
- [ ] All appear in "Want to Watch" section
- [ ] Counts update correctly in status chips
- [ ] Different status tracking:
- [ ] Start watching 2 shows
- [ ] Mark 1 show as completed (if functionality exists)
- [ ] Verify shows appear in correct sections
- [ ] Status chip counts are accurate
---

## 👤 Phase 6: Profile & User Management

### Test 6.1: Profile Screen (Authenticated)
- [ ] **User information**:
- [ ] Shows "Profile" title
- [ ] Displays user's email
- [ ] Shows username or "Anonymous" if not provided
- [ ] Avatar shows first letter of username/email
- [ ] Stats section:
- [ ] "Your Stats" heading visible
- [ ] "Shows Watching" count
- [ ] "Episodes Watched" count
- [ ] "Shows Completed" count
- [ ] Sign Out functionality:
- [ ] "Sign Out" button visible
- [ ] Tap to sign out
- [ ] Returns to AuthScreen
### Test 6.2: Profile Screen (Unauthenticated)
- [ ] After signing out, check profile shows:
- [ ] "Welcome to NextUp" message
- [ ] "Sign in to start tracking" description
- [ ] "Sign In" button
- [ ] "Sign Up" button
- [ ] Stats section still visible but with zero values
---

## 🔄 Phase 7: Phase 7: Data Persistence & State Management
### Test 7.1: App Restart Persistence
- [ ] With shows tracked:
- [ ] Add several shows to tracking
- [ ] Start watching some shows
- [ ] Close and restart the app
- [ ] Verify all data persists correctly
- [ ] User remains logged in
- [ ] Sign out and restart:
- [ ] Sign out
- [ ] Restart app
- [ ] Verify shows AuthScreen (not logged in)
### Test 7.2: Data Consistency
- [ ] Cross-tab consistency:
- [ ] Add show via Search tab
- [ ] Navigate to Watching tab
- [ ] Verify show appears immediately
- [ ] Navigate to Profile tab
- [ ] Check stats have updated
---

## 🐛 Phase 8: Phase 8: Error Handling & Edge Cases
### Test 8.1: Network Issues
- [ ] Offline search:
- [ ] Disable network connection
- [ ] Try searching for shows
- [ ] Verify graceful error handling
- [ ] Poor connection:
- [ ] Enable slow network simulation
- [ ] Test search and image loading
- [ ] Verify loading states work properly
### Test 8.2: Invalid Inputs
- [ ] Search edge cases:
- [ ] Empty search
- [ ] Very long search terms
- [ ] Special characters in search
- [ ] Numbers only search
- [ ] Form validation edge cases:
- [ ] Very long usernames
- [ ] Usernames with numbers
- [ ] Usernames with underscores
### Test 8.3: Performance & UI
- [ ] Large datasets:
- [ ] Add 10+ shows to tracking
- [ ] Verify scrolling performance
- [ ] Check memory usage
- [ ] Image loading:
- [ ] Verify images load properly
- [ ] Check placeholder/loading states
- [ ] Test with missing images
---

## 📱 Phase 9: Phase 9: Platform-Specific Testing
### Test 9.1: iOS-Specific (if testing on iOS)
- [ ] Navigation gestures work (swipe back)
- [ ] Status bar styling
- [ ] Safe area handling
- [ ] Keyboard behavior
- [ ] App state transitions (background/foreground)
### Test 9.2: Android-Specific (if testing on Android)
- [ ] Hardware back button behavior
- [ ] Keyboard handling
- [ ] App lifecycle (minimize/restore)
- [ ] Material Design styling consistency
### Test 9.3: Web-Specific (if testing on web)
- [ ] Browser navigation (back/forward buttons)
- [ ] Responsive design
- [ ] Touch/mouse interactions
- [ ] URL handling
---

## ✅ Phase 10: Phase 10: Final Validation
### Test 10.1: Complete User Journey
- [ ] New user flow:
Sign up with new account
Search for favorite show
Add to tracking
Start watching
Navigate between tabs
View profile stats
Add more shows
Sign out and back in
- [ ] Data integrity throughout journey
### Test 10.2: Performance Validation
- [ ] App starts quickly (< 3 seconds)
- [ ] Search results appear promptly
- [ ] Navigation between tabs is smooth
- [ ] No memory leaks during extended use
- [ ] Images load efficiently
🎯 Success Criteria
The app is ready for production when:

- [ ] All authentication flows work without crashes
- [ ] Search returns accurate results consistently
- [ ] Shows can be added and managed successfully
- [ ] Data persists across app restarts
- [ ] User interface is responsive and intuitive
- [ ] Error states are handled gracefully
- [ ] Performance is acceptable on target devices
🚨 Critical Bugs to Watch For
App crashes during any core operation
Data loss after app restart
Authentication failures
Search returning no results when it should
Images failing to load consistently
Navigation getting stuck or broken
Forms accepting invalid input
State inconsistencies between screens