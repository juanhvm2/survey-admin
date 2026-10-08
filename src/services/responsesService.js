import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, doc, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { nanoid } from 'nanoid';

export const responsesService = {
  async submit(surveyId, answers) {
    const respondentId = nanoid(16);
    return addDoc(collection(db, 'surveys', surveyId, 'responses'), {
      answers,
      respondentId,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  },

  async listBySurvey(surveyId) {
    const q = query(
      collection(db, 'surveys', surveyId, 'responses'),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async delete(surveyId, responseId) {
    await deleteDoc(doc(db, 'surveys', surveyId, 'responses', responseId));
  },
};