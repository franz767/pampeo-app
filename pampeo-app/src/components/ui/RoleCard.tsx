import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface RoleCardProps {
  title: string;
  description: string;
  imageSource: any;
  selected: boolean;
  onPress: () => void;
}

export default function RoleCard({
  title,
  description,
  imageSource,
  selected,
  onPress,
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
      {selected && <View style={styles.selectedBorder} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: colors.greenPrimary,
  },
  imageBg: {
    flex: 1,
  },
  imageStyle: {
    borderRadius: 14,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.greenPrimary,
  },
});
