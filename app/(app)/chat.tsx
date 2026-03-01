import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import { useContestStore } from '../../src/stores/contestStore';
import { useUserStore } from '../../src/stores/userStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';

export default function ChatScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);
  const activeContestId = useContestStore((s) => s.activeContestId);
  const { messages, setMessages, sendMessage } = useChatStore();

  const contest = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;
  const opponent = contest?.oppenent;

  useEffect(() => {
    const chats = contest?.chats || [];
    setMessages(chats);
  }, [contest?.chats]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!authUser) return;
      for (const msg of newMessages) {
        sendMessage(authUser.uid, {
          _id: msg._id as string,
          text: msg.text,
          createdAt: msg.createdAt as Date,
          user: { _id: authUser.uid, name: user?.display_name },
        }, activeContestId || undefined);
      }
    },
    [authUser?.uid, user?.display_name, activeContestId]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitleText}>CHAT WITH</Text>
        <Text style={styles.headerName}>{opponent?.display_name || 'Opponent'}</Text>
        <TouchableOpacity style={styles.backIconTouch} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <GiftedChat
        messages={messages as IMessage[]}
        onSend={onSend}
        user={{ _id: authUser?.uid || '' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  header: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: Colors.backgroundDark,
  },
  headerTitleText: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  headerName: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxxl,
    color: Colors.white,
  },
  backIconTouch: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
});
