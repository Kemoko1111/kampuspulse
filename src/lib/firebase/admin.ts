import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let app: App | undefined;

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0];

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return null;
  }

  app = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return app;
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp || !tokens.length) return;

  try {
    await getMessaging(firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });
  } catch (error) {
    console.error("FCM send error:", error);
  }
}
