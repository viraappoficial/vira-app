import { serve } from 'https://deno.land/std/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function montarPrompt(texto: string, dataAtual: string, espacos: string[], areaAtuacao: string | null) {
  return `Você é o Secretário do Vira, um assistente que transforma uma ideia solta em uma tarefa estruturada.

CONTEXTO:
- Data de hoje: ${dataAtual} (formato YYYY-MM-DD)
- Espaços disponíveis do usuário: ${JSON.stringify(espacos)}
${areaAtuacao ? `- Área de atuação do usuário: ${areaAtuacao} (use isso só como pista de contexto pra interpretar termos ambíguos, nunca invente detalhes que a pessoa não disse)` : ''}

REGRAS:
- Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, sem markdown, sem explicação.
- Primeiro decida se o texto descreve UMA tarefa ou VÁRIAS tarefas separadas. É várias somente quando o texto tem mais de uma ação distinta — verbos diferentes, cada um começando uma atividade própria (ex: "ligar pro fornecedor, mandar o relatório, agendar reunião" = 3 tarefas). É UMA tarefa só quando os itens depois da vírgula são tópicos/detalhes da mesma ação, sem verbo novo (ex: "falar com Rebeca sobre convênios PF, cobrança, forma de pagamento" = 1 tarefa, os itens viram descrição). Na dúvida, prefira UMA tarefa só.
- Responda sempre com "tarefas", uma lista — mesmo quando for só 1 tarefa, a lista tem 1 item.
- Cada item da lista segue o mesmo formato de tarefa abaixo.
- "data_prevista" deve estar no formato exato "YYYY-MM-DD" (ex: "2026-07-30"), ou null se o usuário não mencionar data. Resolva expressões relativas ("amanhã", "sexta que vem") usando a data de hoje como referência.
- "hora" deve estar no formato exato "HH:MM" em 24 horas (ex: "09:00", "14:30"), ou null se o usuário não mencionar horário.
- Infira o espaço mais provável pelo contexto da frase, usando exatamente um dos nomes da lista de espaços disponíveis. Se não for possível inferir, deixe "espaco" como null.
- Infira a prioridade como "alta" só se houver urgência explícita (ex: "urgente", "hoje mesmo", "importante"). Caso contrário, use "media".
- Quando for uma tarefa só: separe a ação principal dos detalhes — "titulo" é uma versão curta (tipo "Falar com Rebeca"), com quem/o quê central da tarefa, sem data/hora/prioridade dentro do texto. "descricao" leva o resto — os detalhes, tópicos, contexto que a pessoa mencionou, como uma lista curta separada por vírgula ou frase corrida, sem repetir o que já virou "titulo". Se não sobrar detalhe nenhum além do título, "descricao" é null.
- Quando forem várias tarefas: cada uma vira um item com seu próprio "titulo" curto (a ação em si) e "descricao" null, a menos que aquela ação específica tenha um detalhe próprio mencionado.
- Data/hora/espaço/prioridade só se aplicam ao item que ela pertence — se só uma das tarefas tem horário mencionado, as outras ficam com hora null.

FORMATO DE SAÍDA (exato):
{
  "tarefas": [
    {
      "titulo": string,
      "descricao": string | null,
      "data_prevista": string | null,
      "hora": string | null,
      "espaco": string | null,
      "prioridade": "baixa" | "media" | "alta"
    }
  ]
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

  let texto: string, dataAtual: string, espacos: string[], areaAtuacao: string | null;
  try {
    const body = await req.json();
    texto = body.texto;
    dataAtual = body.dataAtual;
    espacos = body.espacos || [];
    areaAtuacao = body.areaAtuacao || null;
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

  const prompt = montarPrompt(texto, dataAtual, espacos, areaAtuacao);

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

  const lista = Array.isArray(estruturado.tarefas) ? estruturado.tarefas : [estruturado];
  if (lista.length === 0) {
    return jsonResponse({ error: 'resposta_invalida' }, 503);
  }

  return jsonResponse({
    tarefas: lista.map((t: any) => ({
      titulo: t.titulo ?? null,
      descricao: t.descricao ?? null,
      data_prevista: t.data_prevista ?? null,
      hora: t.hora ?? null,
      espaco: t.espaco ?? null,
      prioridade: t.prioridade ?? 'media',
    })),
  });
});
