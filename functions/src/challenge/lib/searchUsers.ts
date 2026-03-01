import { firestore } from "../../admin.js";

export async function searchUsers(
  displayName: string
): Promise<Array<{ user: { display_name: string; id: string; avatar: string } }>> {
  const usersRefs = await firestore
    .collection("USERS")
    .where("display_name", ">=", displayName)
    .get();

  return usersRefs.docs.map((doc) => {
    const user = doc.data();
    return {
      user: {
        display_name: user.display_name,
        id: user.id,
        avatar: user.avatar,
      },
    };
  });
}
