# PRBook — Gym Journal

A mobile fitness tracking app for logging workouts, tracking personal records (PRs), and visualizing training history with charts and metrics. Available on iOS as **OpenHand: Gym Journal**.

---

## Features

- Log workouts by date with exercises, sets, reps, weight, and rest time
- Automatic PR tracking across multiple metrics (max weight, max volume, best rest time, total tonnage, and more)
- Interactive charts and history analytics per exercise
- CSV export and import for workout data
- Dark and light theme support
- Fully offline — data stored locally via SQLite

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (included with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — no global install required; invoked via `npx`
- For iOS: macOS with Xcode 15+ and an Apple Developer account (or Expo Go)
- For Android: Android Studio with an emulator, or a physical device with Expo Go

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/PRBook.git
   cd PRBook
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

---

## Usage

### Start the development server

```bash
npm start
```

Open the Expo Go app on your device and scan the QR code, or press `i` / `a` in the terminal to launch on a simulator/emulator.

### Run on a specific platform

```bash
# iOS simulator (macOS only)
npm run ios

# Android emulator / device
npm run android

# Web browser
npm run web
```

### Build for production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for production builds.

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production
```

---

## Project Structure

```
PRBook/
├── assets/          # App icons and splash screens
├── docs/            # Privacy policy and web docs
├── ios/             # iOS native build files
├── src/
│   ├── components/  # Reusable UI components
│   ├── context/     # React Context providers (workout, theme)
│   ├── db/          # SQLite database layer and schema
│   ├── screens/     # Workout and History screens
│   ├── theme/       # Theme definitions (dark/light)
│   └── utils/       # CSV export utilities
├── App.js           # Root component and navigation setup
├── index.js         # App entry point
├── app.json         # Expo configuration
└── eas.json         # EAS build profiles
```

---

## License

MIT License — Copyright (c) 2025 Samuel Carrasco

See [LICENSE](./LICENSE) for full terms.
