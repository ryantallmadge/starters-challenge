import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../theme';
import type { AvailableSlate } from '../types';

const SPORT_CONFIG: Record<string, { icon: string; gradient: readonly [string, string]; accent: string }> = {
  nba: {
    icon: 'sports-basketball',
    gradient: ['#FF6B35', '#FF3D00'] as const,
    accent: '#FFB74D',
  },
  nfl: {
    icon: 'sports-football',
    gradient: ['#2E7D32', '#1B5E20'] as const,
    accent: '#81C784',
  },
  mlb: {
    icon: 'sports-baseball',
    gradient: ['#C62828', '#B71C1C'] as const,
    accent: '#EF9A9A',
  },
  nhl: {
    icon: 'sports-hockey',
    gradient: ['#1565C0', '#0D47A1'] as const,
    accent: '#64B5F6',
  },
  ncaafb: {
    icon: 'sports-football',
    gradient: ['#6A1B9A', '#4A148C'] as const,
    accent: '#CE93D8',
  },
  daily_free: {
    icon: 'star',
    gradient: ['#FFD700', '#FF8F00'] as const,
    accent: '#FFF8E1',
  },
  default: {
    icon: 'sports',
    gradient: [Colors.primaryBlue, Colors.primaryBlueLight] as const,
    accent: '#90CAF9',
  },
};

function getSportConfig(sport: string) {
  return SPORT_CONFIG[sport.toLowerCase()] || SPORT_CONFIG.default;
}

function formatTimeUntil(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start.getTime() - now.getTime();

  if (diff <= 0) return 'Live Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function isUnderOneHour(startTime: string): boolean {
  const diff = new Date(startTime).getTime() - Date.now();
  return diff > 0 && diff < 60 * 60 * 1000;
}

interface SlateCardProps {
  slate: AvailableSlate;
  onPress: (slate: AvailableSlate) => void;
  entered?: boolean;
}

