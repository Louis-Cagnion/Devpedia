---
order: 4
---

# Esquemas e tabelas técnicas

Os capítulos anteriores ([modelo em estrela](/?c=bases-de-donnees&p=modeles-en-etoile), [tabela ponte](/?c=bases-de-donnees&p=table-pont)) cobrem as tabelas que sustentam a análise em si: fatos, dimensões, associações. Um banco real também contém tabelas que não servem a nenhuma análise mas fazem o pipeline que as alimenta funcionar, e um espaço de nomes que as organiza entre si: o **esquema**.

## O esquema: um espaço de nomes para as tabelas

Um **esquema** SQL é um espaço de nomes dentro de um banco de dados: cada tabela pertence a ele, e seu nome completo se escreve `esquema.tabela` (por exemplo `dim.produto` em vez de apenas `produto`). Duas tabelas de mesmo nome podem coexistir sem conflito se estiverem em esquemas diferentes, e um esquema serve principalmente para indicar de relance o papel de uma tabela em um banco que contém centenas delas.

```sql
CREATE SCHEMA dim;
CREATE SCHEMA fact;

CREATE TABLE dim.produto (
    id_produto  INT PRIMARY KEY,
    nome        VARCHAR(100)
);

CREATE TABLE fact.vendas (
    id_venda    INT PRIMARY KEY,
    id_produto  INT
);
```

## dbo: o esquema padrão

No [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), **dbo** (*database owner*) é o esquema criado por padrão: toda tabela criada sem especificar um esquema cai automaticamente nele. Um banco que nunca criou outro esquema acaba então com todas as suas tabelas em `dbo`, qualquer que seja seu papel (fato, dimensão, técnica).

> **Armadilha:** deixar todas as tabelas em `dbo` por padrão, sem nunca criar outros esquemas. Em um banco com várias centenas de tabelas, nada distingue uma tabela de fatos de uma tabela técnica apenas lendo seu nome completo; é preciso abrir cada tabela para entender seu papel.
>
> **Boa prática:** criar esquemas nomeados por papel (`dim`, `fact`, `stg` para staging, `admin` para tabelas técnicas) assim que um banco ultrapassa um punhado de tabelas, e usar `dbo` apenas para o que deliberadamente não pertence a nenhuma categoria precisa.

## As tabelas técnicas: fazem o pipeline rodar, não a análise

Uma **tabela técnica** (geralmente guardada em um esquema `admin` ou `meta`) não contém nem fato nem dimensão: ela armazena informações sobre o funcionamento do próprio pipeline. O exemplo mais comum é a tabela de **acompanhamento de carga** (*watermark table*), que guarda até onde a última carga chegou para reprocessar apenas as linhas novas na próxima vez.

```sql
CREATE TABLE admin.acompanhamento_cargas (
    nome_fonte      VARCHAR(50) PRIMARY KEY,
    ultima_carga    DATETIME
);
```

```sql
-- le apenas o que chegou desde a ultima carga bem-sucedida, em vez de reler tudo
SELECT *
FROM fonte_vendas
WHERE data_modificacao > (
    SELECT ultima_carga FROM admin.acompanhamento_cargas WHERE nome_fonte = 'vendas'
);

-- depois, uma vez a carga concluida com sucesso, avanca-se o marcador
UPDATE admin.acompanhamento_cargas
SET ultima_carga = NOW()
WHERE nome_fonte = 'vendas';
```

> **Armadilha:** reler a totalidade de uma fonte a cada execução do pipeline em vez de acompanhar o que já foi processado. Em uma fonte que cresce todo dia, o tempo de processamento aumenta sem parar, enquanto boa parte do trabalho refaz o que já estava correto no dia anterior.
>
> **Boa prática:** uma tabela de acompanhamento de carga por fonte, atualizada apenas depois de uma carga bem-sucedida (nunca antes, senão uma execução que falha no meio faz o pipeline acreditar que dados não processados foram).

## Armadilha: misturar tabela técnica e tabela de análise

Assim como para a bronze e a prata da [arquitetura medalhão](/?c=bases-de-donnees&p=architecture-medaillon), nada impede tecnicamente uma ferramenta de relatório de ler diretamente uma tabela técnica.

> **Armadilha:** conectar um dashboard em `admin.acompanhamento_cargas` ou uma tabela de staging porque a informação já está lá. Essas tabelas mudam de estrutura conforme as necessidades do pipeline, sem considerar um consumidor externo que tenha se apoiado nelas.
>
> **Boa prática:** manter as tabelas técnicas em um esquema dedicado (`admin`, `stg`, `meta`), separado dos esquemas `dim`/`fact` destinados à análise, para que um novato saiba imediatamente, só pelo nome do esquema, o que tem permissão de consultar.

## Visão geral

| Esquema | Papel | Exemplo | Quem consulta |
|---|---|---|---|
| `dim` | Dimensões | `dim.produto` | Dashboards, analistas |
| `fact` | Fatos | `fact.vendas` | Dashboards, analistas |
| `stg` | Dados em trânsito (staging) | Cópia bruta antes da limpeza | O próprio pipeline |
| `admin` | Funcionamento do pipeline | Acompanhamento de carga, log de erros | Quem mantém o pipeline |
| `dbo` | Padrão (SQL Server), ou uso geral não categorizado | Depende do banco | Variável |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um esquema SQL é um espaço de nomes que organiza as tabelas por papel (`dim`, `fact`, `stg`, `admin`); `dbo` é o esquema padrão do SQL Server, que não deve receber todas as tabelas sem distinção. As tabelas técnicas (acompanhamento de carga, log de erros) fazem o pipeline funcionar mas não servem à análise. |
| **Ferramentas utilizáveis** | `CREATE SCHEMA` para organizar as tabelas por papel; uma tabela de acompanhamento de carga (`admin.acompanhamento_cargas`) para reprocessar apenas os dados novos a cada execução. |
| **Armadilhas a evitar** | Deixar tudo em `dbo` sem distinção de papel; reler a totalidade de uma fonte a cada execução do pipeline; conectar um dashboard diretamente a uma tabela técnica. |
| **Boas práticas** | Criar esquemas nomeados por papel assim que um banco cresce; atualizar o acompanhamento de carga apenas depois de uma carga bem-sucedida; reservar as tabelas técnicas a um esquema dedicado, separado da análise. |
