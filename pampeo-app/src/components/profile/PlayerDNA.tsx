import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const POSITION_MAP: Record<string, { label: string; icon: string }> = {
  arquero: { label: 'Arquero', icon: 'hand-left-outline' },
  defensa: { label: 'Defensa', icon: 'shield-outline' },
  mediocampista: { label: 'Mediocampista', icon: 'swap-horizontal-outline' },
  delantero: { label: 'Delantero', icon: 'football-outline' },
};

interface PlayerDNAProps {
  posicion: string | null;
  zonaPreferida: string | null;
  onEdit?: () => void;
}

export default function PlayerDNA({ posicion, zonaPreferida, onEdit }: PlayerDNAProps) {
  const tags: { label: string; icon: string }[] = [];
  if (posicion) {
    const pos = POSITION_MAP[posicion];
    tags.push(pos || { label: posicion, icon: 'football-outline' });
  }
  if (zonaPreferida) {
    tags.push({ label: zonaPreferida, icon: 'arrow-forward-outline' });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ADN del Jugador</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editText}>Editar</Text>
            <Ionicons name="pencil" size={14} color={colors.greenPrimary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Ionicons name={tag.icon as any} size={16} color={colors.gray700} />
            <Text style={styles.tagText}>{tag.label}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.addTag}>
          <Ionicons name="add" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  addTag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});