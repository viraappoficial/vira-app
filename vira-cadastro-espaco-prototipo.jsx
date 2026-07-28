import React, { useState, useRef } from "react";
import { Home as HomeIcon, Upload, X, Check } from "lucide-react";

const COLORS = {
  bg: "#14161C",
  surface: "#1C1F28",
  border: "#2A2E3A",
  text: "#EDEFF4",
  textSecondary: "#8E93A3",
  accent: "#5B8CFF",
  accentSoft: "#233257",
};

const CORES_SUGERIDAS = ["#D9A544", "#3FAE72", "#8E6FE8", "#E86F9C", "#5B8CFF", "#4FC98A"];

function ViraLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 4 L9 20 L13 20 L21 4 L17 4 L11.5 15.5 C11 16.5 12.5 17 13 16 L19 4"
        fill="none" stroke={COLORS.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CadastroEspaco() {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [logo, setLogo] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const fileInputRef = useRef(null);

  function handleUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogo(url);
  }

  function handleSalvar() {
    if (!nome.trim()) return;
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
  }

  const inicial = nome.trim() ? nome.trim()[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-5" style={{ backgroundColor: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-2 mb-5">
          <ViraLogo />
          <h1 className="text-base font-semibold" style={{ color: COLORS.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            Novo espaço
          </h1>
        </div>

        {/* preview do logo / fallback */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden mb-2 active:scale-95 transition-transform"
            style={{
              backgroundColor: logo ? "transparent" : `${cor}22`,
              border: `1.5px dashed ${logo ? "transparent" : COLORS.border}`,
            }}
          >
            {logo ? (
              <img src={logo} alt="Logo do espaço" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: cor, fontFamily: "'Space Grotesk', sans-serif" }}>
                {inicial}
              </span>
            )}
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: COLORS.accent }}
            >
              <Upload size={13} />
              {logo ? "Trocar logotipo" : "Subir logotipo"}
            </button>
            {logo && (
              <button
                onClick={() => setLogo(null)}
                className="flex items-center gap-1 text-xs"
                style={{ color: COLORS.textSecondary }}
              >
                <X size={13} />
                Remover
              </button>
            )}
          </div>
          <p className="text-[11px] mt-1 text-center" style={{ color: COLORS.textSecondary }}>
            Opcional — sem logo, usamos a inicial do nome
          </p>
        </div>

        {/* nome */}
        <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
          Nome do espaço
        </label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Prime, Sehorbas..."
          className="w-full rounded-xl px-3 py-2.5 text-sm mb-5 outline-none"
          style={{
            backgroundColor: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
          }}
        />

        {/* cor (usada se não houver logo) */}
        <label className="block text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>
          Cor do espaço
        </label>
        <div className="flex items-center gap-2 mb-6">
          {CORES_SUGERIDAS.map((c) => (
            <button
              key={c}
              onClick={() => setCor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ backgroundColor: c, border: cor === c ? `2px solid ${COLORS.text}` : "2px solid transparent" }}
            >
              {cor === c && <Check size={13} color={COLORS.bg} strokeWidth={3} />}
            </button>
          ))}
        </div>

        <button
          onClick={handleSalvar}
          disabled={!nome.trim()}
          className="w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
          style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
        >
          {salvo ? "Espaço criado ✓" : "Criar espaço"}
        </button>
      </div>
    </div>
  );
}
