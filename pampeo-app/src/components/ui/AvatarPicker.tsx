import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme';

interface AvatarPickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  disabled?: boolean;
}

export default function AvatarPicker({ imageUri, onImageSelected, disabled }: AvatarPickerProps) {
  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarCircle}
        onPress={handlePick}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={40} color={colors.gray400} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.title}>Sube tu foto de perfil</Text>
      <Text style={styles.subtitle}>Que tus compañeros te reconozcan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.gray50,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.greenPrimary,
  },
});
