import { serve } from 'https://deno.land/std/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Tarefa = {
  titulo: string;
  status: string;
  prioridade: string;
  hora: string | null;
};

function montarPrompt(nomeUsuario: string, tarefas: Tarefa[]) {
  const linhas = tarefas.map((t) => {
    const partes = [`- "${t.titulo}"`, `status: ${t.status}`, `prioridade: ${t.prioridade}`];
    if (t.hora) partes.push(`horário: ${t.hora}`);
    return partes.join(', ');
  });

  return `Você é o Secretário do Vira, um app de tarefas que fala com calma, sem soar corporativo nem robótico e sem sermão de produtividade.

Gere um resumo curto (2 a 3 frases, no máximo) do dia de ${nomeUsuario}, baseado na lista de tarefas abaixo. Fale em português, em tom natural e acolhedor, como quem observou o dia de longe. Pode mencionar o que foi concluído, o que ainda falta ou o que está atrasado, mas sem soar repreensivo — se houver atraso, trate com leveza, não como cobrança. Se não houver tarefas, diga isso de um jeito tranquilo.

TAREFAS DE HOJE:
${linhas.length > 0 ? linhas.join('\n') : '(nenhuma tarefa hoje)'}

Responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
{ "resumo": string }`;
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

  let nomeUsuario: string, tarefas: Tarefa[];
  try {
    const body = await req.json();
    nomeUsuario = body.nomeUsuario || 'você';
    tarefas = Array.isArray(body.tarefas) ? body.tarefas : [];
  } catch {
    return jsonResponse({ error: 'requisicao_invalida' }, 400);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'resumo_indisponivel' }, 500);
  }

  const prompt = montarPrompt(nomeUsuario, tarefas);

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
    return jsonResponse({ error: 'resumo_indisponivel' }, 503);
  }

  if (!resposta.ok) {
    const status = resposta.status === 429 ? 429 : 503;
    return jsonResponse({ error: status === 429 ? 'limite_excedido' : 'resumo_indisponivel' }, status);
  }

  let dados: any;
  try {
    dados = await resposta.json();
  } catch {
    return jsonResponse({ error: 'resumo_indisponivel' }, 503);
  }

  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    return jsonResponse({ error: 'resumo_indisponivel' }, 503);
  }

  let estruturado: any;
  try {
    estruturado = JSON.parse(textoGerado);
  } catch {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  if (!estruturado.resumo || typeof estruturado.resumo !== 'string') {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  return jsonResponse({ resumo: estruturado.resumo });
});
