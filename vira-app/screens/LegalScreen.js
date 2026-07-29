import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../lib/theme';

const ATUALIZADO_EM = '29 de julho de 2026';

function Paragrafo({ children }) {
  return <Text style={styles.p}>{children}</Text>;
}

function Titulo({ children }) {
  return <Text style={styles.h2}>{children}</Text>;
}

function Privacidade() {
  return (
    <>
      <Paragrafo>
        O Vira existe pra te ajudar a organizar seu dia, e isso significa guardar algumas
        informações suas. Aqui explicamos quais, pra quê, e o que você pode fazer a respeito.
      </Paragrafo>

      <Titulo>1. Quais dados guardamos</Titulo>
      <Paragrafo>
        • Cadastro: seu e-mail e senha (a senha nunca fica visível pra nós — o Supabase, nosso
        provedor de autenticação, guarda ela de forma criptografada).{'\n'}
        • Perfil: nome e área de atuação, se você preencher.{'\n'}
        • Uso do app: os espaços, tarefas e modelos que você cria — título, descrição, horário,
        prioridade, status.{'\n'}
        • Notificações: se você ativar avisos push, guardamos um identificador técnico do seu
        navegador/dispositivo pra poder te enviar o aviso (não é seu nome nem e-mail).
      </Paragrafo>

      <Titulo>2. Pra que usamos</Titulo>
      <Paragrafo>
        Só pra fazer o Vira funcionar: mostrar suas tarefas, te avisar no horário certo, e (se
        você usar o Secretário, o Resumo do dia ou o Quebrar tarefa) mandar o texto da tarefa
        pra uma inteligência artificial gerar uma sugestão. Não vendemos, alugamos ou usamos
        seus dados pra anúncios.
      </Paragrafo>

      <Titulo>3. Com quem compartilhamos</Titulo>
      <Paragrafo>
        • Supabase (banco de dados e autenticação) — guarda tudo listado acima.{'\n'}
        • Vercel — hospeda o site do Vira.{'\n'}
        • Google Gemini — quando você usa o Secretário, o Resumo do dia ou o Quebrar tarefa, o
        título/descrição da tarefa (e seu nome e área de atuação, pra a IA entender melhor o
        contexto) é enviado pra API do Gemini gerar a resposta. Isso só acontece nessas três
        funções, e só com o texto que você mesmo digitou.{'\n'}
        Nenhum desses parceiros pode usar seus dados pra outra coisa que não seja rodar o Vira.
      </Paragrafo>

      <Titulo>4. Por quanto tempo guardamos</Titulo>
      <Paragrafo>
        Enquanto sua conta existir. Se você excluir sua conta, apagamos seu perfil, seus
        espaços, tarefas, modelos e inscrições de notificação — veja a seção 6.
      </Paragrafo>

      <Titulo>5. Segurança</Titulo>
      <Paragrafo>
        Cada conta só enxerga os próprios dados (controlado no banco, não só na tela). As
        chaves e segredos técnicos do app não ficam expostos no código publicado. Mesmo assim,
        nenhum sistema é 100% infalível — se você notar algo estranho na sua conta, nos avise.
      </Paragrafo>

      <Titulo>6. Seus direitos (LGPD)</Titulo>
      <Paragrafo>
        Você pode, a qualquer momento:{'\n'}
        • Ver e corrigir seus dados — direto no app, editando seu perfil ou tarefas.{'\n'}
        • Pedir a exclusão da sua conta e de todos os seus dados — em Espaços (ícone de
        engrenagem) → Excluir minha conta. A exclusão é imediata e não tem volta.{'\n'}
        • Desativar as notificações push a qualquer momento, no mesmo lugar.{'\n'}
        • Falar com a gente sobre qualquer dúvida de privacidade pelo e-mail de contato do app.
      </Paragrafo>

      <Titulo>7. Mudanças nesta política</Titulo>
      <Paragrafo>
        Se algo mudar de forma relevante (por exemplo, um novo parceiro que processa dados),
        vamos atualizar esta página e, se for uma mudança importante, avisar dentro do app.
      </Paragrafo>

      <Text style={styles.atualizado}>Atualizado em {ATUALIZADO_EM}.</Text>
    </>
  );
}

function Termos() {
  return (
    <>
      <Paragrafo>
        Ao criar uma conta no Vira, você concorda com os termos abaixo. É um texto curto de
        propósito — sem letrinha miúda escondendo pegadinha.
      </Paragrafo>

      <Titulo>1. O que é o Vira</Titulo>
      <Paragrafo>
        Um app pessoal de organização de tarefas e agenda, com alguns recursos de inteligência
        artificial (Secretário, Resumo do dia, Quebrar tarefa) que ajudam a criar e organizar
        tarefas a partir do que você escreve.
      </Paragrafo>

      <Titulo>2. Sua conta</Titulo>
      <Paragrafo>
        Você é responsável por manter sua senha em segurança e pelo que é feito na sua conta.
        Se desconfiar de acesso indevido, troque a senha imediatamente (Esqueci minha senha, na
        tela de login).
      </Paragrafo>

      <Titulo>3. Uso aceitável</Titulo>
      <Paragrafo>
        O Vira é pra uso pessoal de organização. Não use o app pra armazenar conteúdo ilegal,
        nem tente sobrecarregar, invadir ou automatizar acesso indevido ao sistema.
      </Paragrafo>

      <Titulo>4. Recursos de inteligência artificial</Titulo>
      <Paragrafo>
        As sugestões geradas pelo Secretário, Resumo do dia e Quebrar tarefa são um auxílio, não
        uma garantia — revise antes de confiar cegamente numa sugestão importante. O conteúdo
        que você digita nessas funções é enviado a um provedor de IA externo (Google Gemini)
        só pra gerar a resposta, como explicado na Política de Privacidade.
      </Paragrafo>

      <Titulo>5. Disponibilidade</Titulo>
      <Paragrafo>
        Fazemos o possível pra manter o Vira no ar, mas é um app em desenvolvimento contínuo —
        pode ter manutenções, instabilidades ou mudanças de funcionalidade sem aviso prévio.
      </Paragrafo>

      <Titulo>6. Encerramento</Titulo>
      <Paragrafo>
        Você pode excluir sua conta quando quiser (Espaços → Excluir minha conta). Podemos
        suspender contas que violem o uso aceitável descrito acima.
      </Paragrafo>

      <Titulo>7. Contato</Titulo>
      <Paragrafo>
        Dúvidas sobre estes termos ou sobre seus dados? Fale com a gente pelo e-mail de contato
        do app.
      </Paragrafo>

      <Text style={styles.atualizado}>Atualizado em {ATUALIZADO_EM}.</Text>
    </>
  );
}

export default function LegalScreen({ visible, initialAba = 'privacidade', onClose }) {
  const [aba, setAba] = useState(initialAba);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={styles.tabs}>
            <Pressable onPress={() => setAba('privacidade')} style={styles.tabButton}>
              <Text style={[styles.tabText, aba === 'privacidade' && styles.tabTextAtiva]}>
                Privacidade
              </Text>
            </Pressable>
            <Pressable onPress={() => setAba('termos')} style={styles.tabButton}>
              <Text style={[styles.tabText, aba === 'termos' && styles.tabTextAtiva]}>Termos</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {aba === 'privacidade' ? <Privacidade /> : <Termos />}
        </ScrollView>
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
    justifyContent: 'center',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    maxWidth: 480,
    width: '92%',
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextAtiva: {
    color: COLORS.text,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  h2: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  p: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  atualizado: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
