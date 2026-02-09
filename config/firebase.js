const admin = require("firebase-admin");

let database = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Initialize Firebase Admin SDK with retry logic
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

    // Initialize Firebase Admin with connection settings
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
      databaseAuthVariableOverride: null,
    });

    database = admin.database();

    // Enable connection persistence and set timeouts
    database.goOnline();

    console.log("✅ Firebase initialized successfully");
    initAttempts = 0;
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error.message);
    initAttempts++;

    if (initAttempts < MAX_INIT_ATTEMPTS) {
      console.log(
        `🔄 Retrying Firebase initialization (attempt ${initAttempts + 1}/${MAX_INIT_ATTEMPTS})...`,
      );
      setTimeout(() => initializeFirebase(), 2000);
      return;
    }

    console.error(
      "Make sure serviceAccountKey.json exists and FIREBASE_DATABASE_URL is correct",
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

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    const testRef = database.ref(".info/connected");
    const snapshot = await testRef.once("value");
    return snapshot.val() === true;
  } catch (error) {
    console.error("Firebase connection test failed:", error.message);
    return false;
  }
}

module.exports = {
  initializeFirebase,
  getDatabase,
  getMessagesRef,
  testConnection,
  admin,
};
