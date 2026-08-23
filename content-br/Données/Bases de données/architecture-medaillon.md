---
order: 2
---

# A arquitetura medalhão

O capítulo [O modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile) supõe que os dados já estão limpos: cada linha de `fato_vendas` tem um `id_produto` que realmente existe em `dim_produto`, nenhum valor está duplicado, nenhum campo está vazio por engano. Na prática, os dados brutos que chegam de um site, de um sensor ou da exportação de outro sistema raramente estão nesse estado. A **arquitetura medalhão** (*medallion architecture*) organiza o caminho entre "dado bruto" e "dado pronto para análise" em três etapas nomeadas segundo as medalhas olímpicas: **bronze**, **prata** e **ouro**.

## O problema: transformar sem recomeçar tudo a cada vez

Sem etapas intermediárias, um pipeline típico lê a fonte, limpa, agrega e grava o resultado final de uma só vez. Se uma regra de limpeza estava errada, ou se uma nova análise precisa dos dados em um estágio menos transformado, é preciso reler tudo desde a fonte e refazer tudo. A arquitetura medalhão mantém uma cópia em cada etapa, para recomeçar apenas o trabalho realmente afetado por uma correção.

```text
Fonte (site, sensor, exportacao...)
        |
        v
   [ BRONZE ]  copia bruta, tal como recebida
        |
        v
   [ PRATA ]  limpa, deduplicada, esquema estavel
        |
        v
   [ OURO  ]  agregada, organizada para uma analise precisa
        |
        v
Dashboard / relatorio
```

## Bronze: a cópia bruta

A camada **bronze** é uma cópia fiel do que foi recebido da fonte, sem nenhuma transformação: mesmos nomes de colunas da exportação original, mesmos valores (incluindo os erros), e nunca se remove nem se corrige nada nela. Ela serve como rede de segurança: se uma regra de limpeza aplicada depois se mostrar errada, sempre é possível recomeçar da bronze em vez de pedir o dado de novo à fonte (que pode ter mudado, ou não estar mais disponível).

```text
Exportacao bruta recebida do site (uma linha por clique, tal como produzida pelo servidor):

id;produto;qtd;data
1;Teclado;2;2025-03-01
2;;1;2025-03-01          -> produto vazio: erro deixado como esta
2;Mouse;1;2025-03-01     -> id 2 duplicado: deixado como esta
```

> **Armadilha:** corrigir ou filtrar os dados já na chegada à bronze. Uma vez removido o erro ou a duplicata, a informação "veja exatamente o que a fonte enviou nesse momento" se perde, e uma análise que precisasse saber disso (rastrear a origem de um bug de exportação, por exemplo) não tem mais nada para examinar.
>
> **Boa prática:** escrever a bronze apenas em modo de adição (*append-only*): cada nova chegada é adicionada, nunca substitui ou modifica o que já existe.

## Prata: limpa e confiável

A camada **prata** aplica as regras de limpeza: linhas duplicadas removidas, campos vazios descartados ou preenchidos segundo uma regra explícita, tipos de coluna corrigidos (uma data armazenada como texto vira uma data de verdade), nomes de coluna padronizados se várias fontes diferentes alimentam a mesma tabela. O resultado tem um esquema estável sobre o qual outros processamentos podem se apoiar sem surpresas.

```sql
-- a partir da bronze acima
INSERT INTO prata_vendas (id_venda, produto, quantidade, data_venda)
SELECT id, produto, qtd, CAST(data AS DATE)
FROM bronze_vendas
WHERE produto IS NOT NULL AND produto != ''   -- descarta linhas sem produto
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY id ORDER BY data DESC
) = 1;                                        -- mantem apenas uma linha por id duplicado
```

