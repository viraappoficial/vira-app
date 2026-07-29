import { serve } from 'https://deno.land/std/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function montarPrompt(titulo: string, descricao: string, areaAtuacao: string | null) {
  return `Você é o Secretário do Vira. Uma tarefa está sendo adiada repetidamente, provavelmente porque é grande ou vaga demais pra encaixar no dia.
${areaAtuacao ? `\nA pessoa trabalha/estuda com: ${areaAtuacao}. Use isso só como pista de contexto se ajudar a tornar as sugestões mais concretas, nunca invente algo que não tem a ver com a tarefa.\n` : ''}
TAREFA:
- Título: "${titulo}"
${descricao ? `- Descrição: "${descricao}"` : ''}

Sugira de 2 a 4 subtarefas menores e concretas que, juntas, dão conta dessa tarefa. Cada uma deve ser algo que dá pra fazer numa sentada só, com um verbo de ação no início. Sem explicações, sem numeração no texto.

Responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
{ "sugestoes": string[] }`;
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

  let titulo: string, descricao: string, areaAtuacao: string | null;
  try {
    const body = await req.json();
    titulo = body.titulo;
    descricao = body.descricao || '';
    areaAtuacao = body.areaAtuacao || null;
  } catch {
    return jsonResponse({ error: 'requisicao_invalida' }, 400);
  }

  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return jsonResponse({ error: 'requisicao_invalida' }, 400);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'quebrar_indisponivel' }, 500);
  }

  const prompt = montarPrompt(titulo, descricao, areaAtuacao);

  let resposta: Response;
  try {
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
    return jsonResponse({ error: 'quebrar_indisponivel' }, 503);
  }

  if (!resposta.ok) {
    const status = resposta.status === 429 ? 429 : 503;
    return jsonResponse({ error: status === 429 ? 'limite_excedido' : 'quebrar_indisponivel' }, status);
  }

  let dados: any;
  try {
    dados = await resposta.json();
  } catch {
    return jsonResponse({ error: 'quebrar_indisponivel' }, 503);
  }

  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    return jsonResponse({ error: 'quebrar_indisponivel' }, 503);
  }

  let estruturado: any;
  try {
    estruturado = JSON.parse(textoGerado);
  } catch {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  if (!Array.isArray(estruturado.sugestoes) || estruturado.sugestoes.length === 0) {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  return jsonResponse({
    sugestoes: estruturado.sugestoes.filter((s: unknown) => typeof s === 'string' && s.trim()).slice(0, 4),
  });
});
