import React, { useState, useRef, useMemo, useEffect } from "react";
import { Circle, Clock, CheckCircle2, AlertTriangle, Home } from "lucide-react";

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

const STATUS_ORDER = ["fazer", "andamento", "concluido", "atrasado"];

const STATUS_CONFIG = {
  fazer: { label: "A fazer", color: COLORS.fazer, Icon: Circle },
  andamento: { label: "Em andamento", color: COLORS.andamento, Icon: Clock },
  concluido: { label: "Concluído", color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: "Atrasado", color: COLORS.atrasado, Icon: AlertTriangle },
};

const EMPTY_MESSAGES = ["Tudo em dia. Aproveita.", "Nada pendente. Respira.", "Zerou. Bom trabalho."];
const COMPLETE_MESSAGES = ["Boa.", "Feito.", "Isso aí."];

const initialTasks = [
  { id: "1", titulo: "Ligar pro fornecedor", espaco: "prime", hora: "09:00", status: "fazer", dataPrevista: "2026-07-27" },
  { id: "2", titulo: "Revisar contrato de aluguel", espaco: "sehorbas", hora: "11:30", status: "fazer", dataPrevista: "2026-07-25" },
  { id: "3", titulo: "Levar carro na revisão", espaco: "pessoal", hora: null, status: "fazer", dataPrevista: "2026-07-29" },
  { id: "4", titulo: "Fechar planilha do mês", espaco: "prime", hora: "14:00", status: "andamento", dataPrevista: "2026-07-24" },
  { id: "5", titulo: "Responder e-mails pendentes", espaco: "sehorbas", hora: "16:00", status: "andamento", dataPrevista: "2026-07-27" },
  { id: "6", titulo: "Marcar dentista", espaco: "pessoal", hora: null, status: "concluido", dataPrevista: "2026-07-26" },
];

