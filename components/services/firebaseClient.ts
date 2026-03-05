import { Question } from '../../types';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (!apiKey || !projectId) {
  throw new Error('Missing Firebase env vars: VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are required.');
}

const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const TOKEN_STORAGE_KEY = 'studygenius_firebase_id_token';

type JsonRecord = Record<string, any>;

const parseDocId = (name: string) => name.split('/').pop() ?? '';

const toFirestoreValue = (value: any): any => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      fields[k] = toFirestoreValue(v);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
};

const fromFirestoreValue = (value: any): any => {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    const out: JsonRecord = {};
    Object.entries(value.mapValue.fields ?? {}).forEach(([k, v]) => {
      out[k] = fromFirestoreValue(v);
    });
    return out;
  }
  return undefined;
};

const encodeFields = (obj: JsonRecord): Record<string, any> => {
  const fields: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    fields[k] = toFirestoreValue(v);
  });
  return fields;
};

const decodeDocument = (doc: any) => {
  const decoded: JsonRecord = { id: parseDocId(doc.name) };
  Object.entries(doc.fields ?? {}).forEach(([k, v]) => {
    decoded[k] = fromFirestoreValue(v);
  });
  return decoded;
};

const readStoredToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY);
const setStoredToken = (idToken: string) => localStorage.setItem(TOKEN_STORAGE_KEY, idToken);

export const clearStoredToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);
export const getIdToken = () => readStoredToken();

const firebaseAuthRequest = async (path: string, body: JsonRecord) => {
  const response = await fetch(`${FIREBASE_AUTH_BASE}/${path}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Firebase auth request failed.');
  }

  return json;
};

const firestoreRequest = async (path: string, options: RequestInit = {}, idToken?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${FIRESTORE_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(json?.error?.message ?? 'Firestore request failed.');
  }

  return json;
};

export const signInWithPassword = async (email: string, password: string) => {
  const data = await firebaseAuthRequest('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true
  });
  setStoredToken(data.idToken);
  return data;
};

export const signUpWithPassword = async (email: string, password: string, username: string) => {
  const data = await firebaseAuthRequest('accounts:signUp', {
    email,
    password,
    returnSecureToken: true
  });

  await firebaseAuthRequest('accounts:update', {
    idToken: data.idToken,
    displayName: username,
    returnSecureToken: true
  });

  setStoredToken(data.idToken);
  return data;
};

export const getCurrentAuthUser = async () => {
  const idToken = readStoredToken();
  if (!idToken) return null;

  const data = await firebaseAuthRequest('accounts:lookup', { idToken });
  const user = data?.users?.[0];
  if (!user?.localId) return null;

  return {
    uid: user.localId,
    email: user.email,
    idToken
  };
};

export const signOut = async () => {
  clearStoredToken();
};

export const getProfile = async (uid: string, idToken?: string) => {
  const doc = await firestoreRequest(`/profiles/${uid}`, {}, idToken);
  if (!doc) return null;
  return decodeDocument(doc);
};

export const upsertProfile = async (uid: string, profile: JsonRecord, idToken?: string) => {
  const updateMask = Object.keys(profile).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
  const query = updateMask ? `?${updateMask}` : '';

  const doc = await firestoreRequest(
    `/profiles/${uid}${query}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ fields: encodeFields(profile) })
    },
    idToken
  );

  return decodeDocument(doc);
};

export const listProfiles = async (idToken?: string) => {
  const response = await firestoreRequest('/profiles', {}, idToken);
  const docs = response?.documents ?? [];
  return docs.map(decodeDocument).sort((a: JsonRecord, b: JsonRecord) => String(a.username).localeCompare(String(b.username)));
};

export const listGroups = async (idToken?: string) => {
  const response = await firestoreRequest('/groups', {}, idToken);
  const docs = (response?.documents ?? []).map(decodeDocument);
  return docs.sort((a: JsonRecord, b: JsonRecord) => (b.created_at ?? 0) - (a.created_at ?? 0));
};

export const createGroup = async (payload: JsonRecord, idToken?: string) => {
  const doc = await firestoreRequest(
    '/groups',
    {
      method: 'POST',
      body: JSON.stringify({ fields: encodeFields({ ...payload, created_at: Date.now() }) })
    },
    idToken
  );

  return decodeDocument(doc);
};

export const listExamsByGroup = async (groupId: string, idToken?: string) => {
  const response = await firestoreRequest('/exams', {}, idToken);
  const docs = (response?.documents ?? []).map(decodeDocument).filter((doc: JsonRecord) => doc.group_id === groupId);
  return docs.sort((a: JsonRecord, b: JsonRecord) => (b.created_at ?? 0) - (a.created_at ?? 0));
};

export const createExam = async (payload: { group_id: string; title: string; questions: Question[]; creator_id: string }, idToken?: string) => {
  const doc = await firestoreRequest(
    '/exams',
    {
      method: 'POST',
      body: JSON.stringify({ fields: encodeFields({ ...payload, created_at: Date.now() }) })
    },
    idToken
  );

  return decodeDocument(doc);
};
