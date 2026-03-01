import { onRequest } from "firebase-functions/v2/https";
import { firestore, Collections } from "../../admin.js";
import { returnJson } from "../../utils/returnJson.js";
import axios from "axios";

export const getHeadShotFn = onRequest(async (req, res) => {
  const playerId = req.query.playerId as string;

  const playerRef = await firestore
    .collection(Collections.HEADSHOTS)
    .doc(playerId)
    .get();

  const player = playerRef.data();
  if (!player) {
    returnJson(res, { fail: "Player not found" });
    return;
  }

  const configSnap = await firestore
    .collection(Collections.CONFIG)
    .doc("sports_radar")
    .get();
  const config = configSnap.data() ?? {};

  let url = "";
  if (player.sport === "nba") {
    const { photo_key } = config[player.sport];
    url = `https://api.sportradar.us/nba-images-t3/getty${player.links["80x80"].href}?api_key=${photo_key}`;
  } else if (player.sport === "mlb") {
    const { photo_key } = config[player.sport];
    url = `https://api.sportradar.us/mlb-images-t3/usat${player.links["80x80"].href}?api_key=${photo_key}`;
  }

  try {
    res.setHeader("Content-Type", "image/jpg");
    const response = await axios({ url, method: "GET", responseType: "stream" });
    response.data.pipe(res);
  } catch (e) {
    console.error("Sports Radar Fail:", (e as Error).message, url);
    returnJson(res, { fail: (e as Error).message });
  }
});
