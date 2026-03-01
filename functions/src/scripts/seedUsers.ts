/**
 * Seed the local Firestore emulator with 100 fake users.
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/seedUsers.ts
 */
import { firestore, Collections } from "../admin.js";
import { Batch } from "../utils/Batch.js";
import { v4 as uuidv4 } from "uuid";

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Chris", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa",
  "Timothy", "Deborah",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts",
];

const AVATARS = [
  "air_jordan", "analyst", "angry_coach", "anthem_singer", "assistant_coach",
  "bachelor", "bachelorette", "bag_head_fan", "bobble_head", "cameraman",
  "cheerleader", "chicken", "coach", "dancing_with_the_stars", "dragon",
  "fangirl", "fanguy", "female_survivor", "football", "hostbot",
  "influencer", "linesman", "masked_singer", "monster_mascot", "ninja_warrior",
  "owner", "pizza_guy", "point_guard", "receiver", "referee",
  "rookie", "singing_contestant", "streaker", "superfan", "survivor",
  "suspended", "tailgater", "trainer", "ufc", "vendor", "wnba", "waterboy",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedUsers(): Promise<void> {
  const batch = new Batch(firestore);
  const count = 100;

  console.log(`Seeding ${count} users...`);

  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const display_name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@test.com`;
    const avatar = pick(AVATARS);

    batch.set(firestore.collection(Collections.USERS).doc(id), {
      id,
      display_name,
      email,
      avatar,
      avatar_picked: true,
      record: { wins: 0, losses: 0 },
    });

    if ((i + 1) % 25 === 0) {
      console.log(`  Prepared ${i + 1}/${count}`);
    }
  }

  await batch.write();
  console.log(`Done! Seeded ${count} users into USERS collection.`);
}

seedUsers().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error seeding users:", e);
  process.exit(1);
});
