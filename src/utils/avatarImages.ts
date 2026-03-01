import { ImageSourcePropType } from 'react-native';

const avatarImages: Record<string, ImageSourcePropType> = {
  air_jordan: require('../../assets/avatars/Air-Jordan.png'),
  analyst: require('../../assets/avatars/Analyst.png'),
  angry_coach: require('../../assets/avatars/Angry-Coach.png'),
  anthem_singer: require('../../assets/avatars/Anthem-Singer.png'),
  assistant_coach: require('../../assets/avatars/Assistant-Coach.png'),
  bachelor: require('../../assets/avatars/Bachelor.png'),
  bachelorette: require('../../assets/avatars/Bachelorette.png'),
  bag_head_fan: require('../../assets/avatars/Bag-Head-Fan.png'),
  bobble_head: require('../../assets/avatars/Bobble-Head.png'),
  cameraman: require('../../assets/avatars/Cameraman.png'),
  cheerleader: require('../../assets/avatars/Cheerleader.png'),
  chicken: require('../../assets/avatars/Chicken.png'),
  coach: require('../../assets/avatars/Coach.png'),
  dancing_with_the_stars: require('../../assets/avatars/Dancing-With-The-Stars.png'),
  dragon: require('../../assets/avatars/Dragon.png'),
  fangirl: require('../../assets/avatars/Fangirl.png'),
  fanguy: require('../../assets/avatars/Fanguy.png'),
  female_survivor: require('../../assets/avatars/Female-Survivor.png'),
  football: require('../../assets/avatars/Football.png'),
  hostbot: require('../../assets/avatars/Hostbot.png'),
  influencer: require('../../assets/avatars/Influencer.png'),
  linesman: require('../../assets/avatars/Linesman.png'),
  masked_singer: require('../../assets/avatars/Masked Singer.png'),
  monster_mascot: require('../../assets/avatars/Monster-Mascot.png'),
  ninja_warrior: require('../../assets/avatars/Ninja-Warrior.png'),
  owner: require('../../assets/avatars/Owner.png'),
  pizza_guy: require('../../assets/avatars/Pizza-Guy.png'),
  point_guard: require('../../assets/avatars/Point-Guard.png'),
  receiver: require('../../assets/avatars/Receiver.png'),
  referee: require('../../assets/avatars/Referee.png'),
  rookie: require('../../assets/avatars/Rookie.png'),
  singing_contestant: require('../../assets/avatars/Singing-Contestant.png'),
  streaker: require('../../assets/avatars/Streaker.png'),
  superfan: require('../../assets/avatars/Superfan.png'),
  survivor: require('../../assets/avatars/Survivor.png'),
  suspended: require('../../assets/avatars/Suspended.png'),
  tailgater: require('../../assets/avatars/Tailgater.png'),
  trainer: require('../../assets/avatars/Trainer.png'),
  ufc: require('../../assets/avatars/UFC.png'),
  vendor: require('../../assets/avatars/Vendor.png'),
  wnba: require('../../assets/avatars/WNBA.png'),
  waterboy: require('../../assets/avatars/Waterboy.png'),
};

export const avatarDisplayNames: Record<string, string> = {
  air_jordan: 'Air Jordan',
  analyst: 'Analyst',
  angry_coach: 'Angry Coach',
  anthem_singer: 'Anthem Singer',
  assistant_coach: 'Assistant Coach',
  bachelor: 'Bachelor',
  bachelorette: 'Bachelorette',
  bag_head_fan: 'Bag Head Fan',
  bobble_head: 'Bobble Head',
  cameraman: 'Cameraman',
  cheerleader: 'Cheerleader',
  chicken: 'Chicken',
  coach: 'Coach',
  dancing_with_the_stars: 'Dancing With The Stars',
  dragon: 'Dragon',
  fangirl: 'Fangirl',
  fanguy: 'Fanguy',
  female_survivor: 'Female Survivor',
  football: 'Football',
  hostbot: 'Hostbot',
  influencer: 'Influencer',
  linesman: 'Linesman',
  masked_singer: 'Masked Singer',
  monster_mascot: 'Monster Mascot',
  ninja_warrior: 'Ninja Warrior',
  owner: 'Owner',
  pizza_guy: 'Pizza Guy',
  point_guard: 'Point Guard',
  receiver: 'Receiver',
  referee: 'Referee',
  rookie: 'Rookie',
  singing_contestant: 'Singing Contestant',
  streaker: 'Streaker',
  superfan: 'Superfan',
  survivor: 'Survivor',
  suspended: 'Suspended',
  tailgater: 'Tailgater',
  trainer: 'Trainer',
  ufc: 'UFC',
  vendor: 'Vendor',
  wnba: 'WNBA',
  waterboy: 'Waterboy',
};

const keyAliases: Record<string, string> = {
  fan_guy: 'fanguy',
};

function resolveKey(key: string): string {
  return keyAliases[key] || key;
}

export function getAvatarSource(avatar: string): ImageSourcePropType {
  const key = resolveKey(avatar);
  return avatarImages[key] ?? avatarImages.coach;
}

export function getAvatarName(avatar: string): string {
  const key = resolveKey(avatar);
  return avatarDisplayNames[key] ?? avatar;
}

export const avatarKeys = Object.keys(avatarImages);

export default avatarImages;
