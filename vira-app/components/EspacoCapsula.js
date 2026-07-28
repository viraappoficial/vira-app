import { Home as HomeIcon } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../lib/theme';

export default function EspacoCapsula({ espaco, small }) {
  if (!espaco) return null;

  return (
    <View
      style={[
        styles.container,
        small && styles.containerSmall,
        { backgroundColor: `${espaco.cor}22` },
      ]}
    >
      {espaco.logo_url ? (
        <Image source={{ uri: espaco.logo_url }} style={styles.logo} />
      ) : espaco.icone === 'casa' ? (
        <HomeIcon size={10} color={espaco.cor} strokeWidth={2.5} />
      ) : (
        <View style={[styles.dot, { backgroundColor: espaco.cor }]}>
          <Text style={styles.dotText}>{espaco.nome[0]?.toUpperCase()}</Text>
        </View>
      )}
      <Text style={[styles.label, { color: espaco.cor }]}>{espaco.nome}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  containerSmall: {
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  logo: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 7,
    fontWeight: '700',
    color: COLORS.bg,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
