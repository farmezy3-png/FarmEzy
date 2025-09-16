import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const bananaWeightsCollection = collection(db, 'bananaWeights');

/**
 * Save and update user details in Firestore
 * @param {*} data 
 * @returns 
 */
export const manageUserDetails = async (data) => {
  console.log('Saving user details:', data);
  const docRef = await addDoc(collection(db, 'userdetails'), {
    data,
    createdAt: new Date(),
  });
  return docRef.id;
};

/**
 * Fetch user details from Firestore
 * @returns 
 */

export const fetchUserDetails = async () => {
  const querySnapshot = await getDocs(collection(db, 'userdetails'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Save and update banana cultivation details of farmer in Firestore
 * @param {*} data 
 * @returns 
 */
export const manageBananaWeightDetails = async (data) => {
  const docRef = await addDoc(bananaWeightsCollection, data);
  return docRef.id;
  };

/**
 * 
 */
export const fetchBananaWeightDetails = async () => {
  const snapshot = await getDocs(bananaWeightsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetch weight details by mobile number
 * @param {*} id 
 * @returns 
 */

export const fetchBananaWeightsByMobile = async (contactNumber) => {
  const q = query(bananaWeightsCollection, where('ContactNumber', '==', contactNumber));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
