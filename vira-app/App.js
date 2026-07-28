import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Home as HomeIcon, LayoutGrid, Plus, Settings } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ModalEspacos from './components/ModalEspacos';
import ModalNovaTarefa from './components/ModalNovaTarefa';
import ModalNovoEspaco from './components/ModalNovoEspaco';
import ViraLogo from './components/ViraLogo';
import { useViraData } from './lib/useViraData';
import { supabase } from './lib/supabase';
import { COLORS } from './lib/theme';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import KanbanScreen from './screens/KanbanScreen';
import OnboardingScreen from './screens/OnboardingScreen';

function MainApp({ session }) {
  const [tela, setTela] = useState('home');
  const [taskModal, setTaskModal] = useState(undefined); // undefined = fechado, null = criar, task = editar
  const [espacosListVisible, setEspacosListVisible] = useState(false);
  const [espacoModal, setEspacoModal] = useState(undefined); // undefined = fechado, null = criar, espaco = editar
  const [onboardingSeen, setOnboardingSeen] = useState(undefined);
  const userName = session.user.email.split('@')[0];
  const data = useViraData(session.user.id);
  const onboardingKey = `vira_onboarding_seen_${session.user.id}`;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 720;

  useEffect(() => {
    AsyncStorage.getItem(onboardingKey).then((v) => setOnboardingSeen(!!v));
  }, [onboardingKey]);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [tela, fadeAnim, slideAnim]);

  async function handleToggleHome(task) {
    const novoStatus = task.status === 'concluido' ? 'fazer' : 'concluido';
    await data.setTaskStatus(task.id, novoStatus);
  }

  async function handleOnboardingCreateTasks(tarefasTexto) {
    for (const titulo of tarefasTexto) {
      await data.createTarefa({ titulo, espaco_id: null, prioridade: 'media', hora: null });
    }
  }

  async function handleOnboardingDone() {
    await AsyncStorage.setItem(onboardingKey, '1');
    setOnboardingSeen(true);
  }

  if (data.loading || onboardingSeen === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (!onboardingSeen) {
    return <OnboardingScreen onCreateTasks={handleOnboardingCreateTasks} onDone={handleOnboardingDone} />;
  }

  return (
    <View style={styles.appContainer}>
      <View
        style={[
          styles.topBar,
          isWide && (tela === 'kanban' ? styles.topBarWideKanban : styles.topBarWideHome),
        ]}
      >
        <View style={styles.topBarLeft}>
          <ViraLogo size={18} />
          <Text style={styles.brand}>vira</Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable onPress={() => setEspacosListVisible(true)} hitSlop={8}>
            <Settings size={16} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable onPress={() => supabase.auth.signOut()}>
            <Text style={styles.signOut}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[styles.screenArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {tela === 'home' ? (
          <HomeScreen
            userName={userName}
            tasks={data.tasks}
            espacos={data.espacos}
            refreshing={data.refreshing}
            onRefresh={data.refresh}
            onToggle={handleToggleHome}
            onEditTask={setTaskModal}
          />
        ) : (
          <KanbanScreen
            tasks={data.tasks}
            espacos={data.espacos}
            onSetStatus={data.setTaskStatus}
            onVirarDia={data.virarDia}
            onEditTask={setTaskModal}
          />
        )}
      </Animated.View>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => setTela('home')}>
          <HomeIcon size={20} color={tela === 'home' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navLabel, { color: tela === 'home' ? COLORS.accent : COLORS.textSecondary }]}>
            Hoje
          </Text>
        </Pressable>

        <Pressable style={styles.fab} onPress={() => setTaskModal(null)}>
          <Plus size={24} color={COLORS.bg} strokeWidth={2.5} />
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => setTela('kanban')}>
          <LayoutGrid size={20} color={tela === 'kanban' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navLabel, { color: tela === 'kanban' ? COLORS.accent : COLORS.textSecondary }]}>
            Board
          </Text>
        </Pressable>
      </View>

      <ModalNovaTarefa
        visible={taskModal !== undefined}
        task={taskModal}
        espacosList={data.espacosList}
        modelosList={data.modelos}
        onClose={() => setTaskModal(undefined)}
        onCreate={async (payload) => {
          const { error } = await data.createTarefa(payload);
          if (!error) setTaskModal(undefined);
        }}
        onUpdate={async (id, payload) => {
          const { error } = await data.updateTarefa(id, payload);
          if (!error) setTaskModal(undefined);
        }}
        onDelete={async (id) => {
          const { error } = await data.deleteTarefa(id);
          if (!error) setTaskModal(undefined);
        }}
      />

      <ModalEspacos
        visible={espacosListVisible}
        espacosList={data.espacosList}
        onClose={() => setEspacosListVisible(false)}
        onSelect={(e) => {
          setEspacosListVisible(false);
          setEspacoModal(e);
        }}
        onNew={() => {
          setEspacosListVisible(false);
          setEspacoModal(null);
        }}
      />

      <ModalNovoEspaco
        visible={espacoModal !== undefined}
        espaco={espacoModal}
        userId={session.user.id}
        onClose={() => setEspacoModal(undefined)}
        onBack={() => {
          setEspacoModal(undefined);
          setEspacosListVisible(true);
        }}
        onCreate={async (payload) => {
          const { error } = await data.createEspaco(payload);
          if (!error) setEspacoModal(undefined);
        }}
        onUpdate={async (id, payload) => {
          const { error } = await data.updateEspaco(id, payload);
          if (!error) setEspacoModal(undefined);
        }}
        onDelete={async (id) => {
          const { error } = await data.deleteEspaco(id);
          if (!error) setEspacoModal(undefined);
        }}
      />
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <MainApp session={session} />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  topBarWideKanban: {
    maxWidth: 1100,
  },
  topBarWideHome: {
    maxWidth: 720,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  signOut: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  screenArea: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
