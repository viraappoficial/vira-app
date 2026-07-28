import { Check, Upload, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

const CORES_SUGERIDAS = ['#D9A544', '#3FAE72', '#8E6FE8', '#E86F9C', '#5B8CFF', '#4FC98A'];

export default function ModalNovoEspaco({ visible, userId, onClose, onCreate }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setNome('');
      setCor(CORES_SUGERIDAS[0]);
      setLogoUrl(null);
    }
  }, [visible]);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    const ext = file.name?.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('espacos-logos').upload(path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (!error) {
      const { data } = supabase.storage.from('espacos-logos').getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function handleWebFileChange(e) {
    const file = e.target.files && e.target.files[0];
    handleUpload(file);
    e.target.value = '';
  }

  async function handleCriar() {
    if (!nome.trim() || saving) return;
    setSaving(true);
    await onCreate({ nome: nome.trim(), cor, logo_url: logoUrl });
    setSaving(false);
  }

  if (!visible) return null;

  const inicial = nome.trim() ? nome.trim()[0].toUpperCase() : '?';

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Novo espaço</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          <Pressable
            onPress={() => Platform.OS === 'web' && fileInputRef.current?.click()}
            style={[styles.preview, { backgroundColor: logoUrl ? 'transparent' : `${cor}22` }]}
          >
            {uploading ? (
              <ActivityIndicator color={cor} />
            ) : logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.previewImage} />
            ) : (
              <Text style={[styles.previewText, { color: cor }]}>{inicial}</Text>
            )}
          </Pressable>

          {Platform.OS === 'web' && (
            <>
              {/* @ts-ignore — input HTML nativo, disponível via react-native-web */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleWebFileChange}
                style={{ display: 'none' }}
              />
              <Pressable onPress={() => fileInputRef.current?.click()} style={styles.uploadButton}>
                <Upload size={12} color={COLORS.accent} />
                <Text style={styles.uploadButtonText}>{logoUrl ? 'Trocar logotipo' : 'Subir logotipo'}</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.previewHint}>Opcional — sem logo, usamos a inicial do nome</Text>
        </View>

        <Text style={styles.label}>Nome do espaço</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Prime, Sehorbas..."
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Cor</Text>
        <View style={styles.coresRow}>
          {CORES_SUGERIDAS.map((c) => (
            <Pressable key={c} onPress={() => setCor(c)} style={[styles.corSwatch, { backgroundColor: c }]}>
              {cor === c && <Check size={13} color={COLORS.bg} strokeWidth={3} />}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleCriar}
          disabled={!nome.trim() || saving}
          style={[styles.button, (!nome.trim() || saving) && styles.buttonDisabled]}
        >
          {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.buttonText}>Criar espaço</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxWidth: 380,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: 72,
    height: 72,
  },
  previewText: {
    fontSize: 26,
    fontWeight: '700',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadButtonText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  previewHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 220,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 20,
  },
  coresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  corSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
});
