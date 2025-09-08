import { atom } from 'jotai';

export const userAtom = atom(null); // { id, email, totpEnabled } | null
export const ticketAtom = atom(null); // login ticketId za /2fa
export const loadingMeAtom = atom(true); // inicijalni fetch /api/me
