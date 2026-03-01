import { pick as pickFunc } from "./pick.js";
import { firestore, Collections } from "../../admin.js";
import type { SlatePlayer } from "../../types.js";

function getBestPick(
  tier: { players: string[] },
  players: Record<string, SlatePlayer>,
  currentContest: Record<string, unknown>
): SlatePlayer {
  const playersToSort: SlatePlayer[] = [];
  const playersArray = Array.from(tier.players);

  for (const playerId of playersArray) {
    const currentPlayer = players[playerId];
    const picks = currentContest.picks as string[] | undefined;
    const oppenent = currentContest.oppenent as Record<string, unknown> | undefined;
    const opponentPicks = oppenent?.picks as string[] | undefined;

    if (picks?.includes(playerId)) continue;
    if (opponentPicks?.includes(playerId)) continue;
    if (currentPlayer.picked) continue;

    playersToSort.push(currentPlayer);
  }

  playersToSort.sort((a, b) => {
    if (a.key_stat) {
      if (parseFloat(String(a.key_stat)) < parseFloat(String(b.key_stat))) return 1;
      if (parseFloat(String(a.key_stat)) > parseFloat(String(b.key_stat))) return -1;
    }
    const aName = a.last_name || a.name || "";
    const bName = b.last_name || b.name || "";
    if (aName < bName) return 1;
    if (aName > bName) return -1;
    return 0;
  });

  return playersToSort[0];
}

export async function draftClock(): Promise<boolean> {
  const userContestsSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .get();

  if (userContestsSnap.empty) {
    console.log("No contests for draft clock");
    return true;
  }

  const drafted = new Set<string>();
  const currentTime = new Date(new Date().toISOString());
  console.log(`Checking Drafts for ${currentTime.toISOString()}`);

  const drafts: Array<Promise<{ noop?: string; pick_made?: boolean }>> = [];

  const contestsByUser: Record<string, Record<string, unknown>> = {};
  for (const doc of userContestsSnap.docs) {
    contestsByUser[doc.id] = doc.data();
  }

  for (const currentUserId of Object.keys(contestsByUser)) {
    const userData = contestsByUser[currentUserId];
    const contests = userData.contests as Record<string, Record<string, unknown>> | undefined;
    if (!contests) continue;

    for (const [contestId, currentContest] of Object.entries(contests)) {
      if (!currentContest || currentContest.stage !== "draft") continue;

      const draft = currentContest.draft as Record<string, unknown>;
      if (!draft) continue;
      const pickTime = new Date(draft.next_pick_time as string);
      const oppenent = currentContest.oppenent as Record<string, unknown>;
      if (!oppenent) continue;

      const draftKey = `${contestId}`;
      if (currentTime >= pickTime) {
        if (drafted.has(draftKey)) continue;
        drafted.add(draftKey);

        const slate = currentContest.slate as Record<string, unknown>;
        const tiers = slate.tiers as Array<{ players: string[] }>;
        const players = slate.players as Record<string, SlatePlayer>;

        const bestPick = getBestPick(
          tiers[(draft.round as number) - 1],
          players,
          currentContest
        );

        const onTheClock = draft.on_the_clock as string;
        console.log(`Drafting ${bestPick.id} for ${onTheClock} in contest ${contestId}`);

        const onTheClockData = contestsByUser[onTheClock] as Record<string, unknown> | undefined;
        const onTheClockContests = onTheClockData?.contests as Record<string, Record<string, unknown>> | undefined;
        const onTheClockContest = onTheClockContests?.[contestId];
        const onTheClockDraft = onTheClockContest?.draft as Record<string, unknown> | undefined;
        const draftContestToken = onTheClockDraft?.token as string;

        drafts.push(pickFunc(onTheClock, bestPick.id, draftContestToken, contestId));
      }
    }
  }

  if (drafts.length) {
    const response = await Promise.all(drafts);
    console.log(JSON.stringify(response));
  }

  return true;
}
