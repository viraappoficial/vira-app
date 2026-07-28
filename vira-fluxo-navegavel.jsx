import React, { useState, useRef, useEffect, useMemo } from "react";
import { Circle, Clock, CheckCircle2, AlertTriangle, Home as HomeIcon, Plus, LayoutGrid, Settings, X, Upload, Check, Flag } from "lucide-react";

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

const STATUS_ORDER = ["fazer", "andamento", "concluido", "atrasado"];
const STATUS_CONFIG = {
  fazer: { label: "A fazer", color: COLORS.fazer, Icon: Circle },
  andamento: { label: "Em andamento", color: COLORS.andamento, Icon: Clock },
  concluido: { label: "Concluído", color: COLORS.concluido, Icon: CheckCircle2 },
  atrasado: { label: "Atrasado", color: COLORS.atrasado, Icon: AlertTriangle },
};

const CORES_SUGERIDAS = ["#D9A544", "#3FAE72", "#8E6FE8", "#E86F9C", "#5B8CFF", "#4FC98A"];
const PRIORIDADES = [
  { id: "baixa", cor: COLORS.fazer },
  { id: "media", cor: COLORS.andamento },
  { id: "alta", cor: COLORS.atrasado },
];

const GREETINGS = ["Bom dia, Gabriel", "E aí, Gabriel", "Bora, Gabriel"];
const SUBTITLES = ["Aqui está o que te espera hoje.", "Nada de bagunça — só o que importa hoje.", "Um de cada vez, sem pressa."];
const EMPTY_MESSAGES = ["Tudo em dia. Aproveita.", "Nada pendente. Respira.", "Zerou. Bom trabalho."];
const COMPLETE_MESSAGES = ["Boa.", "Feito.", "Isso aí."];

const initialEspacos = {
  prime: { nome: "Prime", cor: "#D9A544", tipo: "letra" },
  sehorbas: { nome: "Sehorbas", cor: "#3FAE72", tipo: "letra" },
  pessoal: { nome: "Pessoal", cor: "#8E93A3", tipo: "casa" },
};

const initialTasks = [
  { id: "1", titulo: "Ligar pro fornecedor", espaco: "prime", hora: "09:00", status: "fazer", dataPrevista: "2026-07-27" },
  { id: "2", titulo: "Revisar contrato de aluguel", espaco: "sehorbas", hora: "11:30", status: "fazer", dataPrevista: "2026-07-25" },
  { id: "3", titulo: "Levar carro na revisão", espaco: "pessoal", hora: null, status: "fazer", dataPrevista: "2026-07-29" },
  { id: "4", titulo: "Fechar planilha do mês", espaco: "prime", hora: "14:00", status: "andamento", dataPrevista: "2026-07-24" },
  { id: "5", titulo: "Buscar filho na escola", espaco: "pessoal", hora: "17:30", status: "fazer", dataPrevista: "2026-07-27" },
];

function ViraLogo({ spinning, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
      <path d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4" fill="none" stroke={COLORS.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EspacoChipDot({ espacos, id, small }) {
  const e = espacos[id];
  if (!e) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-medium" style={{ backgroundColor: `${e.cor}22`, color: e.cor, padding: small ? "1px 7px" : "2px 8px", fontSize: small ? 10 : 11 }}>
      {e.logo ? (
        <img src={e.logo} className="w-3 h-3 rounded-full object-cover" alt="" />
      ) : e.tipo === "casa" ? (
        <HomeIcon size={10} strokeWidth={2.5} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: e.cor, color: COLORS.bg, fontSize: 8 }}>{e.nome[0]}</span>
      )}
      {e.nome}
    </span>
  );
}

