import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function processFirestoreTimestamp(docData: any) {
  if (!docData) return docData;

  const newDocData: { [key: string]: any } = {};

  for (const key in docData) {
    if (Object.prototype.hasOwnProperty.call(docData, key)) {
      const value = docData[key];
      if (value instanceof Timestamp) {
        newDocData[key] = value.toDate();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        newDocData[key] = processFirestoreTimestamp(value);
      } else if (Array.isArray(value)) {
        newDocData[key] = value.map(item => processFirestoreTimestamp(item));
      } else {
        newDocData[key] = value;
      }
    }
  }
  return newDocData;
}
