# Maestro E2E Testing Guide

## Overview
This guide covers running Maestro E2E tests for the NextUp React Native app using Expo Go on a physical Android device.

## Prerequisites

### WSL/Linux Environment
- ✅ Expo development server running with tunnel mode
- ✅ NextUp app code in `/home/adam/dev/nextup`

### Windows Environment  
- ✅ Java JDK 11+ installed
- ✅ Maestro CLI installed via Git Bash
- ✅ Android SDK platform-tools (for ADB)
- ✅ Test files copied to Windows

### Android Device
- ✅ USB Debugging enabled in Developer Options
- ✅ Expo Go app installed
- ✅ Device connected via USB or wireless ADB

## Setup Steps

### 1. Start Expo Development Server (WSL)
```bash
cd /home/adam/dev/nextup
npx expo start --tunnel --clear
```
Note the tunnel URL (e.g., `exp://qeu7ddc-anonymous-8081.exp.direct`)

### 2. Connect Android Device (Windows Git Bash)
```bash
# Check device connection
adb devices

# Should show: 28251FDH2002FK  device
# If "unauthorized", approve USB debugging prompt on phone
```

### 3. Load App in Expo Go
- Open Expo Go on Android device
- Scan QR code or enter tunnel URL
- Verify app loads and shows navigation tabs

## Running Tests

### Navigate to Test Directory
```bash
cd ~/Documents/nextup-tests
```

### Run E2E Tests

#### Full Launch Test (Recommended)
```bash
# Complete end-to-end test with Expo Go launch
maestro test .maestro/expo_full_launch.yaml
```

#### Quick UI Test (App Already Running)
```bash
# Test currently running app (no launch required)
maestro test .maestro/current_app_test.yaml
```

### Expected Results
- ✅ Launches Expo Go successfully
- ✅ Finds and loads NextUp project from recent projects
- ✅ Detects "Currently Watching", "Search", "Profile" tabs
- ✅ Successfully navigates between all tabs
- ✅ Verifies UI content ("Welcome to NextUp", "Discover Shows")
- ✅ Complete user journey testing works

## Test Files Structure
```
~/Documents/nextup-tests/
└── .maestro/
    ├── current_app_test.yaml     # Basic navigation test (works now)
    ├── app_launch.yaml           # App launch test (needs modification)
    ├── search_flow.yaml          # Search functionality test
    └── currently_watching_flow.yaml  # Show tracking test
```

## Troubleshooting

### Device Not Detected
```bash
adb kill-server
adb start-server
adb devices
```

### App Not Visible to Maestro
- Ensure NextUp app is visible on phone screen (not Expo Go home)
- Try reloading the app in Expo Go
- Verify tunnel connection is active

### Test Failures
- Normal for mockup stage app
- Focus on navigation and UI presence tests
- Functional tests (search, add shows) will fail until implemented

## Current Limitations
- Tests run against Expo Go wrapper, not standalone app
- Some functionality tests fail (expected for development stage)
- Requires manual app loading in Expo Go before testing

## Next Steps
- Modify tests to include Expo Go app launch
- Add more comprehensive UI interaction tests
- Update tests as app functionality is implemented
