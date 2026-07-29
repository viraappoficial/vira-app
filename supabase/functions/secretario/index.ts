import { serve } from 'https://deno.land/std/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function montarPrompt(texto: string, dataAtual: string, espacos: string[]) {
  return `Você é o Secretário do Vira, um assistente que transforma uma ideia solta em uma tarefa estruturada.

CONTEXTO:
- Data de hoje: ${dataAtual} (formato YYYY-MM-DD)
- Espaços disponíveis do usuário: ${JSON.stringify(espacos)}

REGRAS:
- Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, sem markdown, sem explicação.
- "data_prevista" deve estar no formato exato "YYYY-MM-DD" (ex: "2026-07-30"), ou null se o usuário não mencionar data. Resolva expressões relativas ("amanhã", "sexta que vem") usando a data de hoje como referência.
- "hora" deve estar no formato exato "HH:MM" em 24 horas (ex: "09:00", "14:30"), ou null se o usuário não mencionar horário.
- Infira o espaço mais provável pelo contexto da frase, usando exatamente um dos nomes da lista de espaços disponíveis. Se não for possível inferir, deixe "espaco" como null.
- Infira a prioridade como "alta" só se houver urgência explícita (ex: "urgente", "hoje mesmo", "importante"). Caso contrário, use "media".
- O campo "titulo" deve ser uma versão limpa e curta da tarefa, sem preencher com informação que não foi dita.

FORMATO DE SAÍDA (exato):
{
  "titulo": string,
  "data_prevista": string | null,
  "hora": string | null,
  "espaco": string | null,
  "prioridade": "baixa" | "media" | "alta"
}

TEXTO DO USUÁRIO:
"${texto}"`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let texto: string, dataAtual: string, espacos: string[];
  try {
    const body = await req.json();
    texto = body.texto;
    dataAtual = body.dataAtual;
    espacos = body.espacos || [];
  } catch {
    return jsonResponse({ error: 'requisicao_invalida' }, 400);
  }

  if (!texto || typeof texto !== 'string' || !texto.trim()) {
    return jsonResponse({ error: 'texto_vazio' }, 400);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'secretario_indisponivel' }, 500);
  }

  const prompt = montarPrompt(texto, dataAtual, espacos);

  let resposta: Response;
  try {
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
  } catch {
    return jsonResponse({ error: 'secretario_indisponivel' }, 503);
  }

  if (!resposta.ok) {
    const status = resposta.status === 429 ? 429 : 503;
    return jsonResponse({ error: status === 429 ? 'limite_excedido' : 'secretario_indisponivel' }, status);
  }

  let dados: any;
  try {
    dados = await resposta.json();
  } catch {
    return jsonResponse({ error: 'secretario_indisponivel' }, 503);
  }

  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    return jsonResponse({ error: 'secretario_indisponivel' }, 503);
  }

  let estruturado: any;
  try {
    estruturado = JSON.parse(textoGerado);
  } catch {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  return jsonResponse({
    titulo: estruturado.titulo ?? null,
    data_prevista: estruturado.data_prevista ?? null,
    hora: estruturado.hora ?? null,
    espaco: estruturado.espaco ?? null,
    prioridade: estruturado.prioridade ?? 'media',
  });
});
