# Guia técnico: o Secretário (IA) do Vira

> Este documento explica **por que** chegamos nas decisões técnicas do Secretário (funcionalidade de IA da Fase 2), não só **o que** fazer. O objetivo é que qualquer pessoa (ou agente) que for implementar isso entenda o raciocínio, não só copie o resultado.

---

## 1. O que é o Secretário

Funcionalidade descrita na documentação original do Vira (Fase 2): o usuário digita ou fala uma ideia solta ("preciso ligar pro fornecedor amanhã de manhã"), e o sistema transforma isso numa tarefa estruturada (título, data, horário, espaço, prioridade) — pronta pra confirmar e salvar, sem o usuário precisar preencher formulário nenhum.

Isso ataca diretamente a dor central do produto: a fricção entre "ter uma ideia" e "ela estar registrada" (ver frase-alma do Vira: *"Não é mais um sistema pra manter. É só o que você precisa lembrar."*).

---

## 2. Por que não usar IA para tudo

Nem toda "inteligência" da Fase 2 precisa de um modelo de linguagem:

| Funcionalidade | Precisa de IA? | Por quê |
|---|---|---|
| Detecção de padrão (tarefa sempre atrasada) | **Não** | É contagem simples no banco (quantas vezes essa tarefa foi reagendada) |
| Priorização automática | **Não, na maioria dos casos** | Regra de data + prioridade manual já resolve; IA só ajudaria em casos ambíguos |
| Secretário (texto solto → tarefa estruturada) | **Sim** | Exige interpretar linguagem natural livre, isso é o que modelos de linguagem fazem bem |
| Resumo do dia | **Sim, mas é barato** | Resumir uma lista curta de tarefas é uma tarefa simples pra qualquer modelo |

**Princípio de design:** só usar IA onde ela é realmente necessária. Isso reduz custo, reduz pontos de falha, e mantém o produto mais simples de manter.

---

## 3. Por que começamos com Gemini (Google) em vez de Claude (Anthropic)

Isso não é sobre qual modelo é "melhor" — é sobre o estágio atual do projeto.

**Contexto do estágio:** o Vira ainda está na fase de **validação pessoal** (dogfooding, decidido antes do lançamento comercial). Não há usuários pagantes ainda. Qualquer custo de infraestrutura nessa fase é dinheiro saindo sem receita entrando — o objetivo é manter esse custo em zero enquanto possível, sem comprometer a qualidade do que está sendo testado.

**Comparação relevante para essa tarefa específica (extração de texto → estrutura simples):**
- Para tarefas de classificação/extração simples (exatamente o que o Secretário faz), modelos da linha "Flash" do Gemini são adequados — é literalmente a categoria de uso para a qual esses modelos foram otimizados (throughput alto, tarefas simples, custo baixo).
- A diferença de qualidade entre Gemini Flash e Claude Haiku, para uma tarefa desse tamanho e simplicidade, tende a ser pequena o suficiente para não ser perceptível pelo usuário final.
- Onde Haiku genuinamente se destaca (engenharia de software, orquestração de múltiplos agentes, seguir instruções complexas em várias etapas) não é o que o Secretário faz.

**A vantagem decisiva do Gemini agora:** o free tier da Google oferece uso gratuito real (sem cartão de crédito, sem expiração), com volume suficiente para cobrir uso pessoal intenso e até os primeiros usuários beta. O free tier da Anthropic para a API não existe da mesma forma — a API da Anthropic é paga desde a primeira chamada.

**Trade-off aceito conscientemente:** no free tier do Gemini, os prompts e respostas podem ser usados pelo Google para treinar modelos. Isso é inadequado para um produto em produção com dados sensíveis de muitos usuários pagantes — mas é um trade-off aceitável na fase atual (validação pessoal, dados não sensíveis de terceiros).

---

## 4. Por que a arquitetura isola a chamada de IA numa função própria

**Decisão:** toda chamada ao modelo de linguagem deve passar por uma única função/módulo (ex: `chamarSecretario(texto)`), nunca ser chamada diretamente em vários lugares do código.

**Por quê:** o motor de IA por trás dessa função vai mudar ao longo do tempo — hoje é Gemini (grátis), no futuro provavelmente será Claude Haiku (pago, quando houver receita para justificar). Se a chamada estiver espalhada pelo código, trocar de provedor significa caçar e editar múltiplos lugares, com risco de inconsistência. Se estiver isolada numa função, a troca é local: muda o que está dentro da função, o resto do app nem percebe.

Isso também facilita testes e fallback (ex: se o Gemini estiver fora do ar ou o limite diário for atingido, a função poderia, no futuro, cair para outro provedor sem que o resto do app precise saber disso).

