import type { SlatePlayer } from "../../types.js";

export function getBestPick(
  tier: { players: string[] },
  players: Record<string, SlatePlayer>,
  contest: Record<string, unknown>
): SlatePlayer | undefined {
  const playersToSort: SlatePlayer[] = [];
  const playersArray = Array.from(tier.players);

  for (const playerId of playersArray) {
    const currentPlayer = players[playerId];
    if (!currentPlayer) continue;

    const picks = contest.picks as string[] | undefined;
    const oppenent = contest.oppenent as Record<string, unknown> | undefined;
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
