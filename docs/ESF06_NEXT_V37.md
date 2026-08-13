# ESF06 NEXT / Gestão ACS 360 v37

Branch de desenvolvimento: `esf06-next`.

## Regra de ouro

Nenhuma mudança estrutural nova deve ser testada diretamente no banco de produção. A produção continua sendo a fonte oficial até a criação e validação do ambiente de homologação.

## Escopo v37

1. Central de qualidade cadastral
2. Ficha mestre longitudinal
3. Painéis de acompanhamento
4. Encaminhamentos com fluxo completo
5. Vacinação estruturada por registro/dose
6. Território inteligente com geolocalização confirmada
7. Modo campo/offline com fila idempotente e estados de sincronização
8. Desenvolvimento em homologação antes de produção

## Estado atual no branch

- Central operacional v37 incorporada ao menu Mais do branch de desenvolvimento.
- Central de qualidade calcula pendências a partir de `acs_people` e `acs_families` sem alterar produção.
- Painéis operacionais separam marcador familiar de identificação nominal.
- Encaminhamentos antigos são lidos de `acs_tasks`, sem inventar etapas que a tabela antiga não possui.
- Vacinação exibe somente `acs_vaccination_reviews` documentados.
- Território audita endereço antes de georreferenciar.
- Ficha do paciente foi convertida em ficha mestre longitudinal, reunindo família, condições, visitas, agenda, encaminhamentos e vacinação documentada.

## Banco novo proposto

O arquivo `docs/ESF06_NEXT_SCHEMA_V37.sql` descreve as tabelas novas. Ele é um rascunho de schema para homologação, não uma migration aplicada.

## Offline

A fila offline deve obedecer:

- UUID do grupo/formulário gerado antes do primeiro envio;
- somente operações idempotentes entram na fila;
- estados visíveis: salvo no aparelho / enviando / sincronizado / erro;
- remoção do payload local somente após confirmação do Supabase;
- cache local restrito aos pacientes/famílias necessários ao trabalho de campo;
- nenhuma agenda ou sugestão inteligente deve ser criada automaticamente ao sincronizar.

## Roteiro inteligente

Regra preservada em todas as fases: nenhuma sugestão é criada ou exibida automaticamente. O cálculo de até cinco visitas complementares só ocorre após ação explícita do usuário em `Roteiro inteligente`.