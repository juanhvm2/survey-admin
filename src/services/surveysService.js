import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { nanoid } from 'nanoid';

const COL = 'surveys';

export const surveysService = {
  async create(data) {
    const now = serverTimestamp();
    const slug = nanoid(8);
    const survey = {
      ...data,
      status: data.status || 'draft',
      publicSlug: slug,
      questions: data.questions || [],
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, COL, slug), survey);
    return { id: slug };
  },

  async list() {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async get(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // El slug es el ID del documento, así que leer es directo
  async getBySlug(slug) {
    return this.get(slug);
  },

  async update(id, data) {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, COL, id));
  },

  async duplicate(id) {
    const original = await this.get(id);
    if (!original) throw new Error('Encuesta no encontrada');
    const { createdAt, updatedAt, publicSlug, ...rest } = original;
    delete rest.id;
    return this.create({
      ...rest,
      title: `${original.title} (Copia)`,
      status: 'draft',
    });
  },
};