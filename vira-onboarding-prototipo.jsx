import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";

const COLORS = {
  bg: "#14161C",
  surface: "#1C1F28",
  border: "#2A2E3A",
  text: "#EDEFF4",
  textSecondary: "#8E93A3",
  accent: "#5B8CFF",
  accentSoft: "#233257",
  concluido: "#4FC98A",
};

function ViraLogo({ size = 48, spinning }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
      <path d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4" fill="none" stroke={COLORS.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SUGESTOES = ["Responder e-mails pendentes", "Ligar pro fornecedor", "Marcar consulta", "Revisar planilha do mês"];

export default function Onboarding() {
  const [passo, setPasso] = useState(0); // 0: boas-vindas, 1: captura, 2: pronto
  const [tarefas, setTarefas] = useState([]);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (passo === 1 && inputRef.current) inputRef.current.focus();
  }, [passo]);

  function adicionar(titulo) {
    const texto = titulo || input;
    if (!texto.trim()) return;
    setTarefas((prev) => [...prev, texto.trim()]);
    setInput("");
    if (inputRef.current) inputRef.current.focus();
  }

  function remover(idx) {
    setTarefas((prev) => prev.filter((_, i) => i !== idx));
  }

  function finalizar() {
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setPasso(2); }, 700);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ backgroundColor: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');`}</style>

      <div className="w-full max-w-sm">

        {/* Passo 0 — boas-vindas */}
        {passo === 0 && (
          <div className="flex flex-col items-center text-center gap-5 py-10">
            <ViraLogo size={56} />
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>vira</h1>
              <p className="text-base leading-relaxed" style={{ color: COLORS.textSecondary }}>
                Não é mais um sistema pra manter.<br />É só o que você precisa lembrar.
              </p>
            </div>
            <button
              onClick={() => setPasso(1)}
              className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-4"
              style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
            >
              Começar <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Passo 1 — captura rápida */}
        {passo === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                O que tá pendente agora?
              </h2>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Joga 2 ou 3 coisas que você precisa lembrar. Sem enrolação.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
                placeholder="Ex: ligar pro fornecedor"
                className="flex-1 text-sm outline-none rounded-xl px-3 py-3"
                style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              />
              <button
                onClick={() => adicionar()}
                disabled={!input.trim()}
                className="rounded-xl p-3 active:scale-90 transition-transform disabled:opacity-30"
                style={{ backgroundColor: COLORS.accentSoft, color: COLORS.accent }}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* sugestões rápidas pra reduzir fricção de começar */}
            {tarefas.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => adicionar(s)}
                    className="text-xs rounded-full px-3 py-1.5"
                    style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}

            {/* lista do que foi adicionado */}
            {tarefas.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {tarefas.map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                    <span className="text-sm" style={{ color: COLORS.text }}>{t}</span>
                    <button onClick={() => remover(i)} className="text-xs" style={{ color: COLORS.textSecondary }}>remover</button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={finalizar}
              disabled={tarefas.length === 0}
              className="w-full rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-30 mt-2"
              style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
            >
              {tarefas.length === 0 ? "Adicione ao menos 1" : `Pronto — ${tarefas.length} adicionada${tarefas.length !== 1 ? "s" : ""}`}
            </button>

            <button onClick={() => setPasso(2)} className="text-xs text-center" style={{ color: COLORS.textSecondary }}>
              Pular por agora
            </button>
          </div>
        )}

        {/* Passo 2 — pronto */}
        {passo === 2 && (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <ViraLogo size={48} spinning={spinning} />
            <CheckCircleGiant />
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                Prontinho.
              </h2>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {tarefas.length > 0
                  ? `${tarefas.length} coisa${tarefas.length !== 1 ? "s" : ""} já não tá${tarefas.length !== 1 ? "ão" : ""} só na sua cabeça.`
                  : "Quando quiser, é só tocar no + pra começar."}
              </p>
            </div>
            <button
              className="w-full rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition-transform mt-3"
              style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
            >
              Ir pro Vira
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircleGiant() {
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.concluido}22` }}>
      <Check size={26} style={{ color: COLORS.concluido }} strokeWidth={3} />
    </div>
  );
}
