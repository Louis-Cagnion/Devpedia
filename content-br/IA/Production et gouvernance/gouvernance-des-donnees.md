---
order: 12
---

# Governança de dados para um sistema de IA

Enviar um dado a um LLM não é neutro: diferente de um banco de dados interno, o dado frequentemente passa por um serviço terceiro hospedado na [nuvem](/?c=infrastructure&p=le-cloud), pode aparecer em registros que não se esperava criar (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), e pode ser retido pelo fornecedor de acordo com condições contratuais que é preciso conhecer antes de enviar qualquer coisa. A governança de dados aplicada a um sistema de IA retoma os princípios clássicos ([RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees), o regulamento europeu que rege a coleta e o tratamento de dados pessoais; controle de acesso; rastreabilidade) adaptando-os a esse trajeto adicional, obrigações que se somam às, específicas do próprio sistema de IA, da [regulamentação europeia de IA](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia).

## Classificar um dado antes de enviá-lo a um modelo

Todo dado que entra em um prompt (pergunta do usuário, documento injetado por um [RAG](/?c=ia&s=nlp-llm&p=rag), resultado de uma ferramenta chamada por um [agente](/?c=ia&s=nlp-llm&p=agents)) merece ser classificado antes do envio, não depois:

| Categoria | Exemplo | Tratamento |
|---|---|---|
| Pública | Documentação já publicada | Nenhuma precaução específica |
| Interna | Procedimento da empresa não confidencial | Verificar as condições contratuais do fornecedor antes do envio |
| Pessoal | Nome, e-mail, telefone de um cliente | Anonimizar ou pseudonimizar antes do envio se o caso de uso permitir, senão um fornecedor em conformidade (hospedagem, contrato) é obrigatório |
| Secreta | Chave de API, senha, segredo comercial | Nunca passar por um prompt, qualquer que seja o fornecedor |

> **Cuidado:** classificar apenas o que o prompt inicial contém explicitamente. Um agente que chama ferramentas (veja [Agentes](/?c=ia&s=nlp-llm&p=agents)) pode trazer para o prompt dados que ninguém decidiu explicitamente colocar ali: o resultado de uma consulta SQL retornada a um modelo, por exemplo, carrega todas as colunas dessa consulta, não apenas a útil para a resposta.
>
> **Boa prática:** fazer a classificação recair sobre o que *pode* passar por uma ferramenta ou busca, não apenas sobre o que o prompt inicial contém explicitamente.

## Rastreabilidade: reconstituir quem pediu o quê

Um sistema de IA em produção precisa conseguir responder depois a *"quem fez essa pergunta, com quais dados, e qual resposta foi produzida?"*, a mesma exigência de um sistema de auditoria clássico, mas com dois registros extras em relação a um CRUD comum: o prompt efetivamente enviado (não só a pergunta bruta do usuário, mas tudo o que foi montado em volta), e a versão exata do modelo que respondeu (veja a deriva de versão em [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)).

> **Nota:** CRUD (*Create, Read, Update, Delete*) designa as quatro operações básicas sobre um dado armazenado: criá-lo, lê-lo, modificá-lo, excluí-lo (os comandos SQL `INSERT`/`SELECT`/`UPDATE`/`DELETE`, veja [SQL](/?c=domain-specific-languages-dsl&p=sql), ou os métodos HTTP `POST`/`GET`/`PUT`/`DELETE` de uma API REST). Uma auditoria "CRUD comum" registra, então, para cada uma dessas quatro ações: quem a disparou, em qual linha, em que momento. Um sistema de IA adiciona mais duas (o prompt montado, a versão do modelo) porque uma resposta depende de muito mais do que apenas o dado modificado: ela também depende de todo o contexto fornecido ao modelo e do próprio modelo, dois elementos que não existem em um CRUD clássico.

## Controle de acesso: o RAG herda as permissões, ou as contorna

Com um [RAG](/?c=ia&s=nlp-llm&p=rag) mal projetado, o banco vetorial indexa documentos de vários níveis de confidencialidade, mas a busca não filtra de acordo com os direitos da pessoa que faz a pergunta.

> **Cuidado:** filtrar por permissão apenas **depois** da busca (revisar a resposta posteriormente). Um usuário que nunca teria acesso direto a um documento pode então ver seu conteúdo citado, reformulado pelo modelo, porque a busca o julgou relevante sem verificar quem tem o direito de vê-lo: uma vez a informação na resposta, o dano está feito.
>
> **Boa prática:** filtrar por permissão **antes** da busca (buscar apenas nos documentos que o usuário tem autorização para ver), nunca só depois do fato.