function EspacoCapsula({ id }) {
  const e = ESPACOS[id];
  if (!e) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${e.cor}22`, color: e.cor }}
    >
      {e.tipo === "casa" ? <Home size={11} strokeWidth={2.5} /> : (
        <span className="w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: e.cor, color: COLORS.bg }}>
          {e.nome[0]}
        </span>
      )}
      {e.nome}
    </span>
  );
}

function ViraLogo({ spinning, size = 22 }) {
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

function TaskCardInner({ task }) {
  const status = STATUS_CONFIG[task.status];
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug" style={{ color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
          {task.titulo}
        </p>
        <status.Icon size={15} style={{ color: status.color, flexShrink: 0, marginTop: 2 }} />
      </div>
      <div className="flex items-center justify-between">
        <EspacoCapsula id={task.espaco} />
        {task.hora && (
          <span className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
            {task.hora}
          </span>
        )}
      </div>
    </>
  );
}

function TaskCard({ task, onDragStart, onTouchStart, justCompleted, isBeingTouchDragged }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onTouchStart={(e) => onTouchStart(e, task.id)}
      className="rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        transform: justCompleted ? "scale(1.03)" : "scale(1)",
        boxShadow: justCompleted ? `0 0 0 2px ${COLORS.concluido}55` : "none",
        opacity: isBeingTouchDragged ? 0.35 : 1,
        transition: "transform 0.3s ease, box-shadow 0.3s ease, opacity 0.15s ease",
        touchAction: "none",
      }}
    >
      <TaskCardInner task={task} />
    </div>
  );
}

function Column({ statusKey, tasks, onDragStart, onTouchStart, onDrop, dragOver, setDragOver, justCompletedId, touchDragId, emptyMsg }) {
  const cfg = STATUS_CONFIG[statusKey];
  return (
    <div
      data-status={statusKey}
      onDragOver={(e) => { e.preventDefault(); setDragOver(statusKey); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => onDrop(e, statusKey)}
      className="flex-1 min-w-[220px] rounded-2xl p-3 flex flex-col"
      style={{
        backgroundColor: dragOver === statusKey ? COLORS.accentSoft : "transparent",
        border: `1px dashed ${dragOver === statusKey ? COLORS.accent : "transparent"}`,
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        minHeight: 320,
      }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <cfg.Icon size={15} style={{ color: cfg.color }} />
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: COLORS.textSecondary, fontFamily: "Inter, sans-serif" }}>
          {cfg.label}
        </span>
        <span className="text-xs" style={{ color: COLORS.textSecondary }}>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2 opacity-70">
          <ViraLogo spinning={false} />
          <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "Inter, sans-serif" }}>{emptyMsg}</p>
        </div>
      ) : (
        tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onDragStart={onDragStart}
            onTouchStart={onTouchStart}
            justCompleted={t.id === justCompletedId}
            isBeingTouchDragged={t.id === touchDragId}
          />
        ))
      )}
    </div>
  );
}

export default function ViraKanban() {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragOver, setDragOver] = useState(null);
  const [toast, setToast] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState(null);
  const dragId = useRef(null);

  const [touchDrag, setTouchDrag] = useState(null);
  const touchDragRef = useRef(null);

  const emptyMsgByColumn = useMemo(() => {
    const map = {};
    STATUS_ORDER.forEach((s) => { map[s] = EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)]; });
    return map;
  }, []);

  function applyDrop(id, statusKey) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: statusKey } : t)));
    if (statusKey === "concluido") {
      setJustCompletedId(id);
      setSpinning(true);
      setToast(COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)]);
      setTimeout(() => setSpinning(false), 650);
      setTimeout(() => { setToast(null); setJustCompletedId(null); }, 1800);
    }
  }

  function handleDragStart(e, id) { dragId.current = id; }
  function handleDrop(e, statusKey) {
    e.preventDefault();
    setDragOver(null);
    const id = dragId.current;
    if (!id) return;
    applyDrop(id, statusKey);
    dragId.current = null;
  }

  function handleTouchStart(e, id) {
    const touch = e.touches[0];
    const task = tasks.find((t) => t.id === id);
    const state = { id, x: touch.clientX, y: touch.clientY, task };
    touchDragRef.current = state;
    setTouchDrag(state);
  }

  useEffect(() => {
    function handleTouchMove(e) {
      if (!touchDragRef.current) return;
      const touch = e.touches[0];
      const updated = { ...touchDragRef.current, x: touch.clientX, y: touch.clientY };
      touchDragRef.current = updated;
      setTouchDrag(updated);

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el && el.closest ? el.closest("[data-status]") : null;
      setDragOver(col ? col.getAttribute("data-status") : null);
    }
    function handleTouchEnd() {
      if (!touchDragRef.current) return;
      const { id, x, y } = touchDragRef.current;
      const el = document.elementFromPoint(x, y);
      const col = el && el.closest ? el.closest("[data-status]") : null;
      if (col) applyDrop(id, col.getAttribute("data-status"));
      touchDragRef.current = null;
      setTouchDrag(null);
      setDragOver(null);
    }
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  function handleVirarDia() {
    const hoje = new Date("2026-07-27");
    setTasks((prev) =>
      prev.map((t) => {
        const prevista = new Date(t.dataPrevista);
        if ((t.status === "fazer" || t.status === "andamento") && prevista < hoje) {
          return { ...t, status: "atrasado" };
        }
        return t;
      })
    );
  }

  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ViraLogo spinning={spinning} />
            <h1 className="text-lg font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              vira
            </h1>
          </div>
          <button
            onClick={handleVirarDia}
            className="text-xs font-medium rounded-full px-4 py-2 transition-opacity active:opacity-70"
            style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent, fontFamily: "Inter, sans-serif" }}
          >
            Virar o dia
          </button>
        </div>

        <p className="text-sm mb-5" style={{ color: COLORS.textSecondary }}>
          Toque e segure um card pra arrastar entre as colunas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {STATUS_ORDER.map((s) => (
            <Column
              key={s}
              statusKey={s}
              tasks={grouped[s]}
              onDragStart={handleDragStart}
              onTouchStart={handleTouchStart}
              onDrop={handleDrop}
              dragOver={dragOver}
              setDragOver={setDragOver}
              justCompletedId={justCompletedId}
              touchDragId={touchDrag ? touchDrag.id : null}
              emptyMsg={emptyMsgByColumn[s]}
            />
          ))}
        </div>
      </div>

      {touchDrag && (
        <div
          className="fixed pointer-events-none rounded-xl p-3 w-56 z-50"
          style={{
            left: touchDrag.x - 112,
            top: touchDrag.y - 100,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.accent}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            transform: "rotate(-2deg) scale(1.03)",
          }}
        >
          <TaskCardInner task={touchDrag.task} />
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg"
          style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.concluido, fontFamily: "Inter, sans-serif" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
