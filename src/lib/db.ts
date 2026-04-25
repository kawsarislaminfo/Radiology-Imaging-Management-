import { collection, doc, query, where, getDocs, setDoc, onSnapshot, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { Radiographer, PatientRecord, Department, SystemSettings } from '../types';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfigData } from './firebase';

export const subscribeToSystemSettings = (onUpdate: (settings: SystemSettings) => void) => {
  const docRef = doc(db, 'settings', 'general');
  return onSnapshot(docRef, (docSnap) => {
    const defaultSettings: SystemSettings = {
      browserTitle: 'Sajeda Jabber Hospital Dashboard',
      hospitalName: 'SAJEDA JABBER HOSPITAL LTD',
      footerCopyright: `© ${new Date().getFullYear()} Sajeda Jabber Hospital Ltd. All rights reserved.`,
      footerDisclaimer: 'Confidential medical information. For authorized personnel only.',
      bottomNav: [
        { id: 'DASHBOARD', label: 'Home', iconName: 'LayoutDashboard', isEnabled: true },
        { id: 'DIGITAL X-RAY', label: 'X-Ray', iconName: 'Bone', isEnabled: true },
        { id: 'OPG', label: 'OPG', iconName: 'Activity', isEnabled: true },
        { id: 'CT-SCAN', label: 'CT', iconName: 'Scan', isEnabled: true },
        { id: 'DATA MANAGEMENT', label: 'Data', iconName: 'Database', isEnabled: true },
      ],
      navStyle: 'FLOATING'
    };

    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      onUpdate({
        ...defaultSettings,
        ...data,
        // Deep merge bottomNav if it exists but might be empty? 
        // Actually simple merge is probably enough for most fields.
      });
    } else {
      onUpdate(defaultSettings);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'settings/general');
  });
};

export const updateSystemSettings = async (settings: SystemSettings) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'settings/general');
  }
};

export const subscribeToRadiographers = (onUpdate: (rads: Radiographer[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'radiographers'));
  return onSnapshot(q, (snapshot) => {
    const rads: Radiographer[] = [];
    snapshot.forEach(doc => {
      rads.push({ id: doc.id, ...doc.data() } as Radiographer);
    });
    // @ts-ignore
    rads.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onUpdate(rads);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'radiographers');
  });
};

export const addRadiographerWithAuth = async (rad: Omit<Radiographer, 'id' | 'createdAt'>, password?: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  let tempAuthInstance = null;
  let tempApp = null;
  
  if (password) {
    try {
      // Initialize a temporary Firebase app to create the user without logging out the current admin
      tempApp = initializeApp(firebaseConfigData, 'TempApp-' + Date.now());
      tempAuthInstance = getAuth(tempApp);
      
      const email = rad.username.includes('@') ? rad.username : `${rad.username.toLowerCase().replace(/\s/g, '')}@radiographer.app`;
      // Create user auth profile
      await createUserWithEmailAndPassword(tempAuthInstance, email, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Username already taken by another account.');
      }
      throw new Error(`Failed to create user authentication: ${error.message}`);
    }
  }

  try {
    const finalRad = {
      ...rad,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'radiographers'), finalRad);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'radiographers');
  }
};

export const updateRadiographer = async (id: string, updates: Partial<Omit<Radiographer, 'id' | 'createdAt'>>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    await setDoc(doc(db, 'radiographers', id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'radiographers');
  }
};

export const deleteRadiographer = async (id: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    await deleteDoc(doc(db, 'radiographers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'radiographers');
  }
};

export const subscribeToPatientRecords = (onUpdate: (records: PatientRecord[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'patientRecords'));
  return onSnapshot(q, (snapshot) => {
    const records: PatientRecord[] = [];
    snapshot.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() } as PatientRecord);
    });
    // Sort descending by date, then latest created
    records.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
      return (timeB || Date.now()) - (timeA || Date.now());
    });
    onUpdate(records);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'patientRecords');
  });
};

export const addPatientRecord = async (record: Omit<PatientRecord, 'id'>) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    const finalRecord = {
      ...record,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'patientRecords'), finalRecord);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'patientRecords');
  }
};

export const deletePatientRecord = async (recordId: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    await deleteDoc(doc(db, 'patientRecords', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'patientRecords');
  }
};

export interface ManualStockEntry {
  date: string;
  filmType: string;
  receive: number;
  waste: number;
}

export const subscribeToManualStocks = (onUpdate: (stocks: ManualStockEntry[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'filmStocks'));
  return onSnapshot(q, (snapshot) => {
    const stocks: ManualStockEntry[] = [];
    snapshot.forEach(doc => {
      stocks.push(doc.data() as ManualStockEntry);
    });
    onUpdate(stocks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'filmStocks');
  });
};

export const updateManualStock = async (stock: ManualStockEntry) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const stockId = `${stock.date}_${stock.filmType}`;
  try {
    const finalStock = {
      ...stock,
      use: 0, // Keep 'use' at 0 in this doc, calculated dynamically
      userId: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'filmStocks', stockId), finalStock);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'filmStocks');
  }
};
