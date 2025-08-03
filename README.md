# Screen Time Tracker PWA

A Progressive Web App (PWA) for tracking screen time and digital wellness. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### 🕒 Real-time Screen Time Tracking
- Track active usage time when the app is in focus
- Automatic pause/resume when switching tabs or apps
- Beautiful, modern timer interface
- Session management with start, pause, and stop controls

### 📊 Comprehensive Analytics
- Daily, weekly, and monthly statistics
- Interactive charts using Recharts
- Time distribution analysis
- Digital wellness insights and recommendations

### 📱 PWA Features
- Installable on iOS and Android devices
- Offline functionality with service worker
- Native app-like experience
- Responsive design optimized for mobile

### 🎨 Modern UI/UX
- Smooth animations with Framer Motion
- Beautiful gradient backgrounds
- Intuitive navigation
- Status indicators for tracking state

## Technical Implementation

### Screen Time Tracking Limitations
Due to iOS privacy restrictions, this app cannot access the system's built-in Screen Time API. Instead, it tracks active usage time when the app is in focus using:

- **Page Visibility API**: Detects when the app tab is visible/hidden
- **Window Focus Events**: Handles app switching and tab changes
- **Local Storage**: Persists tracking data using Zustand with persistence

### Key Technologies
- **Next.js 14**: App Router for modern React development
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management with persistence
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Interactive data visualization
- **next-pwa**: PWA configuration and service worker

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd screen-time-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Select "Add to Home Screen"
4. Customize the name and tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Follow the prompts to install

## Usage

### Tracking Screen Time
1. Open the app and navigate to the Tracker tab
2. Tap "Start Tracking" to begin monitoring
3. The app will automatically pause when you switch tabs or apps
4. Use "Pause" to manually pause tracking
5. Tap "Stop" to end the current session

### Viewing Analytics
1. Navigate to the Analytics tab
2. Switch between weekly and monthly views
3. Explore interactive charts and statistics
4. Review digital wellness insights

## Data Privacy

- All tracking data is stored locally on your device
- No data is sent to external servers
- Data persists between app sessions using browser storage
- You can clear data by clearing browser storage

## Limitations

### iOS Restrictions
- Cannot access system Screen Time API
- Limited background processing
- Requires manual tracking initiation
- May not capture all app usage outside the browser

### Browser Limitations
- Tracking only works when the app is open
- Cannot track usage of other apps
- Depends on browser tab focus
- May be affected by browser power management

## Future Enhancements

- [ ] Background sync capabilities
- [ ] Notifications for break reminders
- [ ] Goal setting and achievements
- [ ] Export data functionality
- [ ] Integration with health apps
- [ ] Advanced analytics and insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on GitHub or contact the development team.