> **Armadilha:** adivinhar uma regra de limpeza em vez de documentá-la explicitamente. Se "linha sem produto descartada" não está escrito em lugar nenhum, a próxima pessoa que retomar o pipeline não sabe se a ausência dessas linhas na prata é proposital ou um bug.
>
> **Boa prática:** tornar cada regra de limpeza rastreável (comentário no código de transformação, ou tabela separada que registra as linhas descartadas e o motivo), para poder responder "por que essa linha desapareceu?" meses depois.

## Ouro: pronta para uma análise precisa

A camada **ouro** agrega e modela os dados da prata para um uso de negócio preciso: vendas totais por região, taxa de cancelamento mensal, etc. É tipicamente aqui que se encontra o [modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile): uma tabela de fatos e suas dimensões, prontas para serem consultadas diretamente por um dashboard, sem que ele precise conhecer as etapas de limpeza anteriores.

```sql
-- tabela "ouro": vendas agregadas por produto e por mes, a partir da prata
INSERT INTO ouro_vendas_mensais (produto, mes, total_quantidade, total_valor)
SELECT produto, DATE_TRUNC('month', data_venda), SUM(quantidade), SUM(quantidade * preco)
FROM prata_vendas
JOIN prata_produtos USING (produto)
GROUP BY produto, DATE_TRUNC('month', data_venda);
```

> **Armadilha:** criar uma tabela ouro por dashboard em vez de por necessidade de negócio compartilhada, o que multiplica tabelas quase idênticas (uma para cada novo relatório) e faz cada pequena correção precisar ser refeita em todo lugar.
>
> **Boa prática:** projetar cada tabela ouro para uma necessidade de negócio reutilizável (ex. "vendas por mês", explorável por vários dashboards), não para uma única tela específica.

## Visão geral

| | Bronze | Prata | Ouro |
|---|---|---|---|
| Conteúdo | Cópia bruta, tal como recebida | Limpa, deduplicada, tipada | Agregada, orientada à necessidade de negócio |
| Esquema | O da fonte (pode variar) | Estável e padronizado | Estável, pensado para a análise |
| Modificável? | Nunca (apenas adição) | Reescrita se a regra de limpeza mudar | Reescrita se a necessidade de negócio mudar |
| Quem consulta | O próprio pipeline | Outros pipelines, raramente um humano | Dashboards, relatórios, analistas |

## Erro frequente: deixar um dashboard ler a bronze ou a prata

Nada impede tecnicamente uma ferramenta de relatório de se conectar diretamente à bronze ou à prata em vez de à ouro.

> **Armadilha:** conectar um dashboard à prata (ou à bronze) porque "o dado de que preciso já está lá". O dashboard passa então a refazer ele mesmo a agregação de negócio, duplicada em cada ferramenta que faz o mesmo, e uma correção de regra de negócio precisa ser replicada em todo lugar em vez de um único ponto.
>
> **Boa prática:** reservar a ouro como único ponto de entrada para tudo o que consome o dado fora do próprio pipeline; se falta uma necessidade de negócio, criar ou estender uma tabela ouro em vez de contornar pela prata.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A arquitetura medalhão divide um pipeline de dados em três cópias sucessivas: bronze (bruta, intacta), prata (limpa, esquema estável), ouro (agregada para uma necessidade de negócio precisa, frequentemente modelada em [estrela](/?c=bases-de-donnees&p=modeles-en-etoile)). |
| **Ferramentas utilizáveis** | Consultas [SQL](/?c=domain-specific-languages-dsl&p=sql) de transformação (`INSERT ... SELECT`, deduplicação por `ROW_NUMBER()`, agregação por `GROUP BY`) para fazer uma tabela passar de uma camada para a seguinte. |
| **Armadilhas a evitar** | Corrigir ou filtrar já na bronze; aplicar uma regra de limpeza não documentada; criar uma tabela ouro por dashboard; conectar uma ferramenta de relatório diretamente à bronze ou à prata. |
| **Boas práticas** | Bronze apenas em modo de adição; regras de limpeza rastreáveis; tabelas ouro pensadas por necessidade de negócio reutilizável; a ouro como único ponto de entrada para consumidores externos ao pipeline. |
