import { firestore, auth } from "../admin.js";
import type { UserData } from "../types.js";

export async function checkUserId(
  userId: string
): Promise<UserData | false> {
  const userRef = await firestore.collection("USERS").doc(userId).get();

  if (!userRef.exists) return false;
  let userData = userRef.data() as UserData;

  if (!userData.display_name || !userData.email) {
    const userAuth = await auth.getUser(userId);
    await firestore.collection("USERS").doc(userId).update({
      email: userAuth.email,
      display_name: userAuth.displayName,
      id: userId,
    });
    const newUserRef = await firestore.collection("USERS").doc(userId).get();
    userData = newUserRef.data() as UserData;
  }

  return userData;
}
