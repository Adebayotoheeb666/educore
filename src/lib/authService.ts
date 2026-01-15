import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
    uid: string;
    fullName: string;
    email?: string;
    role: 'admin' | 'staff' | 'student' | 'parent' | 'bursar';
    schoolId: string;
    admissionNumber?: string;
    staffId?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
}

/**
 * Maps an admission number to a virtual email for Firebase Auth
 */
export const getVirtualEmail = (schoolId: string, admissionNumber: string) => {
    return `${admissionNumber.toLowerCase()}@${schoolId.toLowerCase()}.edu`;
};

/**
 * Registers a new school and its first admin
 */
export const registerSchool = async (adminData: any, schoolData: any) => {
    const { email, password, fullName } = adminData;
    const { name, address } = schoolData;

    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Generate School ID (simple slug for now)
    const schoolId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    // 3. Create School Document
    await setDoc(doc(db, 'schools', schoolId), {
        schoolId,
        name,
        address,
        adminUid: uid,
        createdAt: new Date().toISOString()
    });

    // 4. Create User Profile
    const profile: UserProfile = {
        uid,
        fullName,
        email,
        role: 'admin',
        schoolId
    };
    await setDoc(doc(db, 'users', uid), profile);

    return { schoolId, uid };
};

/**
 * Login using Admission Number and PIN
 */
export const loginWithAdmissionNumber = async (schoolId: string, admissionNumber: string, pin: string) => {
    const virtualEmail = getVirtualEmail(schoolId, admissionNumber);
    // Using the admission number as password or a separate pin? 
    // Let's assume the PIN is the password for the virtual account.
    return await signInWithEmailAndPassword(auth, virtualEmail, pin);
};

/**
 * Get the current user's profile from Firestore
 */
export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
};
