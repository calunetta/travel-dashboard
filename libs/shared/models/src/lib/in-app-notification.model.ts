import type { FirestoreId, FirestoreTimestamp } from './primitives.types';

export interface InAppNotification {
  id: FirestoreId;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: FirestoreTimestamp;
}
