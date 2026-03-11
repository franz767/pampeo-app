import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface RoleCardProps {
  title: string;
  description: string;
  imageSource: any;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  compact?: boolean;
}

export default function RoleCard({
  title,
  description,
  imageSource,
  selected,
  onPress,
  icon,
  compact,
}: RoleCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.container,
        compact && styles.containerCompact,
        selected && styles.containerSelected,
      ]}
    >
      <ImageBackground
        source={imageSource}
        style={styles.imageBg}
        imageStyle={compact ? styles.imageStyleCompact : styles.imageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.88)']}
          style={[styles.gradient, compact && styles.gradientCompact]}
        >
          {/* Selected checkmark */}
          {selected && (
            <View style={[styles.checkBadge, compact && styles.checkBadgeCompact]}>
              <Ionicons name="checkmark" size={compact ? 14 : 16} color={colors.white} />
            </View>
          )}

          <View style={styles.content}>
            {icon && (
              <View style={[styles.iconBox, compact && styles.iconBoxCompact]}>
                <Ionicons name={icon as any} size={compact ? 18 : 22} color={colors.white} />
              </View>
            )}
            <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
            <Text style={[styles.description, compact && styles.descriptionCompact]}>{description}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  containerCompact: {
    height: 220,
    borderRadius: 16,
    marginBottom: 0,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  containerSelected: {
    borderColor: colors.greenPrimary,
  },
  imageBg: {
    flex: 1,
  },
  imageStyle: {
    borderRadius: 17,
  },
  imageStyleCompact: {
    borderRadius: 13,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
  },
  gradientCompact: {
    padding: 14,
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkBadgeCompact: {
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  content: {
    gap: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBoxCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  descriptionCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
