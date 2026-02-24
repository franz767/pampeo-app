import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CanchaConSede } from '../services/canchas.service';

const DEFAULT_CANCHA_IMAGES = [
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600&q=70',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=70',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=70',
];

function getDefaultImage(id: string): string {
  // Use cancha id to consistently pick the same image
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  return DEFAULT_CANCHA_IMAGES[Math.abs(hash) % DEFAULT_CANCHA_IMAGES.length];
}

interface CanchaCardProps {
  cancha: CanchaConSede;
  onPress?: () => void;
  compact?: boolean;
}

export function CanchaCard({ cancha, onPress, compact = false }: CanchaCardProps) {
  const superficieLabel = {
    grass_natural: 'Grass Natural',
    grass_sintetico: 'Grass Sintetico',
    cemento: 'Cemento',
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {cancha.nombre}
          </Text>
          <Text style={styles.compactSede} numberOfLines={1}>
            {cancha.sede?.nombre}
          </Text>
          <View style={styles.compactFooter}>
            <Text style={styles.compactPrice}>S/{cancha.precio_hora}/h</Text>
            <View style={styles.compactBadge}>
              <Text style={styles.compactBadgeText}>{cancha.capacidad}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: cancha.foto_url || getDefaultImage(cancha.id) }}
          style={styles.image}
        />
        <View style={styles.capacityBadge}>
          <Text style={styles.capacityText}>{cancha.capacidad}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {cancha.nombre}
          </Text>
          <Text style={styles.price}>S/{cancha.precio_hora}/h</Text>
        </View>

        <Text style={styles.sede} numberOfLines={1}>
          {cancha.sede?.nombre} - {cancha.sede?.distrito}
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="leaf-outline" size={14} color="#6B7280" />
            <Text style={styles.featureText}>
              {superficieLabel[cancha.tipo_superficie]}
            </Text>
          </View>

          {cancha.tiene_iluminacion && (
            <View style={styles.feature}>
              <Ionicons name="bulb-outline" size={14} color="#6B7280" />
              <Text style={styles.featureText}>Iluminacion</Text>
            </View>
          )}

          {cancha.tiene_vestuarios && (
            <View style={styles.feature}>
              <Ionicons name="shirt-outline" size={14} color="#6B7280" />
              <Text style={styles.featureText}>Vestuarios</Text>
            </View>
          )}

          {cancha.tiene_estacionamiento && (
            <View style={styles.feature}>
              <Ionicons name="car-outline" size={14} color="#6B7280" />
              <Text style={styles.featureText}>Parking</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capacityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capacityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  sede: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Compact styles
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    gap: 4,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  compactSede: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  compactBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
});