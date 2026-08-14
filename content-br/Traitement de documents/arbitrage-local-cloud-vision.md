---
order: 3
---

# Arbitragem local vs cloud para um modelo de visão

O capítulo [A stack de IA](/?c=ia&s=production-et-gouvernance&p=stack-ia) detalha a escolha entre API hospedada e modelo auto-hospedado para um **LLM**. Um modelo de [visão computacional](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (um OCR estruturado, por exemplo) coloca a mesma questão de fundo, mas com respostas às vezes invertidas: este capítulo retoma os mesmos critérios (exposição dos dados, custo, latência) recalculando-os para esse caso específico, sem repetir o princípio já apresentado para os LLMs.

## O que muda em relação a um LLM

| Critério | LLM (recapitulando) | Modelo de visão/OCR |
|---|---|---|
| Tamanho típico do modelo | Frequentemente dezenas de bilhões de parâmetros: auto-hospedar um modelo competitivo exige uma [GPU](/?c=infrastructure&p=cpu-vs-gpu) robusta, às vezes várias | Frequentemente bem menor (algumas centenas de milhões de parâmetros para um pipeline de OCR estruturado): roda sem dificuldade em uma GPU modesta, às vezes até em CPU para um volume razoável |
| Cobrança de uma API hospedada | Por token, lido e gerado | Por página ou por imagem processada, um modelo de custo diferente (sem noção de comprimento de texto gerado) |
| Natureza do dado exposto | O prompt (texto, potencialmente confidencial) | A imagem enviada (um documento escaneado inteiro), que pode conter muito mais informação do que a realmente útil (a página toda, não só a tabela a ser lida) |
| Tolerância à latência | Frequentemente interativa (um usuário aguardando uma resposta) | Frequentemente um processamento em lote (*batch*), em segundo plano, sobre um conjunto de documentos: alguns segundos a mais por página têm pouco impacto real |

Essas diferenças deslocam o ponto de equilíbrio: o tamanho de modelo menor torna o auto-hospedagem acessível a uma equipe que nunca teria cogitado auto-hospedar um LLM, e uma latência tolerante reduz a vantagem habitual de uma API hospedada (resposta rápida, sem investimento em hardware).

## A exposição dos dados: o critério que decide sozinho, muitas vezes

Enviar um documento a uma API de visão hospedada significa transmitir a **imagem completa** da página a um terceiro, não apenas a informação que se busca extrair dela. Para um documento interno ou confidencial (um contrato, uma ficha técnica proprietária), essa exposição pode, por si só, desqualificar uma API hospedada, independentemente do seu custo ou da sua qualidade:

> **Armadilha:** avaliar uma API de visão hospedada apenas pelo seu preço por página e sua qualidade de reconhecimento, sem ter verificado antes se o tipo de documento tratado tem permissão de transitar por um terceiro (veja os princípios de [governança de dados](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees), aplicáveis aqui da mesma forma que para um LLM).
>
> **Boa prática:** decidir a questão da exposição dos dados **antes** de comparar os custos: se a natureza dos documentos tratados a proíbe, a auto-hospedagem se torna a única opção válida, qualquer que seja o resultado de um cálculo de custo por outro lado favorável ao cloud.

## O custo, recalculado para um processamento em lote

Um pipeline que processa rotineiramente um grande volume de documentos (centenas de PDFs por dia, por exemplo) acumula um custo por página que cresce linearmente com o volume, sem nunca parar enquanto o serviço estiver rodando. Um modelo auto-hospedado, uma vez amortizado o hardware, processa um volume adicional a um custo marginal quase nulo:

| | API hospedada | Modelo auto-hospedado |
|---|---|---|
| Custo em baixo volume | Competitivo: nenhum investimento em hardware | Custo fixo do hardware a amortizar, desvantajoso enquanto o volume permanece baixo |
| Custo em alto volume, regular | Cresce indefinidamente com o volume processado | Torna-se rentável: o hardware já amortizado absorve um volume crescente sem custo marginal significativo |

> **Armadilha:** projetar o custo de uma API hospedada sobre o volume atual, sem antecipar seu crescimento. Um pipeline de processamento documental tende a ver seu volume aumentar com o tempo (mais documentos, mais fontes), deslocando progressivamente o equilíbrio para a auto-hospedagem.
>
> **Boa prática:** calcular as duas opções sobre uma projeção de volume a médio prazo, não apenas sobre o volume do dia, antes de fechar uma escolha que será custosa de mudar depois que o pipeline for construído em torno dela.

## A latência: uma vantagem que se apaga em processamento em lote

Uma API hospedada geralmente ganha na latência de uma requisição isolada, um critério decisivo para um uso interativo. Um pipeline documental que processa documentos em segundo plano, sem um usuário aguardando imediatamente um resultado, aproveita bem menos essa vantagem: alguns segundos a mais por página, multiplicados por um processamento assíncrono, têm um impacto insignificante na experiência real.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A escolha entre API hospedada e auto-hospedada para um modelo de visão retoma os critérios já vistos para um LLM, mas recalculados: modelos menores (auto-hospedagem mais acessível), cobrança por página em vez de por token, imagem completa exposta em vez de um prompt de texto, tolerância à latência mais alta em processamento em lote. |
| **Ferramentas utilizáveis** | Uma projeção de volume a médio prazo para calcular o custo das duas opções; uma classificação prévia dos documentos tratados (veja a governança de dados) para decidir a questão da exposição antes da do custo. |
| **Armadilhas a evitar** | Comparar as opções apenas pelo preço sem ter verificado se a exposição dos documentos é aceitável. Calcular uma API hospedada sobre o volume atual sem antecipar seu crescimento. |
| **Boas práticas** | Decidir a exposição dos dados antes do custo. Projetar o custo sobre um volume a médio prazo. Não superestimar a vantagem de latência de uma API hospedada para um processamento em lote. |
