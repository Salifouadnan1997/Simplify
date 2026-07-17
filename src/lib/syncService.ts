import localforage from 'localforage';
import { SmartDocument } from '../types';

// We store documents in indexedDB
export const db = localforage.createInstance({
  name: "SaisieIntelligente",
  storeName: "documents"
});

// A queue for syncing changes when online
export const syncQueue = localforage.createInstance({
  name: "SaisieIntelligente",
  storeName: "syncQueue"
});

export async function getSavedDocuments(): Promise<SmartDocument[]> {
  try {
    const keys = await db.keys();
    const docs: SmartDocument[] = [];
    for (const key of keys) {
      const doc = await db.getItem<SmartDocument>(key);
      if (doc) docs.push(doc);
    }
    // Sort by updatedAt descending
    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error("Error reading from IndexedDB", err);
    return [];
  }
}

export async function saveDocument(doc: SmartDocument): Promise<SmartDocument[]> {
  try {
    const updatedDoc = {
      ...doc,
      updatedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'synced' : 'draft' as 'synced' | 'draft'
    };
    await db.setItem(doc.id, updatedDoc);
    
    // Attempt sync if online
    if (navigator.onLine) {
      syncWithCloud(updatedDoc);
    } else {
      await syncQueue.setItem(doc.id, 'pending');
    }
    
    return await getSavedDocuments();
  } catch (err) {
    console.error("Error saving to IndexedDB", err);
    return await getSavedDocuments();
  }
}

export async function deleteDocument(id: string): Promise<SmartDocument[]> {
  try {
    await db.removeItem(id);
    // Sync delete
    if (navigator.onLine) {
      // delete on cloud
    } else {
      await syncQueue.setItem(`delete_${id}`, 'pending');
    }
    return await getSavedDocuments();
  } catch (err) {
    console.error("Error deleting from IndexedDB", err);
    return await getSavedDocuments();
  }
}

export async function processSyncQueue() {
  if (!navigator.onLine) return;
  
  try {
    const keys = await syncQueue.keys();
    for (const key of keys) {
      if (key.startsWith('delete_')) {
        const id = key.replace('delete_', '');
        // handle cloud delete
      } else {
        const doc = await db.getItem<SmartDocument>(key);
        if (doc) {
          await syncWithCloud(doc);
        }
      }
      await syncQueue.removeItem(key);
    }
  } catch (err) {
    console.error("Error processing sync queue", err);
  }
}

async function syncWithCloud(doc: SmartDocument) {
  // Try to push to Supabase using auth token
  const token = localStorage.getItem("saisie_intelligente_token");
  if (!token) return; // Not logged in, skip sync
  
  try {
    // We would make an API call here to save it to Supabase
    const res = await fetch("/api/documents/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ document: doc })
    });
    
    if (res.ok) {
      // Update sync status locally if needed
      const current = await db.getItem<SmartDocument>(doc.id);
      if (current) {
        await db.setItem(doc.id, { ...current, syncStatus: 'synced' });
      }
    }
  } catch (err) {
    console.error("Sync to cloud failed", err);
    await syncQueue.setItem(doc.id, 'pending');
  }
}

// Setup network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("Online: processing sync queue...");
    processSyncQueue();
  });
}
