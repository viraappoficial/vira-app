import React, { useState, useRef, useEffect } from "react";
import { X, Home as HomeIcon, Clock, Flag, Repeat } from "lucide-react";

const COLORS = {
  bg: "#14161C",
  surface: "#1C1F28",
  border: "#2A2E3A",
  text: "#EDEFF4",
  textSecondary: "#8E93A3",
  accent: "#5B8CFF",
  accentSoft: "#233257",
  atrasado: "#F0644B",
  andamento: "#E8B84B",
  fazer: "#6B7180",
};

const ESPACOS = [
  { id: "prime", nome: "Prime", cor: "#D9A544", tipo: "letra" },
  { id: "sehorbas", nome: "Sehorbas", cor: "#3FAE72", tipo: "letra" },
  { id: "pessoal", nome: "Pessoal", cor: "#8E93A3", tipo: "casa" },
];

const PRIORIDADES = [
  { id: "baixa", label: "Baixa", cor: COLORS.fazer },
  { id: "media", label: "Média", cor: COLORS.andamento },
  { id: "alta", label: "Alta", cor: COLORS.atrasado },
];

const MODELOS = [
  { id: "m1", titulo: "Reunião semanal", espaco: "prime", hora: "09:00" },
  { id: "m2", titulo: "Fechamento de caixa", espaco: "sehorbas", hora: "18:00" },
  { id: "m3", titulo: "Academia", espaco: "pessoal", hora: "07:00" },
];

function ViraLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4"
        fill="none" stroke={COLORS.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EspacoChip({ e, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium flex-shrink-0 transition-all active:scale-95"
      style={{
        backgroundColor: ativo ? `${e.cor}22` : "transparent",
        border: `1px solid ${ativo ? e.cor : COLORS.border}`,
        color: ativo ? e.cor : COLORS.textSecondary,
      }}
    >
      {e.tipo === "casa" ? <HomeIcon size={11} /> : (
        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: e.cor, color: COLORS.bg }}>
          {e.nome[0]}
        </span>
      )}
      {e.nome}
    </button>
  );
}

export default function NovaTarefa() {
  const [titulo, setTitulo] = useState("");
  const [espaco, setEspaco] = useState(null);
  const [prioridade, setPrioridade] = useState("media");
  const [hora, setHora] = useState("");
  const [criada, setCriada] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function aplicarModelo(m) {
    setTitulo(m.titulo);
    setEspaco(m.espaco);
    setHora(m.hora);
  }

  function handleCriar() {
    if (!titulo.trim()) return;
    setCriada(true);
    setTimeout(() => {
      setCriada(false);
      setTitulo("");
      setEspaco(null);
      setHora("");
      setPrioridade("media");
      if (inputRef.current) inputRef.current.focus();
    }, 1200);
  }

  return (
    <div className="min-h-screen w-full flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5"
        style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ViraLogo />
            <span className="text-sm font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              Nova tarefa
            </span>
          </div>
          <button className="p-1 rounded-full active:scale-90 transition-transform" style={{ color: COLORS.textSecondary }}>
            <X size={18} />
          </button>
        </div>

        {/* campo principal - o único obrigatório */}
        <input
          ref={inputRef}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que você precisa lembrar?"
          className="w-full text-base outline-none mb-4 pb-2"
          style={{
            backgroundColor: "transparent",
            borderBottom: `1.5px solid ${COLORS.border}`,
            color: COLORS.text,
          }}
        />

        {/* modelos - atalho pra reduzir digitação */}
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              onClick={() => aplicarModelo(m)}
              className="flex-shrink-0 text-xs rounded-full px-3 py-1.5"
              style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent }}
            >
              {m.titulo}
            </button>
          ))}
        </div>

        {/* espaço */}
        <p className="text-[11px] font-medium mb-2" style={{ color: COLORS.textSecondary }}>Espaço</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {ESPACOS.map((e) => (
            <EspacoChip key={e.id} e={e} ativo={espaco === e.id} onClick={() => setEspaco(espaco === e.id ? null : e.id)} />
          ))}
        </div>

        {/* prioridade + hora, lado a lado, opcional */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <p className="text-[11px] font-medium mb-2 flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
              <Flag size={11} /> Prioridade
            </p>
            <div className="flex gap-1.5">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrioridade(p.id)}
                  className="w-6 h-6 rounded-full flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: p.cor,
                    opacity: prioridade === p.id ? 1 : 0.3,
                    transform: prioridade === p.id ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={p.label}
                />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-medium mb-2 flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
              <Clock size={11} /> Horário
            </p>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        </div>

        <button
          onClick={handleCriar}
          disabled={!titulo.trim()}
          className="w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
          style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
        >
          {criada ? "Criada ✓" : "Criar tarefa"}
        </button>
      </div>
    </div>
  );
}
