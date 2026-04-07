# PROJECT SUMMARY (Context Map)

## 🏗️ Tech Stack

- **Frontend/Mobile:** React Native (Expo), TypeScript.
- **State Management:** Zustand (`languageStore`, `audioStore`, `locationStore`).
- **Maps:** React Native Maps (Google Maps Provider).
- **i18n:** i18next (Locales: `vi`, `en`, `ja`, `fr`).

## 📁 Critical File Map (Primary Targets)

- **Map View:** `mobile/src/components/map/simulated-map.tsx` (Contains Marker & Emoji logic).
- **Main App Screen:** `mobile/src/app/(tabs)/index.tsx` (Handles GPS status & Initial Region).
- **Stores:** `mobile/src/stores/` (location, audio, language).

## 🚀 Current Feature Status

- **POI Markers:** Switching from default title/desc to Custom Emoji View.
- **Icon Logic:** 🍽️ (Food), 🏆 (Priority > 5), 🔸 (Default).
- **Active State:** Scale 1.6 + Gold Glow shadow (`#FFD700`).
- **GPS UI:** Dynamic text (● Live Green / ○ Searching Red).

## ⚠️ Fixed Execution Rules

- **Terminal:** ALWAYS use `;` for PowerShell (Never `&&`).
- **File Update:** ALWAYS show FULL code (Anti-truncation rule).
- **Priority:** Security > Functionality > Code Quality.
