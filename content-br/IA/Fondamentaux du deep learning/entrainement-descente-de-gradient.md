---
order: 2
---

# O treinamento de um modelo e a descida do gradiente

Uma [rede neural](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) começa com pesos **aleatórios**: suas predições iniciais, portanto, não fazem sentido nenhum. **O treinamento** é o processo que ajusta progressivamente esses pesos para que as predições se aproximem das respostas certas, a partir de exemplos.

## A função de perda (*loss function*)

Uma **função de perda** é uma [função matemática](/?c=mathematiques&p=la-fonction-mathematique) que mede numericamente o quanto as predições do modelo estão distantes das respostas certas: quanto menor a perda, melhor o modelo nesses exemplos específicos.

```python
# Erro quadrático médio (MSE): comum para uma tarefa de regressão (prever um número)
def erro_quadratico_medio(predicoes, valores_reais):
    erros = [(p - v) ** 2 for p, v in zip(predicoes, valores_reais)]
    return sum(erros) / len(erros)

erro_quadratico_medio([3.2, 5.1], [3.0, 5.0])  # perda pequena -> predições próximas
erro_quadratico_medio([1.0, 1.0], [3.0, 5.0])  # perda grande -> predições distantes
```

Para uma tarefa de classificação, usa-se mais comumente a **entropia cruzada** (*cross-entropy*): ela compara duas [distribuições de probabilidade](/?c=mathematiques&p=les-probabilites-de-base): a prevista pelo modelo e a conhecida, da resposta certa (100% na classe correta, 0% nas outras). Ela vale `-log(probabilidade atribuída à classe correta)`; encontramos diretamente a propriedade do [logaritmo](/?c=mathematiques&p=le-logarithme) vista antes: quanto mais essa probabilidade se aproxima de 0, mais `-log(...)` explode, penalizando fortemente uma predição confiante mas errada:

```python
import math

def entropia_cruzada(probabilidade_classe_correta):
    return -math.log(probabilidade_classe_correta)

entropia_cruzada(0.99)  # ~0.01 -> confiante E correto: perda quase nula
entropia_cruzada(0.5)   # ~0.69 -> hesitante: perda moderada
entropia_cruzada(0.01)  # ~4.6  -> confiante MAS errado: perda muito alta
```

