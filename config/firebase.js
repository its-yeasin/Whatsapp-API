const admin = require("firebase-admin");

let database = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log("✅ Firebase already initialized");
      database = admin.database();
      return;
    }

    // Load service account key
    const serviceAccount = require("../serviceAccountKey.json");

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
    });

    database = admin.database();
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error.message);
    console.error(
      "Make sure serviceAccountKey.json exists in the backend folder",
    );
    process.exit(1);
  }
}

/**
 * Get Firebase Database instance
 */
function getDatabase() {
  if (!database) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }
  return database;
}

/**
 * Get reference to whatsapp_messages
 */
function getMessagesRef() {
  return getDatabase().ref("whatsapp_messages");
}

module.exports = {
  initializeFirebase,
  getDatabase,
  getMessagesRef,
  admin,
};
