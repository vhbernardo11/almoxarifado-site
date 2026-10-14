# Gestão ACS 360 — Integração ESF06 (V41 / Campo V42)

Atualização: 14/10/2026

## Objetivo
Manter o Supabase do Gestão ACS 360 como fonte única. As visitas registradas no site e as alterações autorizadas feitas por ferramentas conectadas devem aparecer no mesmo banco, preservando autoria e estado de sincronização.

## Estado atual
- Aplicação principal: `esf06-producao/v41.html` (V41).
- Aplicativo de campo: `acs-visita-campo/` (código de salvamento de visita familiar V42).
- Nova função: `acs-visita-unificada`, fonte nesta pasta, publicada no projeto Supabase existente.
- API anterior `acs-visita-api` permanece para consultas e os registros individuais legados.
- A função nova exige chave pessoal ativa no cabeçalho `Authorization: Bearer ...`; **não** utilizar service role, token em URLs ou chave em código versionado.
- O módulo de campo usa IndexedDB para fila offline; resposta `queued` **não significa** visita gravada no Supabase.
- O histórico oficial do e-SUS/MIKA é distinto do histórico de produção local: `official=false` até lançamento e reconciliação oficiais.

## Endpoint de visita familiar
`POST /functions/v1/acs-visita-unificada?api=save_family_visit_atomic`

Campos de entrada: `group_id` (UUID estável/idempotência), `person_id` (pessoa de referência), `visit_date` (AAAA-MM-DD), `visit_time` (opcional), `member_ids` (participantes realmente presentes), `agenda_item_id` (opcional), `general_notes`, `signer_name` e `signature_data` (opcionais).

A operação valida vínculo familiar e autenticação, confere duplicação, realiza gravação de grupo, integrantes, visita e ficha **em uma transação** e devolve IDs persistidos. Mesma requisição repetida com o mesmo `group_id` não cria novo registro. Visita da mesma família e data com outro identificador retorna `409` para conferência. Não preencher automaticamente pacientes ausentes.

## Fluxo de dados
1. Consulta dos registros por canal autorizado.
2. Conferência de pessoa, família e data.
3. Definição explícita de participantes e desfecho.
4. Escrita transacional com confirmação.
5. Leitura de retorno para verificar persistência.
6. Operações offline ficam pendentes até resposta confirmada; erros 4xx exigem revisão, sem descartar fila silenciosamente.

## Integração pelo ChatGPT
O ChatGPT pode utilizar o conector Supabase autorizado para consultas e alterações **quando a ferramenta e as permissões permitirem**. O conector atual não oferece uma ação genérica de invocação de Edge Functions. A publicação desta API não elimina bloqueios de segurança impostos à ferramenta de escrita do ChatGPT, nem autoriza suplantar autenticação. Não informar ao usuário que um registro foi salvo sem retorno de sucesso e verificação no banco.

## Verificações técnicas realizadas
- Função nova reportou status `ACTIVE` e versão 1.
- Requisição GET pública, sem informações de paciente, retornou `ok: true`.
- Página pública de campo sem chave retornou exigência de autenticação.
- Arquivos JS de campo foram compilados sintaticamente por verificação local.
- Uma gravação real de ponta a ponta ainda exige teste controlado com autorização; não foram produzidos registros de paciente para simulação.

## Segurança pendente
O diagnóstico do Supabase aponta tabelas sem RLS e funções privilegiadas com recomendações de endurecimento; revisar permissões e políticas antes de mudanças, sem aplicar RLS indiscriminadamente em tabelas privadas ou operações existentes. Rotacionar a chave pessoal previamente compartilhada depois de validar novo mecanismo de acesso. Não fazer transmissão automática ao PEC e-SUS sem autorização.

## Plano de regressão
- Abertura V41 no navegador com sessão válida.
- Visita familiar online com participantes confirmados.
- Reenvio de `group_id` idêntico sem duplicação.
- Tentativa de visita duplicada na mesma data retornando `409`.
- Fila offline, retorno online, confirmação via consulta ao Supabase.
- Visita individual pelo fluxo legado e distinção correta entre fila pendente e salva.
- Busca de visitas e contagens sem transformá-las em produção oficial e-SUS.
