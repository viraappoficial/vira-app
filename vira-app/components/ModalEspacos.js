import { Bell, BellOff, Home as HomeIcon, Plus, ShieldAlert, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ativarNotificacoes, desativarNotificacoes, notificacoesAtivas, pushSuportado, statusPermissao } from '../lib/push';
import { COLORS } from '../lib/theme';
import LegalScreen from '../screens/LegalScreen';

export default function ModalEspacos({
  visible,
  espacosList,
  nome,
  onSaveNome,
  userId,
  onClose,
  onSelect,
  onNew,
  onDeleteAccount,
}) {
  const [nomeInput, setNomeInput] = useState(nome || '');
  const [notifAtiva, setNotifAtiva] = useState(false);
  const [notifCarregando, setNotifCarregando] = useState(false);
  const [notifErro, setNotifErro] = useState(null);
  const [legalVisivel, setLegalVisivel] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [excluirErro, setExcluirErro] = useState(null);

  useEffect(() => {
    if (!visible || !pushSuportado()) return;
    notificacoesAtivas().then(setNotifAtiva);
  }, [visible]);

  if (!visible) return null;

  function handleBlurNome() {
    const trimmed = nomeInput.trim();
    if (trimmed && trimmed !== nome) onSaveNome(trimmed);
  }

  async function handleToggleNotif() {
    setNotifErro(null);
    setNotifCarregando(true);
    try {
      if (notifAtiva) {
        await desativarNotificacoes();
        setNotifAtiva(false);
      } else {
        await ativarNotificacoes(userId);
        setNotifAtiva(true);
      }
    } catch (err) {
      setNotifErro(err.message);
    } finally {
      setNotifCarregando(false);
    }
  }

  async function handleExcluirConta() {
    setExcluirErro(null);
    setExcluindo(true);
    try {
      await onDeleteAccount();
    } catch (err) {
      setExcluirErro(err.message || 'Não deu pra excluir agora. Tenta de novo.');
      setExcluindo(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Espaços</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.nomeField}>
          <Text style={styles.nomeLabel}>Como podemos te chamar?</Text>
          <TextInput
            value={nomeInput}
            onChangeText={setNomeInput}
            onBlur={handleBlurNome}
            placeholder="Seu nome"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.nomeInput}
          />
        </View>

        {pushSuportado() && (
          <View style={styles.notifField}>
            <Pressable style={styles.notifRow} onPress={handleToggleNotif} disabled={notifCarregando}>
              {notifAtiva ? (
                <Bell size={16} color={COLORS.accent} />
              ) : (
                <BellOff size={16} color={COLORS.textSecondary} />
              )}
              <View style={styles.notifTextBox}>
                <Text style={styles.notifLabel}>Notificações de horário</Text>
                <Text style={styles.notifSubtext}>
                  {statusPermissao() === 'denied'
                    ? 'Bloqueadas no navegador — libere nas configurações do site pra ativar.'
                    : notifAtiva
                    ? 'Ativadas neste dispositivo.'
                    : 'Avisa quando bater o horário de uma tarefa.'}
                </Text>
              </View>
              <View style={[styles.notifSwitch, notifAtiva && styles.notifSwitchOn]}>
                <View style={[styles.notifKnob, notifAtiva && styles.notifKnobOn]} />
              </View>
            </Pressable>
            {notifErro && <Text style={styles.notifErro}>{notifErro}</Text>}
          </View>
        )}

        {espacosList.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum espaço ainda — crie o primeiro abaixo.</Text>
        ) : (
          <View style={styles.list}>
            {espacosList.map((e) => (
              <Pressable key={e.id} onPress={() => onSelect(e)} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: `${e.cor}22` }]}>
                  {e.icone === 'casa' ? (
                    <HomeIcon size={14} color={e.cor} />
                  ) : (
                    <Text style={[styles.itemIconText, { color: e.cor }]}>{e.nome[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.itemText}>{e.nome}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={onNew} style={styles.newButton}>
          <Plus size={16} color={COLORS.accent} />
          <Text style={styles.newButtonText}>Novo espaço</Text>
        </Pressable>

        <Pressable onPress={() => setLegalVisivel(true)} style={styles.legalLink}>
          <Text style={styles.legalLinkText}>Privacidade e termos de uso</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          {!confirmandoExclusao ? (
            <Pressable onPress={() => setConfirmandoExclusao(true)} style={styles.dangerButton}>
              <ShieldAlert size={14} color={COLORS.atrasado} />
              <Text style={styles.dangerButtonText}>Excluir minha conta</Text>
            </Pressable>
          ) : (
            <View style={styles.dangerConfirmBox}>
              <Text style={styles.dangerConfirmText}>
                Isso apaga sua conta, espaços, tarefas e modelos pra sempre. Não tem como
                desfazer.
              </Text>
              {excluirErro && <Text style={styles.dangerErro}>{excluirErro}</Text>}
              <View style={styles.dangerConfirmRow}>
                <Pressable
                  onPress={() => setConfirmandoExclusao(false)}
                  style={styles.dangerCancelButton}
                  disabled={excluindo}
                >
                  <Text style={styles.dangerCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleExcluirConta}
                  style={styles.dangerConfirmButton}
                  disabled={excluindo}
                >
                  <Text style={styles.dangerConfirmButtonText}>
                    {excluindo ? 'Excluindo...' : 'Sim, excluir tudo'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>

      <LegalScreen visible={legalVisivel} onClose={() => setLegalVisivel(false)} />
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
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  nomeField: {
    marginBottom: 16,
  },
  nomeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  nomeInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  notifField: {
    marginBottom: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notifTextBox: {
    flex: 1,
    minWidth: 0,
  },
  notifLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  notifSubtext: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  notifSwitch: {
    width: 36,
    height: 20,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  notifSwitchOn: {
    backgroundColor: COLORS.accent,
  },
  notifKnob: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.text,
  },
  notifKnobOn: {
    transform: [{ translateX: 16 }],
  },
  notifErro: {
    color: COLORS.atrasado,
    fontSize: 11,
    marginTop: 6,
  },
  list: {
    gap: 8,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  newButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  legalLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  legalLinkText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  dangerZone: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dangerButtonText: {
    color: COLORS.atrasado,
    fontSize: 13,
    fontWeight: '500',
  },
  dangerConfirmBox: {
    gap: 10,
  },
  dangerConfirmText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  dangerErro: {
    color: COLORS.atrasado,
    fontSize: 12,
  },
  dangerConfirmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dangerCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  dangerConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.atrasado,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerConfirmButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