export default function SlateCard({ slate, onPress, entered }: SlateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDailyFree = slate.slate_type === 'daily_free';
  const config = isDailyFree ? SPORT_CONFIG.daily_free : getSportConfig(slate.sport);
  const tierCount = slate.tiers?.length || 0;

  useEffect(() => {
    function check() {
      if (isUnderOneHour(slate.start_time)) {
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
        }
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    check();
    const hourCheck = setInterval(check, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(hourCheck);
    };
  }, [slate.start_time]);

  const handlePreview = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(slate)}>
        <LinearGradient
          colors={[config.gradient[0], config.gradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, expanded && styles.cardExpanded]}
        >
          <View style={styles.topRow}>
            {isDailyFree ? (
              <View style={[styles.sportBadge, styles.dailyFreeBadge]}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={[styles.sportText, styles.dailyFreeBadgeText]}>DAILY FREE</Text>
              </View>
            ) : (
              <View style={[styles.sportBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name={config.icon as any} size={16} color={Colors.white} />
                <Text style={styles.sportText}>{slate.sport.toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.timeBadge, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <MaterialIcons name="schedule" size={13} color={config.accent} />
              <Text style={[styles.timeText, { color: config.accent }]}>
                {formatTimeUntil(slate.start_time)}
              </Text>
            </View>
          </View>

          <Text style={styles.name} numberOfLines={2}>{slate.name}</Text>
          <Text style={styles.description} numberOfLines={2}>{slate.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <MaterialIcons name="event" size={14} color={Colors.white} />
              <Text style={styles.statText}>
                {slate.game_count || 0} Game{(slate.game_count || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.statPill}>
              <MaterialIcons name="layers" size={14} color={Colors.white} />
              <Text style={styles.statText}>
                {tierCount} Tier{tierCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.statPill}>
              <MaterialIcons name="group" size={14} color={Colors.white} />
              <Text style={styles.statText}>
                {slate.entry_count || 0}{slate.max_entries ? `/${slate.max_entries}` : ''}
              </Text>
            </View>
          </View>

          {isDailyFree ? (
            <View style={styles.coinRow}>
              <View style={[styles.coinPill, styles.dailyFreeEntryPill]}>
                <MaterialIcons name="lock-open" size={14} color="#4CAF50" />
                <Text style={[styles.coinText, { color: '#4CAF50' }]}>FREE ENTRY</Text>
              </View>
              <View style={[styles.coinPill, styles.dailyFreePayoutPill]}>
                <MaterialIcons name="emoji-events" size={14} color="#FFD700" />
                <Text style={styles.coinText}>WIN {slate.payout} COINS</Text>
              </View>
            </View>
          ) : (slate.entry_cost || slate.payout) ? (
            <View style={styles.coinRow}>
              {slate.entry_cost ? (
                <View style={styles.coinPill}>
                  <MaterialIcons name="toll" size={14} color="#FFD700" />
                  <Text style={styles.coinText}>{slate.entry_cost} to enter</Text>
                </View>
              ) : null}
              {slate.payout ? (
                <View style={[styles.coinPill, styles.coinPillPayout]}>
                  <MaterialIcons name="emoji-events" size={14} color="#FFD700" />
                  <Text style={styles.coinText}>Win {slate.payout}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={(e) => {
                e.stopPropagation?.();
                handlePreview();
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name={expanded ? 'expand-less' : 'visibility'} size={16} color={Colors.white} />
              <Text style={styles.previewText}>
                {expanded ? 'HIDE' : 'PREVIEW'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.joinRow, entered && styles.joinRowEntered]}>
              {entered ? (
                <>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={[styles.joinText, styles.joinTextEntered]}>ENTERED</Text>
                </>
              ) : (
                <>
                  <Text style={styles.joinText}>TAP TO JOIN</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.white} />
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.previewPanel, { borderColor: config.gradient[1] }]}>
          {(slate.tiers || []).map((tier, tierIdx) => {
            const playerIds = tier.players || [];
            return (
              <View key={tierIdx} style={styles.tierBlock}>
                <View style={styles.tierHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: config.gradient[0] }]}>
                    <Text style={styles.tierBadgeText}>R{tierIdx + 1}</Text>
                  </View>
                  <Text style={styles.tierQuestion} numberOfLines={2}>
                    {tier.question || tier.key_stat || `Round ${tierIdx + 1}`}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.playerRow}
                >
                  {playerIds.map((pid) => {
                    const player = slate.players?.[pid];
                    if (!player) return null;
                    const displayName = player.name
                      || [player.first_name, player.last_name].filter(Boolean).join(' ')
                      || pid;
                    return (
                      <View key={pid} style={styles.playerChip}>
                        {player.thumbnail ? (
                          <Image source={{ uri: player.thumbnail }} style={styles.playerThumb} />
                        ) : (
                          <View style={[styles.playerThumbPlaceholder, { backgroundColor: config.gradient[0] }]}>
                            <Text style={styles.playerInitial}>
                              {(player.first_name || displayName)[0]}
                            </Text>
                          </View>
                        )}
                        <View style={styles.playerInfo}>
                          <Text style={styles.playerName} numberOfLines={1}>{displayName}</Text>
                          <View style={styles.playerMeta}>
                            <Text style={styles.playerTeam}>
                              {player.team_abrev || player.team || ''}
                            </Text>
                            {player.key_stat ? (
                              <Text style={styles.playerStat}>{player.key_stat}</Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                {tierIdx < (slate.tiers?.length || 0) - 1 && <View style={styles.tierDivider} />}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  sportText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  timeText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.xs,
  },
  name: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.title,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: 30,
    marginBottom: 4,
  },
  description: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.xs,
    color: Colors.white,
  },
  coinRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  coinPillPayout: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  dailyFreeBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  dailyFreeBadgeText: {
    color: '#FFF8E1',
    letterSpacing: 2,
  },
  dailyFreeEntryPill: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
  },
  dailyFreePayoutPill: {
    backgroundColor: 'rgba(255,215,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  coinText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.xs,
    color: '#FFD700',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 5,
  },
  previewText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
    letterSpacing: 1,
  },
  joinRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  joinText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
    letterSpacing: 2,
  },
  joinRowEntered: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  joinTextEntered: {
    color: '#4CAF50',
  },

  // Preview panel
  previewPanel: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 2,
    borderTopWidth: 0,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  tierBlock: {
    marginBottom: 6,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  tierBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xs,
    color: Colors.white,
  },
  tierQuestion: {
    flex: 1,
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.md,
    color: Colors.backgroundDark,
  },
  playerRow: {
    gap: 8,
    paddingBottom: 4,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 10,
    padding: 6,
    paddingRight: 12,
    gap: 8,
    minWidth: 140,
  },
  playerThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutralLight,
  },
  playerThumbPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  playerInfo: {
    flexShrink: 1,
  },
  playerName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    color: Colors.backgroundDark,
  },
  playerMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  playerTeam: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
  },
  playerStat: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.xs,
    color: Colors.primaryBlue,
  },
  tierDivider: {
    height: 1,
    backgroundColor: Colors.neutralLight,
    marginVertical: 8,
  },
});
