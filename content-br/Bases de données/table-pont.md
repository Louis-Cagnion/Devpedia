---
order: 3
---

# A tabela ponte

No [modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile), cada linha da tabela de fatos aponta para uma única linha de cada dimensão: uma venda tem um único produto, um único cliente, uma única data. Mas algumas relações não são tão simples: uma mesma venda pode ter se beneficiado de várias promoções ao mesmo tempo. Uma coluna `id_promocao` única em `fato_vendas` só pode conter um único valor, então esse caso não cabe no modelo tal como está.

## O problema: uma relação "muitos para muitos"

Uma venda pode acumular várias promoções, e uma mesma promoção se aplica a várias vendas diferentes: é uma relação **muitos-para-muitos** (*many-to-many*), ao contrário da relação um-para-muitos habitual entre uma dimensão e a tabela de fatos (um produto pode aparecer em várias vendas, mas cada venda tem apenas um produto).

```text
Relacao habitual (um-para-muitos):
dim_produto  1 ---- N  fato_vendas     (um produto, varias vendas; uma venda, um unico produto)

Relacao a resolver (muitos-para-muitos):
fato_vendas  N ---- N  dim_promocao    (uma venda, varias promocoes; uma promocao, varias vendas)
```

## A tabela ponte: uma linha por associação

A **tabela ponte** (*bridge table*) resolve esse caso inserindo uma tabela intermediária entre a tabela de fatos e a dimensão envolvida. Cada linha da tabela ponte associa um identificador de fato a um identificador de dimensão; uma venda que tem duas promoções gera simplesmente duas linhas na tabela ponte, uma por promoção.

```sql
CREATE TABLE fato_vendas (
    id_venda    INT PRIMARY KEY,
    id_produto  INT,
    valor       DECIMAL(10, 2)
);

CREATE TABLE dim_promocao (
    id_promocao  INT PRIMARY KEY,
    descricao    VARCHAR(100),
    percentual   DECIMAL(4, 2)
);

CREATE TABLE ponte_vendas_promocoes (
    id_venda     INT,   -- chave estrangeira -> fato_vendas
    id_promocao  INT    -- chave estrangeira -> dim_promocao
);
```

```text
Venda 1 (valor R$100) teve as promocoes 10 e 20:

ponte_vendas_promocoes
id_venda | id_promocao
---------|-------------
1        | 10
1        | 20
```

## A armadilha clássica: a contagem em dobro

Fazer um `JOIN` ingênuo entre `fato_vendas` e `ponte_vendas_promocoes` produz uma linha por associação, não uma linha por venda. Uma venda de R$100 com duas promoções aparece duas vezes no resultado: somá-la diretamente dobra o valor.

```sql
-- armadilha: essa consulta conta a venda 1 duas vezes (uma por promocao), logo R$200 em vez de R$100
SELECT SUM(f.valor)
FROM fato_vendas f
JOIN ponte_vendas_promocoes p ON p.id_venda = f.id_venda;
```

> **Armadilha:** somar diretamente uma coluna da tabela de fatos depois de um `JOIN` em uma tabela ponte. O número de linhas explode (uma por associação), e qualquer soma ou média calculada sobre isso fica distorcida por essa duplicação.
>
> **Boa prática:** ou contar as vendas distintas (`SUM(DISTINCT ...)` ou uma subconsulta que agrega antes), ou distribuir o valor entre as promoções via uma coluna de peso explícita na tabela ponte (por exemplo `peso` de 0.5 para cada uma das duas promoções, para que a soma dos pesos permaneça igual a 1 por venda).

```sql
CREATE TABLE ponte_vendas_promocoes (
    id_venda     INT,
    id_promocao  INT,
    peso         DECIMAL(4, 2)   -- parte do valor atribuida a essa promocao (soma = 1 por venda)
);

-- com a ponderacao, a soma volta a ficar correta: R$100 divididos em R$50 + R$50, nao R$100 + R$100
SELECT SUM(f.valor * p.peso)
FROM fato_vendas f
JOIN ponte_vendas_promocoes p ON p.id_venda = f.id_venda;
```

## Visão geral

| | Dimensão clássica | Tabela ponte |
|---|---|---|
| Relação com a tabela de fatos | Um-para-muitos | Muitos-para-muitos |
| Uma linha representa | Um valor do eixo de análise | Uma associação entre um fato e um valor de dimensão |
| Risco no `JOIN` | Nenhum (uma linha de fatos permanece uma linha) | Duplicação das linhas de fatos (uma por associação) |
| Agregação | `SUM`/`AVG` direto sem risco | Exige ponderação ou contagem distinta |

## Reconhecer a necessidade de uma tabela ponte

> **Armadilha:** adicionar uma segunda coluna de chave estrangeira (`id_promocao_1`, `id_promocao_2`) na tabela de fatos para lidar com "até duas promoções". Esse limite arbitrário quebra assim que uma venda tem três, e cada coluna adicionada complica todas as consultas, que agora precisam verificar várias colunas em vez de uma.
>
> **Boa prática:** assim que uma dimensão pode ter vários valores válidos para um mesmo fato (promoções, tags, categorias múltiplas), usar uma tabela ponte em vez de colunas repetidas. O número de associações possíveis por fato passa a ser ilimitado, sem mudar o esquema.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A tabela ponte resolve uma relação muitos-para-muitos entre a tabela de fatos e uma dimensão, armazenando uma linha por associação em vez de uma chave estrangeira direta. |
| **Ferramentas utilizáveis** | `JOIN` para a tabela ponte; coluna de ponderação (`peso`) para distribuir uma medida entre várias associações sem duplicá-la. |
| **Armadilhas a evitar** | Somar uma medida da tabela de fatos depois de um `JOIN` em uma tabela ponte sem ponderação (contagem em dobro); multiplicar colunas de chave estrangeira para simular uma relação muitos-para-muitos. |
| **Boas práticas** | Usar uma tabela ponte assim que um fato pode ter vários valores para uma mesma dimensão; incluir nela uma coluna de ponderação quando uma medida precisa ser distribuída entre as associações. |
