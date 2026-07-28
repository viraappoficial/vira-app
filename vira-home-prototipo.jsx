import React, { useState, useMemo } from "react";
import { Circle, Clock, CheckCircle2, AlertTriangle, Home as HomeIcon, Plus } from "lucide-react";

const COLORS = {
  bg: "#14161C",
  surface: "#1C1F28",
  border: "#2A2E3A",
  text: "#EDEFF4",
  textSecondary: "#8E93A3",
  accent: "#5B8CFF",
  accentSoft: "#233257",
  concluido: "#4FC98A",
  andamento: "#E8B84B",
  atrasado: "#F0644B",
  fazer: "#6B7180",
};

const ESPACOS = {
  prime: { nome: "Prime", cor: "#D9A544", tipo: "letra" },
  sehorbas: { nome: "Sehorbas", cor: "#3FAE72", tipo: "letra" },
  pessoal: { nome: "Pessoal", cor: "#8E93A3", tipo: "casa" },
};

const STATUS_CONFIG = {
  fazer: { color: COLORS.fazer, Icon: Circle },
  andamento: { color: COLORS.andamento, Icon: Clock },
  concluido: { color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { color: COLORS.atrasado, Icon: AlertTriangle },
};

const GREETINGS = [
  "Bom dia, Gabriel",
  "E aí, Gabriel",
  "Bora, Gabriel",
];

const SUBTITLES_COM_TAREFAS = [
  "Aqui está o que te espera hoje.",
  "Nada de bagunça — só o que importa hoje.",
  "Um de cada vez, sem pressa.",
];

const EMPTY_MESSAGES = ["Tudo em dia. Aproveita.", "Nada pendente. Respira.", "Zerou. Bom trabalho."];
const COMPLETE_MESSAGES = ["Boa.", "Feito.", "Isso aí."];

const initialTasks = [
  { id: "1", titulo: "Ligar pro fornecedor", espaco: "prime", hora: "09:00", status: "fazer" },
  { id: "2", titulo: "Revisar contrato de aluguel", espaco: "sehorbas", hora: "11:30", status: "atrasado" },
  { id: "3", titulo: "Levar carro na revisão", espaco: "pessoal", hora: null, status: "fazer" },
  { id: "4", titulo: "Fechar planilha do mês", espaco: "prime", hora: "14:00", status: "andamento" },
  { id: "5", titulo: "Buscar filho na escola", espaco: "pessoal", hora: "17:30", status: "fazer" },
];

function ViraLogo({ spinning, size = 26 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      style={{ transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}
    >
      <path d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4"
        fill="none" stroke={COLORS.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EspacoCapsula({ id }) {
  const e = ESPACOS[id];
  if (!e) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${e.cor}22`, color: e.cor }}
    >
      {e.tipo === "casa" ? <HomeIcon size={10} strokeWidth={2.5} /> : (
        <span className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: e.cor, color: COLORS.bg }}>
          {e.nome[0]}
        </span>
      )}
      {e.nome}
    </span>
  );
}

function TaskRow({ task, onToggle, justCompleted }) {
  const isDone = task.status === "concluido";
  const cfg = STATUS_CONFIG[task.status];
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 mb-2"
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${task.status === "atrasado" ? `${COLORS.atrasado}55` : COLORS.border}`,
        opacity: isDone ? 0.5 : 1,
        transform: justCompleted ? "scale(1.02)" : "scale(1)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="flex-shrink-0 active:scale-90 transition-transform"
        style={{ touchAction: "manipulation" }}
        aria-label="Concluir tarefa"
      >
        <cfg.Icon size={22} style={{ color: cfg.color }} strokeWidth={isDone ? 2.5 : 2} />
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{
            color: isDone ? COLORS.textSecondary : COLORS.text,
            textDecoration: isDone ? "line-through" : "none",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {task.titulo}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <EspacoCapsula id={task.espaco} />
          {task.hora && (
            <span className="text-[11px]" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
              {task.hora}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ViraHome() {
  const [tasks, setTasks] = useState(initialTasks);
  const [spinning, setSpinning] = useState(false);
  const [toast, setToast] = useState(null);
  const [justCompletedId, setJustCompletedId] = useState(null);

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const subtitleTarefas = useMemo(() => SUBTITLES_COM_TAREFAS[Math.floor(Math.random() * SUBTITLES_COM_TAREFAS.length)], []);
  const emptyMsg = useMemo(() => EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)], []);

  const dataHoje = useMemo(() => {
    const d = new Date("2026-07-27");
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }, []);

  function handleToggle(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const novoStatus = task.status === "concluido" ? "fazer" : "concluido";
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t)));
    if (novoStatus === "concluido") {
      setJustCompletedId(id);
      setSpinning(true);
      setToast(COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)]);
      setTimeout(() => setSpinning(false), 650);
      setTimeout(() => { setToast(null); setJustCompletedId(null); }, 1600);
    }
  }

  const pendentes = tasks.filter((t) => t.status !== "concluido");
  const atrasadas = tasks.filter((t) => t.status === "atrasado").length;
  const concluidas = tasks.filter((t) => t.status === "concluido").length;
  const ordenadas = [...tasks].sort((a, b) => {
    if (a.status === "concluido" && b.status !== "concluido") return 1;
    if (a.status !== "concluido" && b.status === "concluido") return -1;
    if (!a.hora) return 1;
    if (!b.hora) return -1;
    return a.hora.localeCompare(b.hora);
  });

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="max-w-md mx-auto px-5 py-7 pb-28">
        <div className="flex items-center gap-2 mb-1">
          <ViraLogo spinning={spinning} size={20} />
          <span className="text-xs uppercase tracking-wide" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
            {dataHoje}
          </span>
        </div>

        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {greeting}
        </h1>

        <p className="text-sm mb-5" style={{ color: COLORS.textSecondary }}>
          {pendentes.length > 0 ? subtitleTarefas : "Nada por aqui hoje."}
        </p>

        {/* chips de resumo */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-xs font-medium rounded-full px-3 py-1"
              style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent }}
            >
              {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}
            </span>
            {atrasadas > 0 && (
              <span
                className="text-xs font-medium rounded-full px-3 py-1"
                style={{ backgroundColor: `${COLORS.atrasado}22`, color: COLORS.atrasado }}
              >
                {atrasadas} atrasada{atrasadas !== 1 ? "s" : ""}
              </span>
            )}
            {concluidas > 0 && (
              <span
                className="text-xs font-medium rounded-full px-3 py-1"
                style={{ backgroundColor: `${COLORS.concluido}22`, color: COLORS.concluido }}
              >
                {concluidas} feita{concluidas !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 opacity-80">
            <ViraLogo spinning={false} size={40} />
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{emptyMsg}</p>
          </div>
        ) : (
          <div>
            {ordenadas.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} justCompleted={t.id === justCompletedId} />
            ))}
          </div>
        )}
      </div>

      {/* botão flutuante de captura rápida */}
      <button
        className="fixed bottom-6 right-6 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ width: 56, height: 56, backgroundColor: COLORS.accent, touchAction: "manipulation" }}
        aria-label="Nova tarefa"
      >
        <Plus size={26} color={COLORS.bg} strokeWidth={2.5} />
      </button>

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg"
          style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.concluido, fontFamily: "Inter, sans-serif" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
