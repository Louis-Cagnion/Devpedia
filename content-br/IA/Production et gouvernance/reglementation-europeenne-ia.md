---
order: 13
---

# Regulamentação europeia de IA: o AI Act

O **regulamento europeu sobre inteligência artificial** (*AI Act*, regulamento (UE) 2024/1689) é o primeiro marco jurídico horizontal do mundo dedicado à IA: em vez de regular setor por setor, ele impõe obrigações de acordo com o **nível de risco** de um sistema de IA, qualquer que seja seu domínio de aplicação. Publicado no Jornal Oficial em 12 de julho de 2024, ele entrou em vigor em 1º de agosto de 2024, mas sua aplicação é **escalonada por vários anos**, não imediata.

## Uma classificação por nível de risco

| Nível de risco | Exemplos | Obrigação |
|---|---|---|
| **Inaceitável** | Pontuação social por um Estado, manipulação subliminar, reconhecimento facial em massa em tempo real em espaços públicos (com exceções limitadas para as forças de segurança) | Proibido pura e simplesmente |
| **Elevado** | Recrutamento, pontuação de crédito, sistemas críticos (energia, transporte), dispositivos médicos, justiça | Avaliação de conformidade, documentação técnica, supervisão humana, gestão de riscos, rastreabilidade |
| **Limitado** | Chatbot, gerador de deepfake | Obrigação de transparência (informar o usuário de que está interagindo com uma IA, sinalizar um conteúdo gerado) |
| **Mínimo** | Filtro antispam, IA de um videogame | Nenhuma obrigação específica |

Um chatbot (veja [Construindo um chatbot](/?c=ia&s=applications-llm&p=chatbot)) geralmente se encaixa na categoria "risco limitado": sua obrigação principal é nunca deixar o usuário achar que está falando com um humano sem esclarecer isso.

> **Cuidado:** subestimar o nível de risco do próprio sistema por otimismo ou desconhecimento: um chatbot que parece inofensivo pode passar para "risco elevado" se, por exemplo, participar de uma decisão de recrutamento ou de pontuação de crédito, dois casos explicitamente listados nesse nível.
>
> **Boa prática:** avaliar o nível de risco a partir do uso real do sistema (o domínio em que ele atua), não apenas de sua tecnologia subjacente: dois chatbots tecnicamente idênticos podem se encaixar em dois níveis de risco diferentes de acordo com seu uso.

## O cronograma de aplicação

Diferente de um regulamento que se aplicaria de uma vez, o AI Act entra em vigor **em etapas**, cada uma adicionando novas obrigações:

| Data | O que se torna aplicável |
|---|---|
| **1º de agosto de 2024** | Entrada em vigor do regulamento (o texto existe juridicamente, mas a maioria das obrigações ainda não é exigível) |
| **2 de fevereiro de 2025** | Proibição das práticas de risco inaceitável; obrigação de cultura de IA (treinar o pessoal que projeta ou usa sistemas de IA) |
| **2 de agosto de 2025** | Obrigações para os modelos de IA de uso geral (GPAI, veja abaixo); criação das autoridades de controle nacionais e do Escritório Europeu de IA; regime de sanções aplicável |
| **2 de agosto de 2026** | Aplicação da maior parte do regulamento: obrigações para os sistemas de risco elevado (anexo III), obrigações de transparência para o risco limitado (chatbots, deepfakes) |
| **2 de agosto de 2027** | Prazo adicional para os sistemas de risco elevado que são componentes de segurança de produtos já regulamentados (dispositivos médicos, máquinas, brinquedos...) |

