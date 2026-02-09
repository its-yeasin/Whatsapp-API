#!/usr/bin/env node

/**
 * Firebase Connection Diagnostic Tool
 * Run this on production server to diagnose Firebase connectivity issues
 */

require("dotenv").config();
const admin = require("firebase-admin");

console.log("╔════════════════════════════════════════════╗");
console.log("║   Firebase Connection Diagnostics         ║");
console.log("╚════════════════════════════════════════════╝");
console.log("");

async function runDiagnostics() {
  let exitCode = 0;

  try {
    // Test 1: Check service account file
    console.log("🔍 Test 1: Service Account Key");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    try {
      const serviceAccount = require("./serviceAccountKey.json");
      console.log("✅ Service account key file found");
      console.log(`   Project ID: ${serviceAccount.project_id || "Unknown"}`);
      console.log(`   Client Email: ${serviceAccount.client_email || "Unknown"}`);
      
      if (serviceAccount.databaseURL) {
        console.log(`   Database URL: ${serviceAccount.databaseURL}`);
      } else if (process.env.FIREBASE_DATABASE_URL) {
        console.log(`   Database URL: ${process.env.FIREBASE_DATABASE_URL} (from .env)`);
      } else {
        console.log("⚠️  WARNING: No databaseURL found in service account or .env");
        exitCode = 1;
      }
    } catch (error) {
      console.log("❌ Service account key file NOT found or invalid");
      console.log(`   Error: ${error.message}`);
      exitCode = 1;
      return;
    }
    console.log("");

    // Test 2: Initialize Firebase
    console.log("🔍 Test 2: Firebase Initialization");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    let database;
    try {
      const serviceAccount = require("./serviceAccountKey.json");
      const dbURL = process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL;
      
      if (!dbURL) {
        throw new Error("No database URL configured");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbURL,
      });

      database = admin.database();
      console.log("✅ Firebase initialized successfully");
      console.log(`   Database URL: ${dbURL}`);
    } catch (error) {
      console.log("❌ Firebase initialization failed");
      console.log(`   Error: ${error.message}`);
      exitCode = 1;
      return;
    }
    console.log("");

    // Test 3: Connection Status
    console.log("🔍 Test 3: Connection Status");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    try {
      const connectedRef = database.ref(".info/connected");
      
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection check timeout (10s)")), 10000);
      });

      const snapshot = await Promise.race([
        connectedRef.once("value"),
        timeout
      ]);

      const isConnected = snapshot.val();
      if (isConnected === true) {
        console.log("✅ Firebase connection verified");
      } else {
        console.log("⚠️  Connection status unknown");
        exitCode = 1;
      }
    } catch (error) {
      console.log("❌ Connection check failed");
      console.log(`   Error: ${error.message}`);
      exitCode = 1;
    }
    console.log("");

    // Test 4: Write Test
    console.log("🔍 Test 4: Write Operation");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    try {
      const testRef = database.ref("_diagnostic_test");
      const testData = {
        timestamp: Date.now(),
        test: "connectivity",
      };

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Write timeout (10s)")), 10000);
      });

      const startTime = Date.now();
      await Promise.race([
        testRef.set(testData),
        timeout
      ]);
      const writeTime = Date.now() - startTime;

      console.log(`✅ Write operation successful (${writeTime}ms)`);
    } catch (error) {
      console.log("❌ Write operation failed");
      console.log(`   Error: ${error.message}`);
      exitCode = 1;
    }
    console.log("");

    // Test 5: Read Test
    console.log("🔍 Test 5: Read Operation");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    try {
      const testRef = database.ref("_diagnostic_test");

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Read timeout (10s)")), 10000);
      });

      const startTime = Date.now();
      const snapshot = await Promise.race([
        testRef.once("value"),
        timeout
      ]);
      const readTime = Date.now() - startTime;

      console.log(`✅ Read operation successful (${readTime}ms)`);
      console.log(`   Data: ${JSON.stringify(snapshot.val())}`);
    } catch (error) {
      console.log("❌ Read operation failed");
      console.log(`   Error: ${error.message}`);
      exitCode = 1;
    }
    console.log("");

    // Test 6: Cleanup
    console.log("🔍 Test 6: Cleanup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    try {
      const testRef = database.ref("_diagnostic_test");
      await testRef.remove();
      console.log("✅ Test data cleaned up");
    } catch (error) {
      console.log("⚠️  Cleanup failed (non-critical)");
      console.log(`   Error: ${error.message}`);
    }
    console.log("");

  } catch (error) {
    console.log("");
    console.log("❌ Unexpected error during diagnostics:");
    console.log(`   ${error.message}`);
    console.log(`   ${error.stack}`);
    exitCode = 1;
  }

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  
  if (exitCode === 0) {
    console.log("✅ All tests passed! Firebase is working correctly.");
  } else {
    console.log("❌ Some tests failed. Firebase connectivity issues detected.");
    console.log("");
    console.log("Troubleshooting steps:");
    console.log("1. Verify FIREBASE_DATABASE_URL in .env file");
    console.log("2. Check serviceAccountKey.json has correct project_id");
    console.log("3. Ensure Firebase Realtime Database is enabled in Firebase Console");
    console.log("4. Check network connectivity:");
    console.log("   curl -v https://firebaseio.com");
    console.log("5. Verify firewall/security groups allow outbound HTTPS");
    console.log("6. Check if IP is whitelisted in Firebase project settings");
    console.log("7. Verify service account has 'Firebase Realtime Database Admin' role");
  }
  
  console.log("");
  process.exit(exitCode);
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
