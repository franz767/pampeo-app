import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface MatchHistoryCardProps {
  opponent: string;
  date: string;
  venue: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
  teamColor?: string;
  teamInitial?: string;
}

const RESULT_LABELS: Record<string, { text: string; color: string }> = {
  win: { text: 'WIN', color: colors.greenPrimary },
  loss: { text: 'LOSS', color: colors.red },
  draw: { text: 'DRAW', color: colors.gray500 },
};

const TEAM_COLORS = ['#1E3A5F', '#2D4A3E', '#4A2D5E', '#5E3A2D', '#2D3A5E'];

export default function MatchHistoryCard({
  opponent,
  date,
  venue,
  result,
  score,
  teamColor,
  teamInitial,
}: MatchHistoryCardProps) {
  const resultInfo = RESULT_LABELS[result];
  const bgColor = teamColor || TEAM_COLORS[opponent.length % TEAM_COLORS.length];
  const initial = teamInitial || opponent.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={[styles.teamLogo, { backgroundColor: bgColor }]}>
        <Text style={styles.teamInitial}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.opponent}>vs. {opponent}</Text>
        <Text style={styles.details}>{date} • {venue}</Text>
      </View>
      <View style={styles.resultContainer}>
        <Text style={[styles.resultLabel, { color: resultInfo.color }]}>
          {resultInfo.text}
        </Text>
        <Text style={styles.score}>{score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: 10,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  info: {
    flex: 1,
  },
  opponent: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: colors.gray400,
  },
  resultContainer: {
    alignItems: 'flex-end',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray900,
  },
});