> **Uma tensão concreta, ainda em aberto atualmente:** as obrigações para os sistemas de risco elevado são legalmente exigíveis desde agosto de 2026, mas as **normas técnicas harmonizadas** que deveriam especificar como cumpri-las concretamente (elaboradas pelos organismos de normalização [CEN-CENELEC](https://www.cencenelec.eu), grupo JTC 21) ainda estão em fase de finalização. Uma empresa pode, portanto, se ver obrigada a cumprir uma exigência legal antes que o manual técnico oficial exista plenamente, uma situação a acompanhar, não um simples detalhe administrativo.

> **Cuidado:** supor que nenhuma obrigação se aplica enquanto o prazo de 2026 não for alcançado. As proibições de práticas de risco inaceitável e as obrigações para os modelos GPAI já estão, elas sim, em vigor desde 2025.
>
> **Boa prática:** verificar a data de aplicação específica de **cada** categoria de obrigação envolvida (proibições, GPAI, risco elevado, risco limitado), em vez de reter uma única data para todo o regulamento.

## Os modelos de IA de uso geral (GPAI)

Um grande modelo de linguagem (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) não é projetado para um único uso: ele serve de base para usos muito variados. O AI Act cria para essa categoria ("*General-Purpose AI*", GPAI) obrigações específicas, aplicáveis desde 2 de agosto de 2025:

- Documentação técnica sobre o treinamento e as capacidades do modelo, disponível para as autoridades.
- Respeito ao direito de autor sobre os dados de treinamento (deve existir uma política de conformidade).
- Transparência sobre o conteúdo usado no treinamento (um resumo suficientemente detalhado, sem exigir a divulgação completa dos dados).

Os modelos considerados de **risco sistêmico** (além de um limite de poder de cálculo de treinamento) carregam obrigações reforçadas: avaliação adversarial (*red teaming*), notificação de incidentes graves, cibersegurança reforçada. Um **Código de boas práticas** voluntário para os fornecedores de GPAI foi publicado em 2025 para ajudar a antecipar essas obrigações antes que a supervisão regulatória se intensifique.

> **Cuidado:** confundir as obrigações do **fornecedor** de um modelo GPAI (documentação técnica, conformidade com direito de autor...) com as de uma empresa que apenas **usa** esse modelo já existente (via uma API, por exemplo): as obrigações GPAI recaem sobre quem constrói e distribui o modelo, não sobre quem o usa para construir um produto sobre ele.
>
> **Boa prática:** identificar claramente seu próprio papel (fornecedor de modelo, ou simples usuário de um modelo terceiro) antes de determinar quais obrigações do AI Act realmente se aplicam ao seu caso.

## Supervisão humana: uma obrigação, não uma opção

Para um sistema de risco elevado, o AI Act impõe uma supervisão humana efetiva, retomando diretamente um princípio já visto para os [agentes](/?c=ia&s=nlp-llm&p=agents): um sistema autônomo nunca deve poder decidir sozinho uma ação com consequência real sem que um humano possa intervir ou interrompê-lo. O que o bom senso técnico já recomendava se torna, para os casos de risco elevado, uma obrigação legal documentada.

## O que isso muda em relação ao RGPD

O AI Act **não** substitui o [RGPD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees): ele se soma a ele. A [governança de dados](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) (classificação, rastreabilidade, controle de acesso) continua necessária independentemente do AI Act: o RGPD rege o próprio dado pessoal, o AI Act rege o **sistema de IA** que o processa: os dois conjuntos de obrigações se somam em vez de se substituir um ao outro.

## Sanções

As multas são escalonadas de acordo com a gravidade da infração, até 35 milhões de euros ou 7% do faturamento mundial anual para uma prática proibida (o maior dos dois valores), um nível comparável, deliberadamente, ao do RGPD.

## O que reter

| | |
|---|---|
| **O que reter** | O AI Act classifica os sistemas de IA por nível de risco (inaceitável, elevado, limitado, mínimo), com obrigações crescentes, aplicadas em etapas entre 2024 e 2027. Ele se soma ao RGPD em vez de substituí-lo, e impõe uma supervisão humana efetiva para todo sistema de risco elevado. |
| **Ferramentas úteis** | O Código de boas práticas voluntário para os fornecedores de GPAI, publicado em 2025, para antecipar as obrigações antes da intensificação da supervisão regulatória. |
| **Armadilhas a evitar** | Subestimar o nível de risco do próprio sistema considerando apenas seu uso real. Supor que nenhuma obrigação se aplica antes de 2026 quando algumas já estão em vigor. Confundir as obrigações de um fornecedor de modelo GPAI com as de um simples usuário. |
| **Boas práticas** | Avaliar o nível de risco a partir do uso real do sistema, não apenas de sua tecnologia. Verificar a data de aplicação específica de cada categoria de obrigação. Identificar claramente seu papel (fornecedor ou usuário) antes de determinar as obrigações aplicáveis. |
