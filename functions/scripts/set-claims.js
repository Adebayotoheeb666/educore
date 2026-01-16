const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check arguments
if (process.argv.length < 5) {
    console.log('Usage: node scripts/set-claims.js <uid> <role> <schoolId> [path-to-service-account.json]');
    console.log('Example: node scripts/set-claims.js user123 admin school123 ./service-account.json');
    process.exit(1);
}

const uid = process.argv[2];
const role = process.argv[3];
const schoolId = process.argv[4];
const serviceAccountPath = process.argv[5] || '../service-account.json';

// Initialize Firebase Admin
try {
    const resolvedPath = path.resolve(serviceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: Service account file not found at: ${resolvedPath}`);
        console.error('Please download your service account key from Firebase Console -> Project Settings -> Service Accounts');
        process.exit(1);
    }

    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
}

// Set Claims
async function setClaims() {
    try {
        console.log(`Setting claims for user ${uid}...`);
        console.log(`Role: ${role}`);
        console.log(`School ID: ${schoolId}`);

        await admin.auth().setCustomUserClaims(uid, {
            role,
            schoolId
        });

        // Verify
        const user = await admin.auth().getUser(uid);
        console.log('Success! Current claims:', user.customClaims);
        process.exit(0);
    } catch (error) {
        console.error('Error setting claims:', error);
        process.exit(1);
    }
}

setClaims();
