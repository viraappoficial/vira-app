import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';

export function useViraData(userId) {
  const [espacos, setEspacos] = useState({});
  const [tasks, setTasks] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diaViradoCount, setDiaViradoCount] = useState(0);
  const ultimoDiaRef = useRef(new Date().toISOString().slice(0, 10));

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

  async function createTarefa({ titulo, descricao, espaco_id, prioridade, hora, data_prevista }) {
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
        data_prevista: data_prevista || hoje,
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

  async function updateTarefa(taskId, { titulo, descricao, espaco_id, prioridade, hora, status, data_prevista }) {
    const concluido_em = status === 'concluido' ? new Date().toISOString() : null;
    const payload = {
      titulo,
      descricao: descricao || null,
      espaco_id,
      prioridade,
      hora,
      status,
      concluido_em,
      data_prevista,
    };
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

  async function createModelo({ titulo_padrao, espaco_id, hora_padrao }) {
    const { data, error } = await supabase
      .from('modelos')
      .insert({ usuario_id: userId, titulo_padrao, espaco_id, hora_padrao: hora_padrao || null })
      .select()
      .single();
    if (!error) setModelos((prev) => [...prev, data]);
    return { data, error };
  }

  async function deleteModelo(modeloId) {
    setModelos((prev) => prev.filter((m) => m.id !== modeloId));
    const { error } = await supabase.from('modelos').delete().eq('id', modeloId);
    if (error) await loadData();
    return { error };
  }

  const virarDia = useCallback(async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    let count = 0;
    setTasks((prev) => {
      const paraAtrasar = prev.filter(
        (t) => (t.status === 'fazer' || t.status === 'andamento') && t.data_prevista && t.data_prevista < hoje
      );
      count = paraAtrasar.length;
      if (count === 0) return prev;
      const ids = paraAtrasar.map((t) => t.id);
      ids.forEach((id) => {
        const atual = prev.find((t) => t.id === id)?.vezes_adiada || 0;
        supabase
          .from('tarefas')
          .update({ status: 'atrasado', vezes_adiada: atual + 1 })
          .eq('id', id);
      });
      return prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'atrasado', vezes_adiada: (t.vezes_adiada || 0) + 1 } : t));
    });
    return count;
  }, []);

  // Vira o dia sozinho: ao carregar e, se o app ficar aberto, checa a cada minuto
  // se a data mudou (sem depender de fechar/abrir o app de novo).
  useEffect(() => {
    if (loading) return undefined;

    virarDia().then((count) => {
      if (count > 0) setDiaViradoCount((v) => v + count);
    });

    const interval = setInterval(() => {
      const hoje = new Date().toISOString().slice(0, 10);
      if (hoje !== ultimoDiaRef.current) {
        ultimoDiaRef.current = hoje;
        virarDia().then((count) => {
          if (count > 0) setDiaViradoCount((v) => v + count);
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loading, virarDia]);

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
    createModelo,
    deleteModelo,
    setTaskStatus,
    virarDia,
    diaViradoCount,
  };
}
