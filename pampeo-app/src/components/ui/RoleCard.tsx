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
}

export default function RoleCard({
  title,
  description,
  imageSource,
  selected,
  onPress,
  icon,
}: RoleCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, selected && styles.containerSelected]}
    >
      <ImageBackground
        source={imageSource}
        style={styles.imageBg}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          {/* Selected checkmark */}
          {selected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={16} color={colors.white} />
            </View>
          )}

          <View style={styles.content}>
            {icon && (
              <View style={styles.iconBox}>
                <Ionicons name={icon as any} size={22} color={colors.white} />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
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
  containerSelected: {
    borderColor: colors.greenPrimary,
  },
  imageBg: {
    flex: 1,
  },
  imageStyle: {
    borderRadius: 17,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
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
  content: {
    gap: 6,
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
});
