---
order: 10
---

# RAG: aumentar um LLM com dados externos

Um LLM só conhece o que viu no treinamento, até uma data de corte (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)): ele não conhece seus documentos internos, sua base de conhecimento, ou qualquer coisa que tenha acontecido depois dessa data. O **RAG** (*Retrieval-Augmented Generation*, geração aumentada por busca documental) resolve esse problema buscando, no momento da pergunta, os documentos relevantes e injetando-os no prompt antes de pedir a resposta.

## Por que não simplesmente retreinar o modelo?

Retreinar ou ajustar (*fine-tuning*) um modelo com seus próprios dados é uma alternativa, mas com um custo e um prazo que o RAG evita:

| | Fine-tuning | RAG |
|---|---|---|
| Atualização de um dado | Exige um novo treinamento | Basta modificar o documento fonte |
| Custo | Alto (cálculo, tempo) | Custo de uma busca + de um prompt maior |
| Rastreabilidade da resposta | Difusa (diluída nos pesos do modelo) | Explícita: os documentos usados são identificáveis |
| Adequado para | Mudar o *estilo* ou o comportamento do modelo | Dar a ele acesso a *fatos* que mudam ou são privados |

O RAG e o fine-tuning não se excluem: um modelo pode ser ajustado para explorar melhor documentos recuperados, ao mesmo tempo em que continua sendo alimentado por RAG para o conteúdo factual.

## O pipeline em quatro etapas

```text
1. Divisao (chunking)     : cada documento fonte e dividido em fragmentos
2. Indexacao               : cada fragmento e convertido em embedding (veja
                             NLP e LLM) e armazenado em um banco vetorial
3. Busca (retrieval)       : a pergunta feita tambem e convertida em embedding,
                             e entao comparada a todos os fragmentos indexados
4. Geracao                 : os fragmentos mais proximos sao colados no
                             prompt, e o LLM responde se apoiando neles
```

A comparação na etapa 3 é feita por uma medida de similaridade entre vetores, geralmente exatamente o [produto escalar entre vetores normalizados](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (o cosseno do ângulo que os separa): dois fragmentos cujos embeddings estão próximos tratam, em princípio, de assuntos próximos; é exatamente a propriedade dos embeddings detalhada em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm).

> **Cuidado:** trocar de modelo de embedding sem reindexar todos os documentos existentes. Os embeddings produzidos por dois modelos diferentes não compartilham o mesmo espaço vetorial (veja a comparação de embeddings em [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): misturar embeddings antigos e novos em uma mesma busca não produz nenhuma comparação válida, mesmo que o cálculo seja executado sem erro aparente.
>
> **Boa prática:** reindexar toda a base documental sempre que um modelo de embedding mudar, nunca uma mistura parcial de dois modelos diferentes.

## A divisão (chunking): uma escolha que custa dos dois lados

O tamanho dos fragmentos nunca é neutro:

- **Muito pequenos**, um fragmento perde o contexto que o envolve (uma frase isolada de seu parágrafo pode se tornar ambígua ou enganosa uma vez buscada sozinha).
- **Muito grandes**, um fragmento dilui sua relevância: em um documento de várias páginas, só uma parte realmente responde à pergunta, mas todo o fragmento é injetado no prompt, ao custo (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)) e ao risco de afogar a informação útil em texto irrelevante.

Um compromisso comum mantém uma sobreposição entre fragmentos consecutivos (as últimas palavras de um fragmento repetidas no início do seguinte), para que uma informação a cavalo entre dois fragmentos nunca seja totalmente perdida.

> **Cuidado:** escolher um tamanho de fragmento padrão, copiado de outro projeto, sem testá-lo nos próprios documentos. O tamanho ideal depende fortemente do tipo de documento (artigos curtos, manuais longos...) e da natureza das perguntas feitas.
>
> **Boa prática:** testar vários tamanhos de fragmento (e de sobreposição) em perguntas representativas antes de fixar um, em vez de escolher um arbitrariamente de uma vez por todas.

## O limite do RAG: um retrieval ruim não se vê

O RAG não torna o LLM mais honesto, ele o cerca de dados melhores: se a etapa de busca não encontra o fragmento certo (pergunta mal formulada, embedding que não capta a nuance certa, informação ausente da base), o modelo responde do mesmo jeito, com os mesmos riscos de alucinação de quando não há RAG (veja [LLM em produção](/?c=ia&s=nlp-llm&p=llm-en-production)), sem que nenhum alerta sinalize que o contexto fornecido era insuficiente ou fora do assunto.

> **Cuidado:** supor que uma resposta de um sistema RAG é confiável simplesmente porque parece bem referenciada. Um retrieval ruim (fragmento irrelevante) produz uma resposta tão segura quanto um bom retrieval: nada na superfície distingue os dois casos.
>
> **Boa prática:** monitorar a qualidade do próprio retrieval (os fragmentos recuperados eram realmente relevantes?), não apenas a qualidade da resposta final; veja [Monitoramento e gestão operacional de um LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

## O que reter

| | |
|---|---|
| **O que reter** | O RAG busca documentos relevantes no momento da pergunta e os injeta no prompt, em vez de retreinar o modelo. A busca compara embeddings por similaridade (produto escalar normalizado). Um retrieval ruim produz uma resposta tão segura quanto um bom retrieval, sem se distinguir na superfície. |
| **Ferramentas úteis** | Um banco vetorial para armazenar e buscar embeddings; um modelo de embedding consistente em toda a base documental. |
| **Armadilhas a evitar** | Misturar embeddings vindos de modelos diferentes. Escolher um tamanho de fragmento sem testá-lo. Confiar em uma resposta RAG sem verificar a qualidade do retrieval. |
| **Boas práticas** | Reindexar totalmente a base após qualquer mudança de modelo de embedding. Testar vários tamanhos de fragmento em casos representativos. Monitorar a qualidade do retrieval além da resposta final. |
