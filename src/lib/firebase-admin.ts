import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };
import fs from 'fs';
import path from 'path';

let credential;
try {
  // If the user uploads serviceAccountKey.json in the root directory
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = cert(serviceAccount);
  } else if (fs.existsSync('path/to/serviceAccountKey.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('path/to/serviceAccountKey.json', 'utf8'));
    credential = cert(serviceAccount);
  }
} catch (e) {
  console.warn("Failed to load serviceAccountKey.json:", e);
}

if (!getApps().length) {
  const appOptions: any = {
    projectId: firebaseConfig.projectId,
  };
  if (credential) {
    appOptions.credential = credential;
  }
  
  initializeApp(appOptions);
}

export const adminAuth = getAuth();
