import axios from 'axios';

const API_URL = __DEV__
  ? 'http://localhost:5001/starters-challenge/us-central1'
  : 'https://us-central1-starters-challenge.cloudfunctions.net';

export async function createUser(displayName: string, email: string, uid: string) {
  return axios.get(
    `${API_URL}/createUserUrl?display_name=${displayName}&email=${email}&id=${uid}`
  );
}

export async function makePick(userId: string, pick: string, token: string, contestId?: string) {
  const params = new URLSearchParams({ userId, pick, token });
  if (contestId) params.set('contestId', contestId);
  return axios.get(`${API_URL}/makePick?${params.toString()}`);
}

export async function joinPublicContest(userId: string, slateId?: string) {
  const params = new URLSearchParams({ userId });
  if (slateId) params.set('slateId', slateId);
  return axios.get(`${API_URL}/joinPublicContest?${params.toString()}`);
}

export async function sendInviteChallenge(
  userId: string,
  opponentId: string,
  wager: string,
  slateId?: string,
  slateName?: string
) {
  const params = new URLSearchParams({ userId, oppenentId: opponentId, wager });
  if (slateId) params.set('slateId', slateId);
  if (slateName) params.set('slateName', slateName);
  return axios.get(`${API_URL}/inviteChallenge?${params.toString()}`);
}

export async function updateInviteChallenge(userId: string, opponentId: string, action: string) {
  return axios.get(
    `${API_URL}/updateChallenge?userId=${userId}&oppenentId=${opponentId}&action=${action}`
  );
}

export async function addChat(userId: string, messageText: string, contestId?: string) {
  const params = new URLSearchParams({ userId, message: messageText });
  if (contestId) params.set('contestId', contestId);
  return axios.get(`${API_URL}/addChat?${params.toString()}`);
}

export async function searchUsers(displayName: string) {
  const { data } = await axios.get(
    `${API_URL}/searchUsers?display_name=${displayName}`
  );
  return data.data;
}
