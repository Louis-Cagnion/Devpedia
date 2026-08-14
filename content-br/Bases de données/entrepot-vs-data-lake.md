---
order: 5
---

# Data warehouse contra data lake

O capítulo [O modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile) fala de **data warehouse** sem detalhar o que o distingue de um banco simples: é um banco dedicado à análise, com um esquema imposto antes mesmo de escrever qualquer coisa nele. O **data lake** (*lago de dados*) atende à mesma necessidade de acumular histórico, mas invertendo esse princípio: primeiro se armazena, a estrutura é decidida depois.

## Esquema imposto na escrita, ou decidido na leitura

Um data warehouse exige um esquema definido antes de qualquer carga: cada tabela tem colunas tipadas de antemão (`CREATE TABLE fato_vendas (valor DECIMAL(10, 2), ...)`), e uma linha que não corresponde a esse esquema é rejeitada no momento da escrita. É o **schema-on-write**: a estrutura é decidida antecipadamente, a verificação acontece na entrada.

Um data lake aceita qualquer arquivo tal como ele é: um CSV, um JSON, uma imagem, um arquivo de logs brutos, sem exigir esquema no momento do depósito. A estrutura só é decidida quando um processamento vem ler esses arquivos e aplica uma interpretação a eles. É o **schema-on-read**: a verificação é adiada para a leitura, nunca imposta na escrita.

```text
Data warehouse (schema-on-write):
  arquivo fonte --> verificado contra o esquema --> rejeitado ou inserido em uma tabela tipada

Data lake (schema-on-read):
  arquivo fonte --> armazenado tal como esta, sem verificacao --> estrutura decidida no momento da leitura
```

## Visão geral

| | Data warehouse | Data lake |
|---|---|---|
| Esquema | Imposto na escrita (schema-on-write) | Decidido na leitura (schema-on-read) |
| Formatos aceitos | Apenas tabelas estruturadas | Qualquer arquivo (CSV, JSON, imagem, log...) |
| Custo de armazenamento | Mais alto (estrutura, índices) | Mais baixo (arquivos brutos) |
| Uso típico | Relatórios estáveis, dashboards de negócio | Exploração, dados brutos em grande volume, casos de uso ainda não definidos |
| Velocidade de disponibilização | Mais lenta (a estrutura precisa ser definida antes) | Imediata (o arquivo já está lá, tal como é) |

## A armadilha: confundir "aceita tudo" com "não precisa de rigor"

> **Armadilha:** tratar o data lake como um espaço sem nenhuma regra, onde se depositam arquivos sem nunca organizá-los nem documentá-los. Depois de alguns meses, ninguém mais sabe o que cada arquivo contém, nem se ele ainda está atualizado: é o que se chama de **data swamp** (*pântano de dados*), um data lake que se tornou inutilizável por acúmulo desordenado.
>
> **Boa prática:** organizar o data lake com as mesmas referências da [arquitetura medalhão](/?c=bases-de-donnees&p=architecture-medaillon) (bronze/prata/ouro), mesmo que nenhum esquema seja imposto na escrita: uma pasta ou uma convenção de nomenclatura por fonte e por data, e uma documentação do que cada zona contém.

## A armadilha: achar que é preciso escolher um ou outro

> **Armadilha:** pensar que uma empresa precisa escolher entre data warehouse e data lake de uma vez por todas. Os dois atendem a necessidades diferentes (relatório estável e confiável contra exploração de dados brutos variados), que frequentemente coexistem na mesma organização.
>
> **Boa prática:** usar um data lake para absorver dados brutos de qualquer natureza a baixo custo, e um data warehouse (ou a camada ouro de uma arquitetura medalhão construída sobre esse lake) para o que precisa ser confiável e rápido de consultar para um relatório de negócio. Algumas ferramentas recentes (os **lakehouse**) combinam os dois: o armazenamento econômico de um data lake, com garantias de esquema próximas de um data warehouse.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um data warehouse impõe um esquema antes da escrita (schema-on-write) e só armazena tabelas estruturadas; um data lake aceita qualquer arquivo tal como é e só decide sua estrutura na leitura (schema-on-read). |
| **Ferramentas utilizáveis** | `CREATE TABLE` com um esquema tipado para um data warehouse; um armazenamento de arquivos organizado por convenção (bronze/prata/ouro) para um data lake. |
| **Armadilhas a evitar** | Deixar um data lake se tornar um data swamp por acúmulo desordenado; achar que é preciso escolher entre os dois em vez de fazê-los coexistir conforme a necessidade. |
| **Boas práticas** | Organizar um data lake segundo zonas claras mesmo sem esquema imposto; reservar o data warehouse (ou a camada ouro) para necessidades de relatório confiável; considerar um lakehouse quando as duas necessidades se sobrepõem fortemente. |
