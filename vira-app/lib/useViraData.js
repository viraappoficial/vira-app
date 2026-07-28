import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

export function useViraData(userId) {
  const [espacos, setEspacos] = useState({});
  const [tasks, setTasks] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const espacosList = useMemo(() => Object.values(espacos), [espacos]);

  const loadData = useCallback(async () => {
    const [espacosRes, tarefasRes, modelosRes] = await Promise.all([
      supabase.from('espacos').select('*'),
      supabase.from('tarefas').select('*').order('data_prevista', { ascending: true }),
      supabase.from('modelos').select('*'),
    ]);

    if (!espacosRes.error) {
      const map = {};
      espacosRes.data.forEach((e) => {
        map[e.id] = e;
      });
      setEspacos(map);
    }
    if (!tarefasRes.error) setTasks(tarefasRes.data);
    if (!modelosRes.error) setModelos(modelosRes.data);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function refresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function createTarefa({ titulo, descricao, espaco_id, prioridade, hora }) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        usuario_id: userId,
        titulo,
        descricao: descricao || null,
        espaco_id,
        prioridade,
        hora,
        status: 'fazer',
        data_prevista: hoje,
      })
      .select()
      .single();
    if (!error) setTasks((prev) => [...prev, data]);
    return { data, error };
  }

  async function createEspaco({ nome, cor, logo_url }) {
    const { data, error } = await supabase
      .from('espacos')
      .insert({ usuario_id: userId, nome, cor, logo_url: logo_url || null })
      .select()
      .single();
    if (!error) setEspacos((prev) => ({ ...prev, [data.id]: data }));
    return { data, error };
  }

  async function updateEspaco(espacoId, { nome, cor, logo_url }) {
    const payload = { nome, cor, logo_url: logo_url || null };
    setEspacos((prev) => ({ ...prev, [espacoId]: { ...prev[espacoId], ...payload } }));
    const { error } = await supabase.from('espacos').update(payload).eq('id', espacoId);
    if (error) await loadData();
    return { error };
  }

  async function deleteEspaco(espacoId) {
    await supabase.from('tarefas').update({ espaco_id: null }).eq('espaco_id', espacoId);
    const { error } = await supabase.from('espacos').delete().eq('id', espacoId);
    if (!error) {
      setEspacos((prev) => {
        const next = { ...prev };
        delete next[espacoId];
        return next;
      });
      setTasks((prev) => prev.map((t) => (t.espaco_id === espacoId ? { ...t, espaco_id: null } : t)));
    } else {
      await loadData();
    }
    return { error };
  }

  async function updateTarefa(taskId, { titulo, descricao, espaco_id, prioridade, hora, status }) {
    const concluido_em = status === 'concluido' ? new Date().toISOString() : null;
    const payload = { titulo, descricao: descricao || null, espaco_id, prioridade, hora, status, concluido_em };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...payload } : t)));
    const { error } = await supabase.from('tarefas').update(payload).eq('id', taskId);
    if (error) await loadData();
    return { error };
  }

  async function deleteTarefa(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error } = await supabase.from('tarefas').delete().eq('id', taskId);
    if (error) await loadData();
    return { error };
  }

  async function setTaskStatus(taskId, status) {
    const concluido_em = status === 'concluido' ? new Date().toISOString() : null;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, concluido_em } : t)));
    const { error } = await supabase.from('tarefas').update({ status, concluido_em }).eq('id', taskId);
    if (error) await loadData();
    return { error };
  }

  async function virarDia() {
    const hoje = new Date().toISOString().slice(0, 10);
    const paraAtrasar = tasks.filter(
      (t) => (t.status === 'fazer' || t.status === 'andamento') && t.data_prevista && t.data_prevista < hoje
    );
    if (paraAtrasar.length === 0) return;
    setTasks((prev) =>
      prev.map((t) => (paraAtrasar.some((p) => p.id === t.id) ? { ...t, status: 'atrasado' } : t))
    );
    await supabase
      .from('tarefas')
      .update({ status: 'atrasado' })
      .in('id', paraAtrasar.map((t) => t.id));
  }

  return {
    espacos,
    espacosList,
    tasks,
    modelos,
    loading,
    refreshing,
    refresh,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    createEspaco,
    updateEspaco,
    deleteEspaco,
    setTaskStatus,
    virarDia,
  };
}
