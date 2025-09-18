# Manual Sync Testing Guide

This guide provides step-by-step instructions for manually testing the background sync functionality in the NextUp media tracker app.

## Prerequisites

1. **Start the app**: Run `yarn start` and open the app in your device/simulator
2. **Add some shows**: Make sure you have at least 2-3 shows in your library with different statuses (watching, want to watch, completed)
3. **Open Developer Tools**: Enable console logging to see sync operations

## Test Cases

### 1. Basic Sync Service Setup

**Test**: Verify sync service initializes properly

**Steps**:
1. Open the app
2. Check console for initialization messages
3. Import and test sync service in a component or use React DevTools

**Expected Behavior**:
- Console shows "SyncService initialized" message
- Sync service loads any previous sync status from storage
- Next sync is automatically scheduled

**Code to test** (add to any screen temporarily):
```typescript
import { syncService } from '../services/syncService';

// In component
useEffect(() => {
  console.log('Current sync status:', syncService.getStatus());
  console.log('Should sync now?', syncService.shouldSync());
  console.log('Status text:', syncService.getStatusText());
}, []);
```

### 2. Manual Sync

**Test**: Trigger manual sync and observe behavior

**Steps**:
1. Add this button to any screen:
```typescript
<Button 
  title="Manual Sync" 
  onPress={async () => {
    console.log('Starting manual sync...');
    await syncService.syncNow();
    console.log('Manual sync completed');
  }} 
/>
```
2. Press the button
3. Watch console output

**Expected Behavior**:
- Console shows "Starting background sync..." 
- Shows "Syncing X shows..."
- Individual show sync messages: "Synced show [ID]"
- "Background sync completed successfully"
- Status updates with new lastSync timestamp

### 3. Force Sync

**Test**: Force sync even when recent sync occurred

**Steps**:
1. Perform a manual sync (test case 2)
2. Immediately try another manual sync
3. Try force sync:
```typescript
<Button 
  title="Force Sync" 
  onPress={async () => {
    await syncService.syncNow({ force: true });
  }} 
/>
```

**Expected Behavior**:
- Regular manual sync: Should skip with "Sync already running" or skip if recent
- Force sync: Should always execute regardless of recent sync

### 4. Selective Show Sync

**Test**: Sync only specific shows

**Steps**:
1. Get your show IDs from the store
2. Add this test button:
```typescript
import { useShowsStore } from '../store/showsStore';

// In component
const { watchingShows } = useShowsStore();
const firstShowId = watchingShows[0]?.tmdbId?.toString();

<Button 
  title="Sync One Show" 
  onPress={async () => {
    if (firstShowId) {
      await syncService.syncNow({ shows: [firstShowId] });
    }
  }} 
/>
```

**Expected Behavior**:
- Only syncs the specified show
- Console shows "Syncing 1 shows..." instead of all shows

### 5. Episode Sync

**Test**: Sync show episodes

**Steps**:
1. Add episode sync button:
```typescript
<Button 
  title="Sync with Episodes" 
  onPress={async () => {
    await syncService.syncNow({ includeEpisodes: true });
  }} 
/>
```

**Expected Behavior**:
- Console shows episode sync messages: "Synced episodes for show [ID]: { totalEpisodes: X, seasonCount: Y }"
- Takes longer than regular sync due to episode data

### 6. Status Monitoring

**Test**: Monitor sync status in real-time

**Steps**:
1. Add status display component:
```typescript
import { useState, useEffect } from 'react';

const SyncStatusDisplay = () => {
  const [status, setStatus] = useState(syncService.getStatus());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(syncService.getStatus());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
      <Text>Last Sync: {status.lastSync || 'Never'}</Text>
      <Text>Is Running: {status.isRunning ? 'Yes' : 'No'}</Text>
      <Text>Next Sync: {status.nextSync || 'Not scheduled'}</Text>
      <Text>Error Count: {status.errorCount}</Text>
      <Text>Last Error: {status.lastError || 'None'}</Text>
      <Text>Status: {syncService.getStatusText()}</Text>
      <Text>Should Sync: {syncService.shouldSync() ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

**Expected Behavior**:
- Status updates in real-time during sync operations
- `isRunning` shows true during sync, false when idle
- `lastSync` updates after successful sync
- `nextSync` shows when next automatic sync is scheduled

### 7. Error Handling

**Test**: Verify error handling and retry logic

**Steps**:
1. Temporarily break the TMDB service (turn off internet or modify API key)
2. Trigger manual sync
3. Restore connection and try again

**Expected Behavior**:
- Console shows error messages
- Error count increments in status
- `lastError` contains error message
- Retry logic attempts multiple times before giving up

### 8. Automatic Scheduling

**Test**: Verify automatic sync scheduling

**Steps**:
1. Check initial status for `nextSync` timestamp
2. Wait and monitor (or temporarily reduce sync interval for testing)
3. Verify sync triggers automatically

**Expected Behavior**:
- `nextSync` is set to 24 hours from last sync
- Automatic sync triggers at scheduled time
- New sync gets scheduled after completion

## Testing with Modified Sync Interval

For faster testing, you can temporarily modify the sync interval:

1. In `syncService.ts`, change:
```typescript
private readonly SYNC_INTERVAL_HOURS = 24; // Change to 0.1 for 6-minute testing
```

2. Restart the app and observe automatic syncs happening every 6 minutes

## Integration Testing

### Test with Real TMDB Data
1. Ensure valid TMDB API key is configured
2. Add real shows to your library
3. Verify sync updates show information correctly
4. Check that episode data syncs properly

### Test Offline/Online Scenarios
1. Start sync with internet connection
2. Disconnect internet during sync
3. Reconnect and verify retry logic
4. Test sync when app comes back online

## Console Commands for Advanced Testing

Add these to your app for testing:

```typescript
// Global sync service access for console testing
global.syncService = syncService;

// Console helpers
global.testSync = {
  status: () => console.log(syncService.getStatus()),
  sync: () => syncService.syncNow(),
  forceSync: () => syncService.syncNow({ force: true }),
  episodeSync: () => syncService.syncNow({ includeEpisodes: true }),
  start: () => syncService.start(),
  stop: () => syncService.stop(),
  shouldSync: () => console.log(syncService.shouldSync()),
  statusText: () => console.log(syncService.getStatusText())
};
```

Then use in browser console:
```javascript
// Check status
testSync.status()

// Force sync
testSync.forceSync()

// Check if should sync
testSync.shouldSync()
```

## Expected Logs During Normal Operation

```
SyncService initialized { lastSync: null, isRunning: false, ... }
Starting background sync... {}
Syncing 3 shows...
Synced show 123
Synced show 456  
Synced show 789
Next sync scheduled for: 2025-08-23T04:37:36.791Z
Background sync completed successfully
```

## Troubleshooting

**No sync logs**: Check if syncService is properly imported and initialized
**Sync errors**: Verify TMDB API key and internet connection
**Status not updating**: Ensure status is being checked after async operations complete
**Automatic sync not working**: Check if app stays active/in foreground (background execution varies by platform)
