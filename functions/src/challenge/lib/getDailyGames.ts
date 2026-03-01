import { getSportsRadarConfig } from "../../utils/sportsRadarConfig.js";
import { firestore } from "../../admin.js";
import axios from "axios";
import type { SportRadarConfig } from "../../types.js";

let sportRadarConfig: SportRadarConfig | null = null;

function getURL(api: string): string {
  const today = new Date();
  today.setMonth(today.getMonth() + 1);
  today.setDate(today.getDate() + 1);
  const { key, access_level } = sportRadarConfig![api];
  return `https://api.sportradar.us/${api}/${access_level}/v7/en/games/${today.getFullYear()}/${today.getMonth()}/${today.getDate()}/schedule.json?api_key=${key}`;
}

function getTennisURL(api: string): string {
  const today = new Date();
  today.setMonth(today.getMonth() + 1);
  today.setDate(today.getDate() + 1);
  const { key } = sportRadarConfig![api];
  return `https://api.sportradar.com/tennis-t2/en/schedules/${today.getFullYear()}-${today.getMonth()}-${today.getDate()}/schedule.json?api_key=${key}`;
}

async function getNFLGames(): Promise<unknown[]> {
  const { YEAR } = sportRadarConfig!.nfl;
  const todayStart = new Date();
  todayStart.setDate(todayStart.getDate() + 1);
  todayStart.setMinutes(0);
  todayStart.setHours(0);
  todayStart.setSeconds(0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  todayEnd.setHours(todayEnd.getHours() + 5);

  const gamesRef = await firestore
    .collection("NFL")
    .doc(YEAR!)
    .collection("SCHEDULE")
    .where("scheduled", ">=", todayStart)
    .where("scheduled", "<=", todayEnd)
    .get();

  return gamesRef.docs.map((d) => {
    const data = d.data();
    return { ...data, scheduled: data.scheduled.toDate().toISOString() };
  });
}

async function getCFBGames(): Promise<unknown[]> {
  const { YEAR } = sportRadarConfig!.ncaafb;
  const todayStart = new Date();
  todayStart.setDate(todayStart.getDate() + 1);
  todayStart.setMinutes(0);
  todayStart.setHours(0);
  todayStart.setSeconds(0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  todayEnd.setHours(todayEnd.getHours() + 5);

  const gamesRef = await firestore
    .collection("CFB")
    .doc(YEAR!)
    .collection("SCHEDULE")
    .where("scheduled", ">=", todayStart)
    .where("scheduled", "<=", todayEnd)
    .get();

  return gamesRef.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      scheduled: data.scheduled.toDate().toISOString(),
      away: { name: data.away, id: data.away },
      home: { name: data.home, id: data.home },
    };
  });
}

async function getGames(api: string): Promise<unknown[]> {
  try {
    const url = api === "tennis" ? getTennisURL(api) : getURL(api);
    const { data } = await axios.get(url);
    if (!data.games) return [];
    return data.games.filter(
      (game: Record<string, unknown>) => game.status === "scheduled"
    );
  } catch (e) {
    console.error(`${api} games fetch error:`, (e as Error).message);
    return [];
  }
}

export async function getDailyGames(): Promise<Record<string, { games: unknown[]; type: string }>> {
  sportRadarConfig = await getSportsRadarConfig();

  const [mlb, nba, wnba, nhl, tennis, nfl, ncaafb] = await Promise.all([
    getGames("mlb"),
    getGames("nba"),
    getGames("wnba"),
    getGames("nhl"),
    getGames("tennis"),
    getNFLGames(),
    getCFBGames(),
  ]);

  return {
    mlb: { games: mlb || [], type: "MLB" },
    wnba: { games: wnba || [], type: "WNBA" },
    nba: { games: nba || [], type: "NBA" },
    nhl: { games: nhl || [], type: "NHL" },
    tennis: { games: tennis || [], type: "TENNIS" },
    nfl: { games: nfl || [], type: "NFL" },
    ncaafb: { games: ncaafb || [], type: "NCAAFB" },
  };
}