> **Cuidado:** usar o erro quadrático médio para uma classificação (categorias), ou a entropia cruzada para uma regressão (um número contínuo): cada função de perda pressupõe um tipo de saída específico, misturá-las produz um treinamento inconsistente (veja a mesma distinção entre `LinearRegression` e `LogisticRegression` em [Introdução ao machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Boa prática:** escolher a função de perda de acordo com o tipo de saída esperado (número contínuo → MSE, categoria → entropia cruzada), nunca por hábito ou por padrão.

> **Nota:** uma função de perda precisa ser derivável (veja [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)), já que o treinamento calcula seu gradiente a cada etapa, uma restrição matemática, não uma escolha de legibilidade. Depois de treinado o modelo, avalia-se em contrapartida sua qualidade com métricas pensadas para serem compreendidas por um humano (exatidão, precisão, recall...), não necessariamente deriváveis; veja [Medir a qualidade de um modelo](/?c=data-science&p=machine-learning-scikit-learn).

## A descida do gradiente: encontrar o mínimo da perda

Treinar uma rede equivale exatamente ao princípio já visto em [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient): a função de perda desempenha o papel da curva a descer, e os pesos da rede desempenham o papel do vetor que se ajusta passo a passo, no sentido oposto ao gradiente:

```python
novo_peso = peso_antigo - taxa_aprendizado * gradiente
```

A cada etapa, o algoritmo calcula o gradiente da perda em relação a **cada** peso da rede (potencialmente milhões), e então os ajusta todos simultaneamente na direção que diminui a perda.

## A taxa de aprendizado (*learning rate*)

A **taxa de aprendizado** é a `taxa` da fórmula acima: ela controla o tamanho de cada passo da descida.

| Taxa de aprendizado | Efeito |
|---|---|
| Muito alta | O modelo "salta" para além do mínimo, a perda oscila ou até diverge (aumenta em vez de diminuir) |
| Muito baixa | A descida é muito lenta, o treinamento pode levar um tempo excessivo, ou ficar preso em um mínimo local pouco satisfatório |
| Bem ajustada | Descida regular e razoavelmente rápida até um bom mínimo |

> **Cuidado:** manter a mesma taxa de aprendizado sem nunca questioná-la. Uma perda que estagna ou que oscila sem convergir quase sempre indica uma taxa de aprendizado mal ajustada, não necessariamente um modelo inadequado para o problema.
>
> **Boa prática:** acompanhar a evolução da perda ao longo do treinamento, e ajustar a taxa de aprendizado (geralmente reduzindo-a progressivamente) se ela não evoluir como esperado, em vez de tratá-la como um parâmetro fixado de uma vez por todas.

## A retropropagação (*backpropagation*): calcular o gradiente com eficiência

Uma rede com várias camadas é uma **composição** de funções: a saída da camada 1 se torna a entrada da camada 2, e assim por diante. Calcular o efeito de um peso da primeira camada sobre a perda final exige, portanto, percorrer toda essa cadeia. A **regra da cadeia** (*chain rule*) permite calcular esse gradiente sem recalcular cada efeito do zero: a derivada de uma composição de funções é o produto das derivadas de cada função que a compõe. A **retropropagação** aplica essa regra camada por camada, partindo da saída para subir até a entrada:

```text
Sentido do cálculo normal (forward):  Entrada -> Camada 1 -> Camada 2 -> Saída -> Perda
Sentido da retropropagação:           Entrada <- Camada 1 <- Camada 2 <- Saída <- Perda
```

> **Nota:** isso não é uma operação a recalcular manualmente para usar um framework como o [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch): o `autograd` (diferenciação automática) realiza esse cálculo automaticamente. Compreender o **princípio** (propagar o gradiente para trás, camada por camada, via a regra da cadeia) basta para raciocinar sobre por que certos problemas de treinamento surgem (ex.: o "vanishing gradient", veja [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)).

## Épocas, lotes e descida do gradiente estocástica

```python
for epoca in range(numero_epocas):                     # uma "época" = uma passagem completa por TODOS os dados
    for lote in dados_em_lotes(dados, tamanho_lote=32):  # um "lote"/batch = um pequeno subconjunto
        predicoes = modelo.forward(lote)
        perda = calcular_perda(predicoes, valores_reais)
        gradientes = retropropagar(perda)
        ajustar_pesos(gradientes, taxa_aprendizado)
```

Em vez de recalcular o gradiente sobre a **totalidade** dos dados a cada etapa (custoso, principalmente com milhões de exemplos), usa-se geralmente pequenos lotes (*mini-batch*); daí o nome **descida do gradiente estocástica** (SGD): cada ajuste de peso é baseado em uma amostra, não na totalidade dos dados, o que introduz um pouco de ruído mas acelera consideravelmente cada etapa.

> **Cuidado:** escolher um tamanho de lote mal ajustado à memória disponível (veja o custo das transferências entre CPU e [GPU](/?c=infrastructure&p=cpu-vs-gpu)): um lote muito grande pode exceder a memória disponível, um lote muito pequeno multiplica desnecessariamente o número de idas e voltas.
>
> **Boa prática:** ajustar o tamanho do lote à memória realmente disponível (em particular a da GPU usada), em vez de fixar um valor arbitrário copiado de outro projeto.

## De onde vêm os dados, e como torná-los utilizáveis

Tudo o que precede já pressupõe dados prontos para serem passados ao modelo: na prática, essa preparação representa frequentemente mais trabalho que o próprio treinamento.

**A quantidade e a natureza dos dados.** O princípio geral (coletar, limpar, separar em treinamento/teste) é o mesmo que para um modelo clássico, veja [o fluxo típico de um projeto de machine learning](/?c=data-science&p=machine-learning-scikit-learn): uma rede neural simplesmente exige muito mais, geralmente milhares ou milhões de exemplos, para ajustar seus numerosos parâmetros sem se contentar em memorizá-los. Dois casos se distinguem pela forma de obter a "resposta certa" a comparar com a predição:

- **Supervisionado**: cada exemplo é rotulado manualmente (uma imagem classificada como "gato", um e-mail marcado como "spam"): caro de produzir em volume.
- **Auto-supervisionado**: a resposta certa é derivada automaticamente dos próprios dados brutos, sem intervenção humana; é o caso de um LLM treinado para prever a próxima palavra (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): a "resposta certa" de cada exemplo de treinamento é simplesmente a palavra que realmente vem depois no texto fonte. É isso que permite treinar em volumes de texto muito maiores do que qualquer equipe humana poderia rotular.

**Transformar dados brutos em dados utilizáveis.** Uma rede neural só recebe como entrada um [vetor](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de números, de **tamanho fixo** (veja a camada de entrada em [As redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)), nunca uma imagem, um texto ou uma linha de planilha como estão. Cada tipo de dado tem sua própria etapa de conversão para essa forma numérica fixa: um texto é dividido em tokens e então convertido em embeddings (veja [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), uma imagem é redimensionada para uma resolução fixa e então seus pixels normalizados em um intervalo padrão (ex.: 0 a 1, em vez de 0 a 255), um dado tabular é limpo e suas colunas categóricas convertidas em números (veja [pandas](/?c=data-science&p=pandas)). Sem essa normalização das escalas, colunas com amplitudes muito diferentes (uma idade entre 0 e 100, um salário entre 0 e 100.000) fariam a descida do gradiente convergir de forma muito desigual dependendo da direção.

> **Cuidado:** treinar um modelo com dados não representativos de seu uso real (um conjunto de dados tendencioso, incompleto, ou muito diferente dos casos encontrados em produção). O modelo aprende então fielmente as regularidades desses dados (incluindo seus vieses) sem que nenhum erro de código sinalize isso.
>
> **Boa prática:** verificar se os dados de treinamento cobrem bem a diversidade dos casos esperados em uso real, antes de confiar na qualidade do modelo resultante.

**O ambiente necessário.** Um modelo clássico (scikit-learn) se treina em poucos segundos em uma CPU comum. Uma rede neural profunda, com seus milhões ou até bilhões de parâmetros, rapidamente se torna impraticável sem [GPU](/?c=infrastructure&p=cpu-vs-gpu). Na prática, montar esse ambiente supõe: um framework de deep learning (PyTorch, TensorFlow), dependências isoladas do resto do sistema para permanecerem reprodutíveis (veja os ambientes virtuais em [Python](/?c=langages-de-programmation&s=python&p=modules-et-environnements)), e geralmente uma máquina equipada com GPU acessível localmente ou alugada por demanda na [nuvem](/?c=infrastructure&p=le-cloud) para treinamentos muito pesados para uma máquina pessoal. Um notebook (veja [Os notebooks Jupyter](/?c=data-science&p=jupyter-notebooks)) continua sendo a ferramenta habitual para experimentar rapidamente em uma pequena amostra, antes de disparar um treinamento completo, mais longo, via um script.

Veja também [Deep learning com PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch), que automatiza inteiramente esse ciclo de treinamento (`loss.backward()`, `optimizer.step()`).

## O que reter

| | |
|---|---|
| **O que reter** | O treinamento ajusta os pesos de uma rede para minimizar uma função de perda, descendo seu gradiente passo a passo (veja [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)). A retropropagação calcula esse gradiente com eficiência via a regra da cadeia. |
| **Ferramentas úteis** | O `autograd` (PyTorch e equivalentes) calcula automaticamente o gradiente por retropropagação: nenhum cálculo manual na prática. |
| **Armadilhas a evitar** | Misturar MSE e entropia cruzada de acordo com o tipo de saída. Manter uma taxa de aprendizado mal ajustada sem questioná-la. Um tamanho de lote incompatível com a memória disponível. Treinar com dados não representativos do uso real. |
| **Boas práticas** | Escolher a função de perda de acordo com o tipo de saída. Acompanhar a evolução da perda para ajustar a taxa de aprendizado. Adaptar o tamanho do lote à memória realmente disponível. Verificar a representatividade dos dados de treinamento. |