// ---------------- HOME ----------------
function TelaHome({ tasks, espacos, onToggle, justCompletedId }) {
  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);
  const emptyMsg = useMemo(() => EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)], []);
  const dataHoje = useMemo(() => new Date("2026-07-27").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }), []);

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
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs uppercase tracking-wide" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>{dataHoje}</span>
      </div>
      <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>{greeting}</h1>
      <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>{pendentes.length > 0 ? subtitle : "Nada por aqui hoje."}</p>

      {tasks.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-medium rounded-full px-3 py-1" style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent }}>{pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}</span>
          {atrasadas > 0 && <span className="text-xs font-medium rounded-full px-3 py-1" style={{ backgroundColor: `${COLORS.atrasado}22`, color: COLORS.atrasado }}>{atrasadas} atrasada{atrasadas !== 1 ? "s" : ""}</span>}
          {concluidas > 0 && <span className="text-xs font-medium rounded-full px-3 py-1" style={{ backgroundColor: `${COLORS.concluido}22`, color: COLORS.concluido }}>{concluidas} feita{concluidas !== 1 ? "s" : ""}</span>}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 opacity-80">
          <ViraLogo spinning={false} size={40} />
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>{emptyMsg}</p>
        </div>
      ) : (
        ordenadas.map((t) => {
          const isDone = t.status === "concluido";
          const cfg = STATUS_CONFIG[t.status];
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl p-3 mb-2" style={{ backgroundColor: COLORS.surface, border: `1px solid ${t.status === "atrasado" ? `${COLORS.atrasado}55` : COLORS.border}`, opacity: isDone ? 0.5 : 1, transform: t.id === justCompletedId ? "scale(1.02)" : "scale(1)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
              <button onClick={() => onToggle(t.id)} className="flex-shrink-0 active:scale-90 transition-transform" style={{ touchAction: "manipulation" }}>
                <cfg.Icon size={22} style={{ color: cfg.color }} strokeWidth={isDone ? 2.5 : 2} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: isDone ? COLORS.textSecondary : COLORS.text, textDecoration: isDone ? "line-through" : "none" }}>{t.titulo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <EspacoChipDot espacos={espacos} id={t.espaco} small />
                  {t.hora && <span className="text-[11px]" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>{t.hora}</span>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------------- KANBAN ----------------
function TelaKanban({ tasks, espacos, setTasks, justCompletedId, setJustCompletedId, setToast, setSpinning }) {
  const [dragOver, setDragOver] = useState(null);
  const dragId = useRef(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const touchDragRef = useRef(null);
  const [recolhidas, setRecolhidas] = useState({});
  function toggleRecolhida(s) { setRecolhidas((prev) => ({ ...prev, [s]: !prev[s] })); }
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
      setTimeout(() => { setToast(null); setJustCompletedId(null); }, 1600);
    }
  }

  function handleDragStart(e, id) { dragId.current = id; }
  function handleDrop(e, statusKey) { e.preventDefault(); setDragOver(null); const id = dragId.current; if (!id) return; applyDrop(id, statusKey); dragId.current = null; }
  function handleTouchStart(e, id) { const touch = e.touches[0]; const task = tasks.find((t) => t.id === id); const state = { id, x: touch.clientX, y: touch.clientY, task }; touchDragRef.current = state; setTouchDrag(state); }

  useEffect(() => {
    function move(e) {
      if (!touchDragRef.current) return;
      const touch = e.touches[0];
      const updated = { ...touchDragRef.current, x: touch.clientX, y: touch.clientY };
      touchDragRef.current = updated; setTouchDrag(updated);
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const col = el && el.closest ? el.closest("[data-status]") : null;
      setDragOver(col ? col.getAttribute("data-status") : null);
    }
    function end() {
      if (!touchDragRef.current) return;
      const { id, x, y } = touchDragRef.current;
      const el = document.elementFromPoint(x, y);
      const col = el && el.closest ? el.closest("[data-status]") : null;
      if (col) applyDrop(id, col.getAttribute("data-status"));
      touchDragRef.current = null; setTouchDrag(null); setDragOver(null);
    }
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
  }, [tasks]);

  const grouped = STATUS_ORDER.reduce((acc, s) => { acc[s] = tasks.filter((t) => t.status === s); return acc; }, {});

  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-lg font-semibold mb-3 px-1" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>Board</h2>
      <div className="flex flex-col gap-3">
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const isRecolhida = !!recolhidas[s];
          const lista = grouped[s];
          const visiveis = isRecolhida ? lista.slice(0, 1) : lista;
          const restante = isRecolhida ? lista.length - visiveis.length : 0;
          return (
            <div key={s} data-status={s} onDragOver={(e) => { e.preventDefault(); setDragOver(s); }} onDragLeave={() => setDragOver(null)} onDrop={(e) => handleDrop(e, s)}
              className="rounded-2xl p-3" style={{ backgroundColor: dragOver === s ? COLORS.accentSoft : COLORS.surface, border: `1px solid ${dragOver === s ? COLORS.accent : COLORS.border}`, minHeight: isRecolhida ? "auto" : 90, transition: "background-color 0.15s ease, border-color 0.15s ease" }}>
              <button onClick={() => toggleRecolhida(s)} className="w-full flex items-center gap-2 mb-2 px-1 active:opacity-70 transition-opacity">
                <cfg.Icon size={14} style={{ color: cfg.color }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{cfg.label}</span>
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>{lista.length}</span>
                <span className="ml-auto text-xs transition-transform" style={{ color: COLORS.textSecondary, transform: isRecolhida ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
              </button>
              {lista.length === 0 ? (
                <p className="text-xs text-center py-3 opacity-60" style={{ color: COLORS.textSecondary }}>{emptyMsgByColumn[s]}</p>
              ) : (
                <>
                  {visiveis.map((t) => (
                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)} onTouchStart={(e) => handleTouchStart(e, t.id)}
                      className="rounded-xl p-2.5 mb-1.5 cursor-grab active:cursor-grabbing select-none" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, opacity: touchDrag && touchDrag.id === t.id ? 0.3 : 1, touchAction: "none" }}>
                      <p className="text-sm font-medium mb-1" style={{ color: COLORS.text }}>{t.titulo}</p>
                      <div className="flex items-center justify-between">
                        <EspacoChipDot espacos={espacos} id={t.espaco} small />
                        {t.hora && <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>{t.hora}</span>}
                      </div>
                    </div>
                  ))}
                  {restante > 0 && (
                    <button onClick={() => toggleRecolhida(s)} className="text-[11px] font-medium px-1 py-1" style={{ color: COLORS.accent }}>
                      + {restante} tarefa{restante !== 1 ? "s" : ""}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {touchDrag && (
        <div className="fixed pointer-events-none rounded-xl p-3 w-56 z-50" style={{ left: touchDrag.x - 112, top: touchDrag.y - 90, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.accent}`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", transform: "rotate(-2deg) scale(1.03)" }}>
          <p className="text-sm font-medium" style={{ color: COLORS.text }}>{touchDrag.task.titulo}</p>
        </div>
      )}
    </div>
  );
}

// ---------------- MODAL: NOVA TAREFA ----------------
function ModalNovaTarefa({ espacos, onClose, onCreate }) {
  const [titulo, setTitulo] = useState("");
  const [espaco, setEspaco] = useState(null);
  const [prioridade, setPrioridade] = useState("media");
  const [hora, setHora] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  function criar() {
    if (!titulo.trim()) return;
    onCreate({ id: String(Date.now()), titulo, espaco, hora: hora || null, status: "fazer", dataPrevista: "2026-07-27" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><ViraLogo size={16} /><span className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>Nova tarefa</span></div>
          <button onClick={onClose} style={{ color: COLORS.textSecondary }}><X size={18} /></button>
        </div>
        <input ref={inputRef} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="O que você precisa lembrar?"
          className="w-full text-base outline-none mb-4 pb-2 bg-transparent" style={{ borderBottom: `1.5px solid ${COLORS.border}`, color: COLORS.text }} />
        <p className="text-[11px] font-medium mb-2" style={{ color: COLORS.textSecondary }}>Espaço</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(espacos).map(([id, e]) => (
            <button key={id} onClick={() => setEspaco(espaco === id ? null : id)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium active:scale-95 transition-transform"
              style={{ backgroundColor: espaco === id ? `${e.cor}22` : "transparent", border: `1px solid ${espaco === id ? e.cor : COLORS.border}`, color: espaco === id ? e.cor : COLORS.textSecondary }}>
              {e.tipo === "casa" ? <HomeIcon size={11} /> : <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: e.cor, color: COLORS.bg }}>{e.nome[0]}</span>}
              {e.nome}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <p className="text-[11px] font-medium mb-2 flex items-center gap-1" style={{ color: COLORS.textSecondary }}><Flag size={11} /> Prioridade</p>
            <div className="flex gap-1.5">
              {PRIORIDADES.map((p) => (
                <button key={p.id} onClick={() => setPrioridade(p.id)} className="w-6 h-6 rounded-full flex-shrink-0 transition-all" style={{ backgroundColor: p.cor, opacity: prioridade === p.id ? 1 : 0.3, transform: prioridade === p.id ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium mb-2 flex items-center gap-1" style={{ color: COLORS.textSecondary }}><Clock size={11} /> Horário</p>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full text-xs rounded-lg px-2 py-1.5 outline-none" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
        </div>
        <button onClick={criar} disabled={!titulo.trim()} className="w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40" style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}>Criar tarefa</button>
      </div>
    </div>
  );
}

// ---------------- MODAL: NOVO ESPAÇO ----------------
function ModalNovoEspaco({ onClose, onCreate }) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [logo, setLogo] = useState(null);
  const fileInputRef = useRef(null);
  const inicial = nome.trim() ? nome.trim()[0].toUpperCase() : "?";

  function handleUpload(e) { const file = e.target.files && e.target.files[0]; if (!file) return; setLogo(URL.createObjectURL(file)); }
  function criar() { if (!nome.trim()) return; onCreate(nome.trim().toLowerCase().replace(/\s+/g, "-"), { nome: nome.trim(), cor, tipo: "letra", logo }); }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><ViraLogo size={16} /><span className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>Novo espaço</span></div>
          <button onClick={onClose} style={{ color: COLORS.textSecondary }}><X size={18} /></button>
        </div>
        <div className="flex flex-col items-center mb-6">
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden mb-2 active:scale-95 transition-transform"
            style={{ backgroundColor: logo ? "transparent" : `${cor}22`, border: `1.5px dashed ${logo ? "transparent" : COLORS.border}` }}>
            {logo ? <img src={logo} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl font-bold" style={{ color: cor, fontFamily: "'Space Grotesk', sans-serif" }}>{inicial}</span>}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.accent }}><Upload size={13} />{logo ? "Trocar logotipo" : "Subir logotipo"}</button>
          <p className="text-[11px] mt-1 text-center" style={{ color: COLORS.textSecondary }}>Opcional — sem logo, usamos a inicial</p>
        </div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Nome do espaço</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Prime, Sehorbas..." className="w-full rounded-xl px-3 py-2.5 text-sm mb-5 outline-none" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text }} />
        <label className="block text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>Cor</label>
        <div className="flex items-center gap-2 mb-6">
          {CORES_SUGERIDAS.map((c) => (
            <button key={c} onClick={() => setCor(c)} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: c, border: cor === c ? `2px solid ${COLORS.text}` : "2px solid transparent" }}>
              {cor === c && <Check size={13} color={COLORS.bg} strokeWidth={3} />}
            </button>
          ))}
        </div>
        <button onClick={criar} disabled={!nome.trim()} className="w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40" style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}>Criar espaço</button>
      </div>
    </div>
  );
}

// ---------------- APP ----------------
export default function ViraApp() {
  const [tela, setTela] = useState("home");
  const [tasks, setTasks] = useState(initialTasks);
  const [espacos, setEspacos] = useState(initialEspacos);
  const [spinning, setSpinning] = useState(false);
  const [toast, setToast] = useState(null);
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [modalTarefa, setModalTarefa] = useState(false);
  const [modalEspaco, setModalEspaco] = useState(false);

  function handleToggleHome(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const novoStatus = task.status === "concluido" ? "fazer" : "concluido";
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t)));
    if (novoStatus === "concluido") {
      setJustCompletedId(id); setSpinning(true);
      setToast(COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)]);
      setTimeout(() => setSpinning(false), 650);
      setTimeout(() => { setToast(null); setJustCompletedId(null); }, 1600);
    }
  }

  function handleCriarTarefa(nova) { setTasks((prev) => [...prev, nova]); setModalTarefa(false); setToast("Tarefa criada"); setTimeout(() => setToast(null), 1400); }
  function handleCriarEspaco(id, dados) { setEspacos((prev) => ({ ...prev, [id]: dados })); setModalEspaco(false); setToast("Espaço criado"); setTimeout(() => setToast(null), 1400); }
  function handleVirarDia() {
    const hoje = new Date("2026-07-27");
    setTasks((prev) => prev.map((t) => { const p = new Date(t.dataPrevista); return (t.status === "fazer" || t.status === "andamento") && p < hoje ? { ...t, status: "atrasado" } : t; }));
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <div className="w-full max-w-md relative pb-24" style={{ minHeight: "100vh" }}>
        {/* topo fixo */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <ViraLogo spinning={spinning} size={18} />
            <span className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>vira</span>
          </div>
          <div className="flex items-center gap-2">
            {tela === "kanban" && (
              <button onClick={handleVirarDia} className="text-[11px] font-medium rounded-full px-3 py-1.5" style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent }}>Virar o dia</button>
            )}
            <button onClick={() => setModalEspaco(true)} className="p-1.5 rounded-full active:scale-90 transition-transform" style={{ color: COLORS.textSecondary }}><Settings size={16} /></button>
          </div>
        </div>

        {tela === "home" ? (
          <TelaHome tasks={tasks} espacos={espacos} onToggle={handleToggleHome} justCompletedId={justCompletedId} />
        ) : (
          <TelaKanban tasks={tasks} espacos={espacos} setTasks={setTasks} justCompletedId={justCompletedId} setJustCompletedId={setJustCompletedId} setToast={setToast} setSpinning={setSpinning} />
        )}

        {/* barra de navegação inferior */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center">
          <div className="w-full max-w-md flex items-center justify-around px-6 py-3" style={{ backgroundColor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={() => setTela("home")} className="flex flex-col items-center gap-1 active:scale-90 transition-transform" style={{ color: tela === "home" ? COLORS.accent : COLORS.textSecondary }}>
              <HomeIcon size={20} />
              <span className="text-[10px] font-medium">Hoje</span>
            </button>
            <button onClick={() => setModalTarefa(true)} className="flex items-center justify-center rounded-full active:scale-90 transition-transform -mt-6" style={{ width: 52, height: 52, backgroundColor: COLORS.accent, boxShadow: `0 4px 16px ${COLORS.accent}55` }}>
              <Plus size={24} color={COLORS.bg} strokeWidth={2.5} />
            </button>
            <button onClick={() => setTela("kanban")} className="flex flex-col items-center gap-1 active:scale-90 transition-transform" style={{ color: tela === "kanban" ? COLORS.accent : COLORS.textSecondary }}>
              <LayoutGrid size={20} />
              <span className="text-[10px] font-medium">Board</span>
            </button>
          </div>
        </div>

        {modalTarefa && <ModalNovaTarefa espacos={espacos} onClose={() => setModalTarefa(false)} onCreate={handleCriarTarefa} />}
        {modalEspaco && <ModalNovoEspaco onClose={() => setModalEspaco(false)} onCreate={handleCriarEspaco} />}

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg z-50" style={{ bottom: 90, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.concluido }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
