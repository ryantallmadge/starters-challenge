import { v4 as uuidv4 } from "uuid";
import { MINUTES_DRAFT_CLOCK } from "./config.js";
import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, messaging, Collections } from "../../admin.js";
import { deductCoins } from "./coins.js";

function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    const temp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temp;
  }
  return array;
}

export async function joinContest(
  userId: string,
  opponentId: string,
  wager?: string,
  slateId?: string,
  contestId?: string,
  preDeductedUserIds?: string[]
): Promise<string> {
  const [homeTeamVal, awayTeamVal] = await Promise.all([
    checkUserId(opponentId),
    checkUserId(userId),
  ]);

  if (!homeTeamVal || !awayTeamVal) {
    throw new Error("Invalid user");
  }

  const homeTeam = {
    avatar: homeTeamVal.avatar,
    display_name: homeTeamVal.display_name,
    email: homeTeamVal.email,
    message_token: homeTeamVal.message_token,
  };

  const awayTeam = {
    avatar: awayTeamVal.avatar,
    display_name: awayTeamVal.display_name,
    email: awayTeamVal.email,
    message_token: awayTeamVal.message_token,
  };

  let pickOrder = shuffleArray([opponentId, userId]);
  let draftOrder: string[] = [];
  for (let i = 1; i <= 6; i++) {
    pickOrder = i >= 2 ? pickOrder.reverse() : pickOrder;
    draftOrder = draftOrder.concat(pickOrder);
  }

  const slateDoc = slateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(slateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateDoc.get();
  const currentSlate = slateSnap.data();

  if (!currentSlate) {
    throw new Error("Slate not found");
  }

  const entryCost = currentSlate.entry_cost as number | undefined;
  if (entryCost && entryCost > 0) {
    const slateRefId = currentSlate.id as string | undefined;
    const deductions: Promise<void>[] = [];
    if (!preDeductedUserIds?.includes(userId)) {
      deductions.push(
        deductCoins(userId, entryCost, {
          type: "entry_fee",
          contest_id: slateRefId,
          opponent_id: opponentId,
        })
      );
    }
    if (!preDeductedUserIds?.includes(opponentId)) {
      deductions.push(
        deductCoins(opponentId, entryCost, {
          type: "entry_fee",
          contest_id: slateRefId,
          opponent_id: userId,
        })
      );
    }
    if (deductions.length > 0) {
      await Promise.all(deductions);
    }
  }

  const cId = contestId || uuidv4();

  const date = new Date();
  const now = date.toISOString();
  date.setMinutes(date.getMinutes() + MINUTES_DRAFT_CLOCK);
  const pickTime = date.toISOString();

  const contestBase = {
    slate: currentSlate,
    stage: "draft",
    slate_name: currentSlate.name || "",
    wager: wager || "Bragging Rights",
    created_at: now,
    type: wager ? "challenge" : "public",
  };

  const draftBase = {
    order: draftOrder,
    round: 1,
    on_the_clock: draftOrder[0],
    current_pick: 0,
    last_pick_time: now,
    next_pick_time: pickTime,
  };

  await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).doc(opponentId).set({
      contests: {
        [cId]: {
          ...contestBase,
          draft: { ...draftBase, token: uuidv4() },
          oppenent: {
            ...awayTeam,
            id: userId,
            message_token: null,
          },
        },
      },
    }, { merge: true }),
    firestore.collection(Collections.USER_CONTESTS).doc(userId).set({
      contests: {
        [cId]: {
          ...contestBase,
          draft: { ...draftBase, token: uuidv4() },
          oppenent: {
            ...homeTeam,
            id: opponentId,
            message_token: null,
          },
        },
      },
    }, { merge: true }),
    firestore.collection(Collections.ACTIVE_DRAFTS).doc(cId).set({
      users: [userId, opponentId],
    }),
    firestore.collection(Collections.USER_IN_CONTEST).doc("state").set(
      { [userId]: true, [opponentId]: true },
      { merge: true }
    ),
  ]);

  const tokens = [
    homeTeamVal.message_token,
    awayTeamVal.message_token,
  ].filter((t): t is string => !!t);

  for (const token of tokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: "Your Challenge Has Begun!",
          body: "Good luck!",
        },
      });
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  }

  return cId;
}