---

## 5. Segurança: onde a chamada de IA deve rodar

**Nunca no cliente (app do usuário, seja web ou mobile).** A chamada ao Gemini (ou futuramente à Anthropic) deve rodar numa **Supabase Edge Function** — um pedaço de código que roda no servidor, não no dispositivo do usuário.

**Por quê:** a chave de API (mesmo a do Gemini, mesmo sendo gratuita) não deve ficar exposta no código que roda no navegador ou no app do usuário — qualquer pessoa poderia abrir o inspecionar do navegador, copiar a chave, e usá-la pra consumir sua cota gratuita (ou pior, gerar custo numa chave paga futura). A Edge Function atua como intermediária: o app manda o texto pra Edge Function, a Edge Function chama o Gemini usando a chave guardada como variável de ambiente no servidor, e devolve só o resultado estruturado pro app.

---

## 6. O prompt do Secretário

Prompt de sistema estruturado para forçar saída em JSON puro, sem texto explicativo ao redor, com formatos de data/hora explícitos para casar com a validação já existente no app.

```
Você é o Secretário do Vira, um assistente que transforma uma ideia solta em uma tarefa estruturada.

CONTEXTO:
- Data de hoje: {DATA_ATUAL} (formato YYYY-MM-DD)
- Espaços disponíveis do usuário: {LISTA_DE_ESPACOS}

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
"{TEXTO_DO_USUARIO}"
```

**Uso prático:** substituir `{DATA_ATUAL}`, `{LISTA_DE_ESPACOS}` e `{TEXTO_DO_USUARIO}` pelos valores reais antes de enviar à API.

---

## 6.5 Implementação

Edge Function `supabase/functions/secretario/index.ts`, com tratamento de preflight CORS (`OPTIONS`) e guard contra respostas malformadas/erro do Gemini — sem isso, chamadas do navegador podem falhar silenciosamente e um erro de cota/safety block da API derruba a função sem resposta amigável.

Do lado do cliente, `lib/secretario.js` chama a função via `supabase.functions.invoke`, e o mapeamento de nome de espaço → `espaco_id` acontece no cliente (fuzzy match contra a lista real de espaços do usuário), já que a Edge Function só recebe os nomes, não os ids.

**Setup necessário antes de funcionar:**
1. Criar conta gratuita no [Google AI Studio](https://aistudio.google.com) e gerar uma API key do Gemini
2. Configurar essa key como variável de ambiente secreta no Supabase (`GEMINI_API_KEY`)
3. Deploy da função

**Fluxo no app:** o usuário digita a ideia solta no campo de título do "Nova tarefa" e toca em "Preencher com Secretário" — os campos (título limpo, data, hora, espaço, prioridade) são pré-preenchidos, mas nada é salvo automaticamente. O usuário revisa e confirma no botão normal de criar tarefa.

---

## 7. Caminho de migração futura (quando houver receita)

Quando o Vira tiver usuários pagantes suficientes para justificar o custo:

1. Criar conta própria no Anthropic Console (`console.claude.com`), preferencialmente com o e-mail dedicado do projeto (`vira.app.oficial@gmail.com`), separada de qualquer conta pessoal — mesma lógica de separação já aplicada em Supabase e GitHub
2. Adicionar método de pagamento e gerar uma API key — essa key é secreta e vai como variável de ambiente na mesma Edge Function que já isola essa chamada
3. Trocar o "motor" dentro da função de Gemini para Claude Haiku — o prompt acima funciona nos dois, com ajustes mínimos de formato de chamada de API
4. Nesse ponto, o custo de IA já vira parte natural do modelo de negócio (IA restrita ao plano pago, como já decidido) — o custo por usuário fica na casa de centavos, coberto com folga pela própria assinatura

---

## 8. Resumo da decisão

| Pergunta | Resposta | Motivo |
|---|---|---|
| Toda funcionalidade "inteligente" precisa de IA? | Não | Regras simples cobrem detecção de padrão e priorização básica |
| Qual modelo usar agora? | Gemini Flash (free tier) | Gratuito, sem cartão, volume suficiente pra validação, qualidade adequada pra tarefa simples |
| Onde a chamada deve rodar? | Supabase Edge Function | Nunca expor chave de API no cliente |
| Como estruturar o código? | Função isolada (Edge Function + `lib/secretario.js` no cliente) | Troca de provedor no futuro sem retrabalho no resto do app |
| Quando migrar pra Haiku pago? | Quando houver usuários pagantes reais | Custo se paga sozinho com a própria assinatura do usuário |
