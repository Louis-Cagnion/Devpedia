---
order: 1
---

# Monitoramento e gestão operacional de um LLM

Monitorar um serviço clássico se reduz a monitorar um [código de status HTTP](/?c=infrastructure&p=api-et-http): `200`, está bom; `500`, quebrou. Uma chamada a um LLM quase sempre responde `200`: a pergunta nunca é *"ele respondeu?"* mas *"a resposta é boa, e custou o que deveria custar?"*. É essa diferença que torna o monitoramento de um sistema baseado em LLM estruturalmente diferente de um monitoramento de aplicação clássico.

## O que registrar em log

Um sistema em produção precisa guardar, para cada chamada, o suficiente para reconstituir e auditar o que aconteceu:

| Dado | Por quê |
|---|---|
| Prompt completo enviado (system + histórico + pergunta) | Reproduzir um comportamento inesperado exige saber exatamente o que o modelo recebeu |
| Resposta produzida | Sem ela, nenhuma avaliação posterior é possível |
| Número de tokens de entrada e saída | É a base do custo (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) e um indicador de anomalia (um prompt cujo tamanho explode sem razão geralmente sinaliza um bug anterior) |
| Latência | Detecta uma degradação do serviço antes que um usuário reclame |
| Identificador e versão do modelo | Veja abaixo: essa versão muda mais do que se imagina |

> **Cuidado:** registrar o prompt e a resposta sem cuidado. Eles podem conter dados pessoais ou sensíveis dependendo do que o usuário escreveu: guardá-los como estão reproduz exatamente o problema que a [governança de dados](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) busca evitar.
>
> **Boa prática:** criptografar esses registros em repouso e aplicar a eles um período de retenção limitado, no mínimo; veja a [política de retenção](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) detalhada em outro capítulo.

## A deriva silenciosa de versão

Um fornecedor de LLM atualiza seu modelo regularmente, às vezes sob o mesmo nome comercial (uma atualização menor, um ajuste de segurança, uma mudança de comportamento padrão). Um sistema que chama "o modelo X" sem fixar uma versão precisa pode, então, ver seu comportamento mudar de um dia para o outro, sem que nenhuma linha do seu próprio código tenha mudado: o bug mais difícil de diagnosticar é o que não tem nenhum commit associado.

> **Cuidado:** chamar "o modelo X" sem fixar uma versão precisa, supondo que seu comportamento vai permanecer estável ao longo do tempo.
>
> **Boa prática:** fixar uma versão explícita em vez de "a última disponível", e só migrar para uma nova versão depois de testá-la em um conjunto de casos conhecidos (veja abaixo), a mesma solução usada para qualquer dependência externa.

## Avaliar uma saída que nunca é idêntica duas vezes

O não determinismo de um LLM (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) torna inútil um teste clássico do tipo "a saída deve ser exatamente essa string". Duas abordagens se combinam na prática:

**Um conjunto de casos de referência (*golden set*).** Uma lista de prompts representativos cuja resposta esperada (ou os critérios que uma boa resposta deve atender) é conhecida, executada novamente a cada mudança: de prompt, de modelo, de versão. É o equivalente de uma suíte de testes de regressão, adaptada a uma saída aproximada em vez de exata.

**Um segundo LLM como avaliador (*LLM-as-judge*).** O juiz recebe a pergunta, a resposta produzida, e às vezes uma resposta de referência, e então nota a resposta de acordo com critérios explícitos (exatidão, tom, comprimento). Isso permite avaliar milhares de casos sem revisão humana sistemática, reservando o olhar humano para os casos que o juiz sinaliza como dúbios.

> **Cuidado:** tratar o veredito de um LLM-as-judge como infalível. O juiz herda as mesmas limitações de um LLM comum (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)), incluindo a possibilidade de errar com a mesma segurança de um julgamento correto.
>
> **Boa prática:** reservar a avaliação humana para os casos que o juiz sinaliza como dúbios, e verificar periodicamente uma amostra de seus veredictos considerados "bons", não apenas os que ele mesmo sinaliza como incertos.

## O cache semântico: evitar recalcular uma resposta já conhecida

