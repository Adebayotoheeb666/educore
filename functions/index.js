const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Automatically set custom claims when a new user profile is created
 * Triggered by Firestore onCreate event on users collection
 */
exports.setCustomClaimsOnUserCreate = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        const userData = snap.data();
        const userId = context.params.userId;

        try {
            // Set custom claims on the user's auth token
            await admin.auth().setCustomUserClaims(userId, {
                role: userData.role,
                schoolId: userData.schoolId
            });

            console.log(`Custom claims set for user ${userId}: role=${userData.role}, schoolId=${userData.schoolId}`);

            // Update user document to indicate claims are set
            await snap.ref.update({
                claimsSet: true,
                claimsSetAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error(`Error setting custom claims for user ${userId}:`, error);
            throw error;
        }
    });

/**
 * Update custom claims when user profile is updated
 * Triggered by Firestore onUpdate event on users collection
 */
exports.updateCustomClaimsOnUserUpdate = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const userId = context.params.userId;

        // Check if role or schoolId changed
        if (beforeData.role !== afterData.role || beforeData.schoolId !== afterData.schoolId) {
            try {
                // Update custom claims
                await admin.auth().setCustomUserClaims(userId, {
                    role: afterData.role,
                    schoolId: afterData.schoolId
                });

                console.log(`Custom claims updated for user ${userId}: role=${afterData.role}, schoolId=${afterData.schoolId}`);

                // Update user document
                await change.after.ref.update({
                    claimsSet: true,
                    claimsSetAt: admin.firestore.FieldValue.serverTimestamp()
                });

            } catch (error) {
                console.error(`Error updating custom claims for user ${userId}:`, error);
                throw error;
            }
        }
    });

/**
 * Manually set custom claims for a user
 * Callable function for admin use
 */
exports.setUserCustomClaims = functions.https.onCall(async (data, context) => {
    // Verify the caller is authenticated and is an admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const callerToken = context.auth.token;
    if (callerToken.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can set custom claims');
    }

    const { userId, role, schoolId } = data;

    // Validate inputs
    if (!userId || !role || !schoolId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId, role, and schoolId are required');
    }

    // Verify the user belongs to the same school as the admin
    if (callerToken.schoolId !== schoolId) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot set claims for users in other schools');
    }

    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, {
            role,
            schoolId
        });

        // Update Firestore
        await admin.firestore().collection('users').doc(userId).update({
            claimsSet: true,
            claimsSetAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Custom claims set successfully' };

    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', 'Failed to set custom claims');
    }
});

/**
 * Bulk set custom claims for all existing users
 * HTTP endpoint for one-time migration
 */
exports.bulkSetCustomClaims = functions.https.onRequest(async (req, res) => {
    // Add authentication check here in production
    const adminKey = req.query.adminKey;
    if (adminKey !== functions.config().admin?.key) {
        res.status(403).send('Unauthorized');
        return;
    }

    try {
        const usersSnapshot = await admin.firestore().collection('users').get();
        const updates = [];

        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const userId = doc.id;

            if (userData.role && userData.schoolId) {
                const updatePromise = admin.auth()
                    .setCustomUserClaims(userId, {
                        role: userData.role,
                        schoolId: userData.schoolId
                    })
                    .then(() => {
                        return doc.ref.update({
                            claimsSet: true,
                            claimsSetAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .catch((error) => {
                        console.error(`Error setting claims for ${userId}:`, error);
                    });

                updates.push(updatePromise);
            }
        });

        await Promise.all(updates);

        res.status(200).send({
            success: true,
            message: `Custom claims set for ${updates.length} users`
        });

    } catch (error) {
        console.error('Error in bulk set custom claims:', error);
        res.status(500).send({ error: 'Failed to set custom claims' });
    }
});

/**
 * Get user's custom claims
 * Callable function to check current claims
 */
exports.getUserClaims = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = data.userId || context.auth.uid;

    try {
        const user = await admin.auth().getUser(userId);
        return {
            customClaims: user.customClaims || {},
            uid: user.uid,
            email: user.email
        };
    } catch (error) {
        console.error('Error getting user claims:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user claims');
    }
});

/**
 * Monitor student attendance and trigger alerts
 * Triggered on new attendance record
 */
exports.checkAttendancePatterns = functions.firestore
    .document('attendance/{attendanceId}')
    .onCreate(async (snap, context) => {
        const newRecord = snap.data();

        // Only trigger on absence
        if (newRecord.status !== 'absent') return;

        const { schoolId, studentId, date } = newRecord;

        try {
            // Get student details
            const studentDoc = await admin.firestore().collection('users').doc(studentId).get();
            const studentName = studentDoc.data().fullName || 'Student';

            // Check last 5 attendance records
            const recentAttendance = await admin.firestore()
                .collection('attendance')
                .where('schoolId', '==', schoolId)
                .where('studentId', '==', studentId)
                .orderBy('date', 'desc')
                .limit(5)
                .get();

            const absences = recentAttendance.docs.filter(doc => doc.data().status === 'absent').length;

            // Alert logic: If student is absent 3+ times in last 5 records
            if (absences >= 3) {
                // Create Alert Notification
                await admin.firestore().collection('notifications').add({
                    schoolId,
                    type: 'attendance_alert',
                    title: 'Attendance Warning',
                    message: `${studentName} has been absent ${absences} times recently. Please contact parents.`,
                    priority: 'high',
                    relatedStudentId: studentId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });

                console.log(`Attendance alert triggered for student ${studentId}`);
            }
        } catch (error) {
            console.error('Error in checkAttendancePatterns:', error);
        }
    });
