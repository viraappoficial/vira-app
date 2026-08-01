# Modo Organização — Fase A (fundação)

Primeira fatia do Modo Organização (ver seção 7.6 do briefing pro desenho completo).
Essa etapa é só **fundação de banco** — cria as tabelas, a árvore de setores e as regras
de visibilidade. Ainda não tem tela nenhuma no app; isso vem nas próximas etapas.

## O que essa etapa entrega

- Tabelas `organizacoes`, `setores` (em árvore, via extensão `ltree`), `membros_organizacao`,
  `convites_organizacao`.
- Campos novos em `espacos`: `organizacao_id` e `visivel_para_lider`.
- Regra de RLS: um líder enxerga (só leitura) as tarefas de quem está no seu setor pra baixo
  na árvore, desde que a tarefa esteja num espaço marcado como visível — sem isso, tudo
  continua 100% privado, exatamente como hoje.
- Edge Function `criar-organizacao` — cria a organização, o setor "Geral" padrão, e te
  coloca como líder, tudo de uma vez (precisa de service role porque a tabela de membros
  não aceita inserção direta do cliente, por segurança).

## 1. Rodar a migration

No SQL Editor do Supabase, rode o conteúdo de
`supabase/migrations/20260801000000_add_modo_organizacao_fase_a.sql`.

## 2. Deploy da Edge Function

Crie uma função **"Via Editor"** com o nome exato **`criar-organizacao`**, cole o conteúdo
de `supabase/functions/criar-organizacao/index.ts`, e deixe **"Verify JWT" LIGADO** (só
quem está logado pode criar uma organização).

Não precisa configurar nenhum secret novo — usa os que já existem por padrão.

## 3. Testar (via SQL, sem tela ainda)

Depois do deploy, dá pra testar chamando a função direto (com um token de usuário válido)
ou, mais simples, testando manualmente pelo SQL Editor:

```sql
-- Simula o que a Edge Function faz, pra conferir que a árvore calcula certo
insert into organizacoes (nome, dono_id) values ('Prime', '<seu-user-id>') returning id;
-- pega o id retornado e usa abaixo
insert into setores (organizacao_id, nome) values ('<org-id>', 'Geral') returning id, caminho;
insert into setores (organizacao_id, nome, setor_pai_id) values ('<org-id>', 'Vendas', '<id-do-geral>') returning id, caminho;
-- o caminho do setor "Vendas" deve vir como <caminho-do-geral>.<id-do-vendas-sem-hifen>
```

Depois de conferir, pode apagar os dados de teste (`delete from organizacoes where nome = 'Prime';` — o cascade cuida do resto).

## Limitação conhecida (v1)

Mover um setor pra outro pai depois de criado **não é suportado ainda** — o `caminho`
(ltree) só é calculado na criação. Se precisar reorganizar a árvore, por enquanto é
recriar o setor. Registrado como melhoria futura, não bloqueia o uso normal.

## Próximas etapas (ainda não implementadas)

3. Tela "Criar organização" no app (reaproveitando o visual de "Novo espaço").
4. Migração de espaço pessoal existente → organizacional (pra Prime).
5. Convite por link + Edge Functions `validar-convite`/`aceitar-convite`.
6. Tela "Equipe" (board agregado, mobile + desktop).