Um cache clássico associa uma resposta a uma **chave exata**: a mesma chave devolve a mesma resposta, uma chave ligeiramente diferente (uma reformulação) erra o cache e dispara uma nova chamada, mesmo que a pergunta feita fosse na verdade a mesma. Um **cache semântico** resolve esse problema comparando as perguntas por **similaridade de significado** em vez de igualdade de texto, com a mesma técnica de busca por embedding do [RAG](/?c=ia&s=nlp-llm&p=rag):

```text
Pergunta 1: "Qual e o preco da assinatura Pro?"
             -> chamada LLM, resposta armazenada em cache com seu embedding

Pergunta 2: "Quanto custa o plano Pro?"
             -> embedding proximo da pergunta 1 (similaridade > limiar)
             -> resposta em cache devolvida, NENHUMA chamada LLM
```

| | Cache clássico | Cache semântico |
|---|---|---|
| Correspondência | Chave exata (string idêntica) | Similaridade de embedding acima de um limiar |
| Erra uma reformulação? | Sim, sistematicamente | Não, enquanto o significado permanecer próximo |
| Custo evitado | Apenas a pergunta exata já feita | Qualquer pergunta semanticamente próxima de uma já feita |

> **Cuidado:** um limiar de similaridade permissivo demais faz corresponder duas perguntas de significado realmente diferente ("cancelar meu pedido" e "cancelar minha assinatura" podem estar próximas no espaço de embeddings), devolvendo então uma resposta em cache que não responde à pergunta real, com a mesma confiança de uma resposta correta.
>
> **Boa prática:** ajustar o limiar de similaridade de forma conservadora (mesmo que isso signifique perder algumas reformulações válidas), e invalidar as entradas do cache quando a informação subjacente mudar, o mesmo problema de desatualização de qualquer cache clássico.

Uma [passarela LLM](/?c=ia&s=production-et-gouvernance&p=stack-ia) geralmente centraliza esse cache em escala para todos os aplicativos que a utilizam, em vez de cada um reimplementar o seu.

## As proteções operacionais

> **Cuidado:** um pico de tráfego (legítimo, ou um loop de agente mal limitado, veja o capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents)) pode fazer explodir uma fatura em poucos minutos sem que nenhum alerta de "erro" seja disparado, já que cada chamada individual é bem-sucedida.
>
> **Boa prática:** implementar um limitador de taxa e de custo, e um painel de custo por funcionalidade, por cliente ou por usuário, não um luxo: isso evita descobrir a fatura só no fim do mês.

> **Cuidado:** se o modelo principal ficar indisponível ou muito lento, retornar diretamente um erro ao usuário em vez de degradar o serviço.
>
> **Boa prática:** prever um plano de contingência (*fallback*) para um modelo mais simples em caso de indisponibilidade ou lentidão excessiva: degradar o serviço em vez de interrompê-lo.

A filtragem de entradas e saídas (detectar uma tentativa de instrução maliciosa, veja a [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), e filtrar uma saída antes que ela chegue ao usuário) completa essas proteções.

## O que reter

| | |
|---|---|
| **O que reter** | O monitoramento de um LLM foca na qualidade e no custo da resposta, não em um simples código de status. Registrar prompt, resposta, tokens, latência e versão do modelo permite reconstituir um incidente. Um golden set e um LLM-as-judge substituem um teste clássico diante do não determinismo. Um cache semântico evita recalcular uma resposta para uma pergunta reformulada mas equivalente. |
| **Ferramentas úteis** | Um painel de custo por funcionalidade/cliente. Um golden set executado novamente a cada mudança. Um limitador de taxa e de custo, um plano de contingência para um modelo mais simples. Um cache semântico, geralmente centralizado em uma passarela LLM. |
| **Armadilhas a evitar** | Registrar prompt/resposta sem criptografia nem retenção limitada. Chamar um modelo sem versão fixada. Tratar um LLM-as-judge como infalível. Deixar um pico de tráfego ou uma falha degradar a fatura ou o serviço sem proteção. Um limiar de similaridade de cache semântico permissivo demais. |
| **Boas práticas** | Criptografar os registros e limitar sua retenção. Fixar uma versão explícita do modelo. Verificar periodicamente uma amostra dos veredictos de um LLM-as-judge. Implementar limitador de custo e plano de contingência automático. Ajustar o limiar de similaridade do cache semântico de forma conservadora. |
