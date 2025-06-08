# Couple Shopper App

This is a simple shopping list web app.

## Firebase Configuration

The app can store data in Firebase if you provide a `js/firebase-config.js` file containing your Firebase project configuration. This file is ignored by Git for security reasons.

1. Copy `js/firebase-config.example.js` to `js/firebase-config.js`.
2. Replace the placeholder values with your Firebase project's configuration.
3. Deploy the app to your hosting service (e.g., Netlify).

If `firebaseConfig` is not defined, the app falls back to using your browser's local storage. Items will stay only on the current device and will not sync across devices.

## Deployment

This repository includes a simple `netlify.toml` so you can deploy directly to Netlify without any build step. Other static hosting services will work as well.