## Retenção e direito ao esquecimento

Os registros necessários para a rastreabilidade e a avaliação (veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) entram em tensão direta com o direito ao esquecimento: um prompt contendo um dado pessoal, mantido indefinidamente para analisar a qualidade do modelo, é uma retenção de dado pessoal como qualquer outra. Uma política de retenção explícita precisa cobrir esses registros da mesma forma que um banco de dados de negócio: esquecê-los porque são técnicos em vez de funcionais é uma das formas mais comuns de se tornar não conforme sem perceber.

| Elemento da política | Pergunta a que responde | Exemplo concreto |
|---|---|---|
| Duração máxima de retenção | Depois de quanto tempo um dado deve desaparecer ou ser anonimizado? | Registros de prompts mantidos 90 dias em texto claro, depois anonimizados (nome/e-mail substituídos por um identificador genérico) |
| Anonimização após um prazo | É possível manter o dado útil para a análise sem manter a identidade da pessoa? | Após 90 dias, o prompt continua utilizável para medir a qualidade das respostas, mas não permite mais rastrear até um cliente específico |
| Procedimento de exclusão a pedido | O que acontece se uma pessoa exerce seu direito ao esquecimento antes do prazo normal? | Um pedido de RGPD dispara a exclusão do prompt, da resposta, e de qualquer rastro nos registros associados a essa pessoa |
| Exceções documentadas | Certos dados precisam sobreviver mais tempo por um motivo legal (contabilidade, litígio em andamento)? | Uma conversa citada em um processo judicial em andamento é mantida além da duração normal, mas isolada e justificada |

O que complica a questão em relação a um banco de dados de negócio clássico: um dado pessoal enviado a um LLM pode ter sido copiado em vários lugares sem que um único `DELETE` baste para apagá-lo em todos eles.

| Lugar onde o dado pode ter sido copiado | Exclusão disparada por um `DELETE` clássico? |
|---|---|
| Linha no banco de dados da aplicação | Sim |
| Registro de prompts (veja a rastreabilidade acima) | Só se o registro for explicitamente incluído no procedimento de exclusão |
| Índice vetorial de um [RAG](/?c=ia&s=nlp-llm&p=rag), se o documento continha o dado | Não: o embedding gerado a partir do documento precisa ser encontrado e excluído separadamente |
| Registros mantidos pelo fornecedor do modelo (fora da infraestrutura da empresa) | Depende unicamente das condições contratuais do fornecedor, não do que a empresa faz internamente |

> **Cuidado:** tratar o direito ao esquecimento como um simples `DELETE FROM usuarios WHERE id = ...` e considerar o assunto encerrado. Um documento contendo um dado pessoal, uma vez indexado em um RAG, continua existindo na forma de embedding mesmo depois da exclusão do documento fonte, e um fornecedor de modelo terceiro pode manter o prompt de acordo com suas próprias condições contratuais, independentemente do que é excluído do lado da empresa.
>
> **Boa prática:** fazer da exclusão um processo que percorra explicitamente cada lugar onde o dado pode ter sido copiado (banco, registros, índice vetorial), em vez de uma única consulta na tabela de origem, e verificar, antes de escolher um fornecedor, o que seu contrato prevê em termos de retenção e exclusão a pedido.

## O que reter

| | |
|---|---|
| **O que reter** | Todo dado que entra em um prompt precisa ser classificado (pública/interna/pessoal/secreta) antes do envio. Um sistema de IA rastreia dois elementos além de um CRUD comum (o prompt montado, a versão do modelo). Um RAG precisa filtrar por permissão antes da busca, nunca depois. O direito ao esquecimento precisa cobrir todos os lugares onde um dado pode ter sido copiado, não apenas o banco de origem. |
| **Ferramentas úteis** | Uma política de retenção explícita (duração, anonimização, procedimento de exclusão). Uma filtragem por permissão anterior à busca do RAG. |
| **Armadilhas a evitar** | Classificar apenas o conteúdo explícito do prompt inicial, sem contar o que uma ferramenta pode trazer para ele. Filtrar as permissões de um RAG depois da busca em vez de antes. Tratar o direito ao esquecimento como um simples `DELETE` na tabela de origem. |
| **Boas práticas** | Classificar todo dado que *pode* passar, não apenas o que o prompt contém explicitamente. Filtrar por permissão antes da busca do RAG. Fazer da exclusão um processo que percorra todos os lugares onde o dado pode ter sido copiado. |
