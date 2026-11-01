---
order: 13
---

# Ler um banco de dados com o SSMS (31/10/2026)

Um **banco de dados** é um conjunto organizado de dados, guardados em **tabelas** (tabelas de linhas e colunas, como uma planilha). Um **servidor de banco de dados** é um programa que guarda essas tabelas e responde aos pedidos de outros programas; o **Microsoft SQL Server** (veja sua [documentação oficial](https://learn.microsoft.com/en-us/sql/sql-server/)) é um deles. Fala-se com ele em [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), uma linguagem feita para descrever quais dados se quer ler ou modificar. Um pedido escrito em SQL chama-se **consulta**.

**SSMS** (*SQL Server Management Studio*, “studio de gestão de SQL Server”) é o programa gráfico da Microsoft para se conectar a um servidor SQL Server, navegar pelos bancos com o mouse, escrever consultas e ler seus resultados. Ele funciona somente no Windows; sob macOS ou Linux, a Microsoft oferece a [extensão MSSQL para Visual Studio Code](https://learn.microsoft.com/en-us/sql/tools/visual-studio-code/mssql-extensions), cuja interface difere da descrita aqui. Este capítulo é para quem descobre um banco já existente: ele ensina a se conectar, a navegar, a fazer uma pergunta sem estragar nada e a conferir se a conta não tem poder para estragar nada.

Os nomes de menus, botões e janelas vêm da documentação oficial da Microsoft; eles são dados em inglês (em itálico), acompanhados de uma tradução indicativa; a interface em português pode usar outras palavras. A interface muda de uma versão para outra, e um rótulo pode ser diferente no seu computador: procure então a mesma palavra na [documentação do SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms). A instalação do programa não é tratada aqui (veja a [página de download](https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms)).

| Pergunta | Seção |
|---|---|
| Como se conectar, e o que querem dizer as opções? | [Conectar-se a um servidor](#conectar-se-a-um-servidor) |
| Onde estão as tabelas e as colunas? | [O Explorador de objetos](#o-explorador-de-objetos-navegar-sem-escrever) |
| Como escrever e executar uma consulta? | [Abrir uma janela de consulta](#abrir-uma-janela-de-consulta) e [Executar](#executar-o-arquivo-inteiro-ou-so-a-selecao) |
| O que quer dizer “2 linhas afetadas”? | [Ler o resultado](#ler-o-resultado) |
| Como ter certeza de que não se modifica nada? | [Permissões: a leitura somente vem da conta](#permissoes-a-leitura-somente-vem-da-conta-nao-da-atencao) |
| Quais erros os iniciantes cometem? | [Os erros de iniciante](#os-erros-de-iniciante) |

## O que você precisa ter antes de começar

Um servidor SQL Server contém vários níveis aninhados. O SSMS os mostra nesta ordem, do mais amplo ao mais preciso:

```
  Seu computador (SSMS)  ---- rede ---->  O servidor (a máquina)
                                                 |
                                                 +-- uma instância do SQL Server
                                                      |  (um exemplar do programa)
                                                      +-- banco de dados "livraria_demo"
                                                      |     |
                                                      |     +-- esquema "dbo"
                                                      |           +-- tabela "clientes"
                                                      |           +-- tabela "livros"
                                                      +-- banco de dados "outro_banco"
                                                            +-- ...
```

Uma **instância** é um exemplar do programa SQL Server que roda em uma máquina; uma mesma máquina pode hospedar várias, cada uma com seus bancos. Um **esquema** é uma pasta de nomes que organiza as tabelas de um banco e evita que duas tabelas de mesmo nome se confundam, e `dbo` é o esquema padrão: veja [os esquemas e as tabelas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques). Um mesmo banco também pode existir em várias cópias em servidores diferentes (por exemplo, uma para os testes e outra para o trabalho de verdade); é a primeira fonte de confusão, tratada mais adiante.

Antes de abrir o SSMS, é preciso obter quatro informações com a pessoa que administra o servidor:

| Informação | Exemplo genérico | Para que serve |
|---|---|---|
| O nome do servidor (e da instância, se houver uma) | `NOME_DO_SERVIDOR` ou `NOME_DO_SERVIDOR\INSTANCIA_A` | Dizer ao SSMS onde se conectar |
| O modo de autenticação a usar | Conta do Windows ou login SQL (conta própria do SQL Server, veja [a autenticação](#autenticacao-do-windows-ou-autenticacao-do-sql-server)) | Provar quem você é |
| O nome do banco a consultar | `livraria_demo` | Saber em qual banco escrever as consultas |
| As permissões da sua conta neste banco | Somente leitura, ou leitura e escrita | Saber o que você tem o direito de fazer |

Os exemplos deste capítulo usam uma livraria inventada: um banco `livraria_demo` com duas tabelas, `clientes` e `livros`. Esses nomes são fictícios; substitua-os pelos seus.

## A janela do SSMS num relance

Uma vez conectado, a janela é composta de algumas zonas. O esquema abaixo é simplificado: a disposição exata depende da versão e das configurações. A consulta que aparece nele lê clientes: `SELECT` lista as colunas desejadas, `FROM` indica a tabela lida (`dbo.clientes`: esquema `dbo`, tabela `clientes`), `WHERE` mantém somente as linhas que respeitam a condição (um texto se escreve entre aspas simples, `'Lyon'`), e o ponto e vírgula `;` termina a instrução. Essas palavras são detalhadas no capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

```
+----------------------------------------------------------------------------------+
| Arquivo  Editar  Exibir  Consulta  Ferramentas  Janela  Ajuda     (1) menus      |
+----------------------------------------------------------------------------------+
| [Nova consulta] [Executar] [ livraria_demo v ]                   (2) ferramentas |
+-----------------------+----------------------------------------------------------+
| EXPLORADOR DE OBJETOS | SQLQuery1.sql                                            |
|                       | 1 | SELECT id, nome, cidade                              |
| (3)                   | 2 | FROM dbo.clientes                                    |
|                       | 3 | WHERE cidade = 'Lyon';                               |
| NOME_DO_SERVIDOR      |                                  (4) editor de consulta  |
|  + Bancos de dados    +----------------------------------------------------------+
|    + livraria_demo    | Resultados | Mensagens          (5) painel de resultados |
|      + Tabelas        |  id | nome   | cidade                                    |
|        dbo.clientes   |   1 | Martin | Lyon                                      |
|        dbo.livros     |   3 | Petit  | Lyon                                      |
+-----------------------+----------------------------------------------------------+
| Pronto        NOME_DO_SERVIDOR | meu_login | livraria_demo | 00:00:00 | 2 linhas |
+----------------------------------------------------------------------------------+
                                                             (6) barra de status
```

| Zona | Nome (em inglês) | Função |
|---|---|---|
| 1 | Barra de menus (*menu bar*) | Todos os comandos, incluindo o menu `Consulta` (*Query*) |
| 2 | Barra de ferramentas (*toolbar*) | `Nova consulta` (*New Query*), `Executar` (*Execute*), lista dos bancos disponíveis |
| 3 | Explorador de objetos (*Object Explorer*) | A árvore dos bancos, tabelas e colunas do servidor |
| 4 | Editor de consultas (*query editor*) | O texto SQL que você escreve |
| 5 | Painel de resultados (*results pane*) | Duas abas: `Resultados` (*Results*, as linhas devolvidas) e `Mensagens` (número de linhas, erros) |
| 6 | Barra de status (*status bar*) | Servidor, conta e banco aos quais a aba está ligada, duração, número de linhas |

A zona 6 é a mais útil para um iniciante: ela lembra, o tempo todo, **em qual servidor, com qual conta e em qual banco** a consulta vai rodar (segundo a documentação, essas informações aparecem na barra de status e no título da aba).

## Conectar-se a um servidor

Ao iniciar, o SSMS abre a janela **Conectar ao servidor** (*Connect to Server*). Pode-se reabri-la a qualquer momento com o botão `Conectar` (*Connect*) do Explorador de objetos.

### Os campos da janela de conexão

| Campo (em inglês) | O que preencher | Observação |
|---|---|---|
| Tipo de servidor (*Server type*) | `Mecanismo de banco de dados` (*Database Engine*) | O valor padrão serve: é o programa servidor que contém as tabelas |
| Nome do servidor (*Server name*) | O nome recebido do administrador | Veja a tabela seguinte para as formas possíveis |
| Autenticação (*Authentication*) | Windows, ou SQL Server | Veja abaixo |
| Nome de usuário e senha (*Login*, *Password*) | A conta SQL, se a autenticação SQL for escolhida | Desativados com a autenticação do Windows |
| `Options >>` | Criptografia, confiança no certificado, banco inicial | Veja abaixo |

### Escrever o nome do servidor

| Forma | Significado | Exemplo |
|---|---|---|
| `NOME_DO_SERVIDOR` | A instância padrão desta máquina | `SRV-DADOS` |
| `NOME_DO_SERVIDOR\NOME_DA_INSTANCIA` | Uma instância **nomeada** desta máquina | `SRV-DADOS\INSTANCIA_A` |
| `NOME_DO_SERVIDOR,PORTA` | Um endereço preciso: a **porta** (o número da “porta” de rede em que o servidor escuta) se escreve depois de uma vírgula | `SRV-DADOS,1433` |
| `localhost`, `.` ou `(local)` | A máquina em que o SSMS roda | `localhost\INSTANCIA_A` |

A barra invertida `\` separa a máquina da instância, a vírgula separa o nome da porta: confundi-las é uma causa frequente de falha na conexão.

### Autenticação do Windows ou autenticação do SQL Server

A **autenticação** é a prova da sua identidade. O SQL Server oferece duas principais (existem outros modos, como a autenticação [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) para os serviços online da Microsoft, fora do assunto aqui):

| | Autenticação do Windows (*Windows Authentication*) | Autenticação do SQL Server (*SQL Server Authentication*) |
|---|---|---|
| Quem verifica a identidade | O Windows: o servidor recebe a identidade da sua sessão | O próprio servidor SQL |
| O que você digita | Nada: a conta e a senha são as da sua sessão do Windows | Um nome de login e uma senha próprios do SQL Server |
| Onde fica a senha | No diretório das contas do Windows da organização | No servidor SQL |
| Vantagem | Nenhuma senha a mais para gerenciar nem para digitar | Utilizável a partir de uma máquina fora do **domínio** (a rede da empresa cujo **diretório** gerencia as contas: uma lista central das contas de uma organização, aqui o [Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)) |
| Armadilha | A conta também **precisa** estar declarada no servidor: senão, `Login failed` | Nunca usar a conta `sa` (administrador de todo o servidor) para consultar dados |

Um **login** é uma conta declarada no nível do servidor; autenticar-se com sucesso, portanto, não basta: é preciso que o servidor conheça essa conta. Essa armadilha (a identidade é válida, mas nenhum login lhe corresponde nesta instância) é detalhada no capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), na seção sobre a autenticação integrada do Windows.

A caixa *Remember password* (“lembrar a senha”) guarda a senha na sua máquina. Em um computador compartilhado, não a marque.

### Criptografia e confiança no certificado

Entre o SSMS e o servidor, as trocas podem ser **criptografadas** (tornadas ilegíveis para quem escutasse a rede). Para que essa criptografia realmente sirva, o SSMS também precisa garantir que fala com o servidor certo, e não com um impostor. O servidor prova sua identidade com um **certificado**: um documento digital assinado por uma autoridade que o computador conhece (veja [o certificado TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#o-certificado-tls-autoassinado) para o princípio).

Segundo a documentação do SQL Server, a janela de conexão oferece, conforme a versão, uma configuração de criptografia (`Criptografar conexão`, *Encrypt connection*, a três valores descritos abaixo) e uma caixa *Trust server certificate* (“confiar no certificado do servidor”), às vezes atrás do botão `Options >>`.

| Valor de *Encrypt connection* | O que acontece |
|---|---|
| *Optional* | Criptografa somente se o servidor exigir; caso contrário, as trocas continuam legíveis na rede |
| *Mandatory* | Criptografa sempre; o certificado é verificado, a menos que a caixa *Trust server certificate* esteja marcada |
| *Strict* | Criptografa sempre, com verificação rigorosa do certificado |

Para um banco consultado remotamente, escolha *Mandatory* ou *Strict* (o valor *Strict* só existe nas versões recentes).

| Configuração | O que acontece |
|---|---|
| Caixa *Trust server certificate* desmarcada | Quando a conexão é criptografada, o SSMS verifica o certificado: assinado por uma autoridade conhecida, não vencido, em nome do servidor pedido. Um certificado inválido faz a conexão **falhar** |
| Caixa marcada | O SSMS **não verifica mais** o certificado e aceita o que o servidor apresentar, qualquer que seja |

O que a caixa desativa é, portanto, a **verificação da identidade do servidor**, não a criptografia: quando a conexão é criptografada, os dados continuam criptografados, mas o SSMS não consegue mais saber se seu interlocutor é o servidor verdadeiro. Em uma rede onde alguém se interpõe entre você e o servidor (um ataque chamado **man-in-the-middle**, “homem no meio”), essa pessoa poderia se passar pelo servidor e ler o que você envia, a senha inclusive.

| Situação | O que fazer |
|---|---|
| Servidor de produção ou servidor remoto | Não marque. Peça ao administrador um certificado assinado por uma autoridade reconhecida, ou a instalação do certificado da sua organização no seu computador |
| Instância instalada na sua própria máquina para você praticar (edição gratuita *Developer* ou *Express*, para [baixar aqui](https://www.microsoft.com/en-us/sql-server/sql-server-downloads); veja também [o ambiente local com SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) | Marcar é aceitável: ninguém se interpõe entre a sua máquina e ela mesma |
| Aparece um erro de certificado e não se sabe por quê | Não marque “para que funcione”: anote a mensagem e passe-a ao administrador |

Documentação: [configurar a criptografia das conexões](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-sql-server-encryption).

### Escolher o banco inicial

Em `Options >>`, uma aba de propriedades de conexão (*Connection Properties*) oferece um campo *Connect to database* (“conectar ao banco de dados”). Vazio, a conexão abre em um banco padrão da conta (muitas vezes o banco do sistema `master`, que não contém nenhum dos seus dados). Preenchido, a janela de consulta abre diretamente no banco certo. Se a conta não tiver acesso a esse banco, a conexão falha com uma mensagem do tipo `Cannot open database "..." requested by the login`.

### Quando a conexão falha

| Mensagem (em inglês, segundo a documentação e os fóruns da Microsoft) | Causa provável | Pista |
|---|---|---|
| `A network-related or instance-specific error occurred while establishing a connection to SQL Server` | Nome do servidor ou da instância errado, serviço parado (o programa SQL Server, que roda em segundo plano no Windows, não está iniciado), **firewall** (programa que filtra as conexões de rede permitidas) | Verifique a grafia e o separador (`\` ou `,`), depois peça ao administrador |
| `The certificate chain was issued by an authority that is not trusted` | O certificado do servidor não é reconhecido pelo seu computador | Veja [a seção sobre o certificado](#criptografia-e-confianca-no-certificado), não marque a caixa por reflexo |
| `Login failed for user '...'` | Senha errada, **ou** conta desconhecida desta instância | Veja o capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql): duas causas para a mesma mensagem |
| `Cannot open database "..." requested by the login` | A conta não tem acesso ao banco nomeado em `Connect to database` | Esvazie esse campo, ou peça o acesso |

## O Explorador de objetos: navegar sem escrever

O **Explorador de objetos** (*Object Explorer*) é uma árvore (simplificada abaixo: a árvore real exibe outros ramos, como as restrições ou os gatilhos) cujos ramos se abrem com o pequeno `+` (ou a seta). Nada é modificado ao abrir: apenas se lê o **catálogo**, a lista que o servidor mantém sobre os próprios objetos.

```
NOME_DO_SERVIDOR (SQL Server, conta: meu_login)
 |
 +-- Bancos de dados (Databases)
 |    +-- Bancos de dados do sistema (System Databases)    <- não tocar
 |    +-- livraria_demo
 |         +-- Tabelas (Tables)
 |         |    +-- dbo.clientes
 |         |    |    +-- Colunas (Columns)
 |         |    |    |    +-- id (PK, int, Not Null)
 |         |    |    |    +-- nome (varchar(50), Not Null)
 |         |    |    |    +-- cidade (varchar(50), Null)
 |         |    |    |    +-- desconto (decimal(5,2), Null)
 |         |    |    +-- Chaves (Keys)
 |         |    |    +-- Índices (Index)
 |         |    +-- dbo.livros
 |         +-- Exibições (Views)
 |         +-- Segurança (Security)
 +-- Segurança (Security)
```

### O que cada ramo contém

| Ramo | Conteúdo |
|---|---|
| Bancos de dados (*Databases*) | Os bancos do servidor; conforme as permissões da conta, um banco pode faltar na lista ou não poder ser aberto |
| Bancos de dados do sistema (*System Databases*) | Os bancos próprios do servidor: `master` (catálogo do servidor), `tempdb` (espaço de trabalho temporário), `model` (modelo dos novos bancos), `msdb` (tarefas agendadas); nunca o lugar de um exercício ([documentação](https://learn.microsoft.com/en-us/sql/relational-databases/databases/system-databases)) |
| Tabelas | As tabelas, precedidas do seu esquema (`dbo.clientes`) |
| Colunas (*Columns*) | Para cada coluna: nome, tipo, obrigatória ou não |
| Chaves (*Keys*) | A chave primária e as chaves estrangeiras (ligações com outras tabelas) |
| Índices | As estruturas que aceleram as buscas: veja [os índices](/?c=donnees&s=bases-de-donnees&p=les-index) |
| Exibições (*Views*) | Consultas salvas que se leem como tabelas |
| Segurança (*Security*) | As contas e os papéis; sob um banco, os deste banco (veja [Permissões](#permissoes-a-leitura-somente-vem-da-conta-nao-da-atencao)) |

### Ler uma linha de coluna

Sob `Colunas`, cada entrada segue o padrão `nome (chave, tipo, aceita NULL ou não)`. As três noções a reter:

| Noção | Definição | Exemplo lido na árvore |
|---|---|---|
| **Tipo** | A natureza do valor que a coluna aceita: `int` um número inteiro, `varchar(50)` um texto de no máximo 50 caracteres, `decimal(5,2)` um número decimal de 5 algarismos, dos quais 2 depois da vírgula, `date` um dia do calendário | `cidade (varchar(50), Null)` |
| **Chave primária** (*primary key*, abreviada `PK`) | A coluna (ou o grupo de colunas) cujo valor identifica **cada linha de forma única**: nunca repetido, nunca vazio. É o que permite designar “o cliente número 3” sem ambiguidade. Ela é criada por `PRIMARY KEY` (veja [`CREATE TABLE`](/?c=langages&s=domain-specific-languages-dsl&p=sql#create-table-criar-uma-tabela-ddl)) | `id (PK, int, Not Null)` |
| **`NULL`** | A ausência de valor: “desconhecido” ou “não preenchido”, o que é diferente de zero e do texto vazio. Uma coluna marcada `Null` (ou *allows nulls*) pode não ter valor em certas linhas; `Not Null` impõe um valor | `desconto (decimal(5,2), Null)` |

Essas três indicações respondem às perguntas de um iniciante antes mesmo de escrever uma consulta: qual coluna identifica uma linha, que tipo de valor colocar nela, e se uma célula vazia é normal. Veja [`NULL`](/?c=langages&s=domain-specific-languages-dsl&p=sql#null-um-dado-ausente-nao-um-valor-como-os-outros) para seus efeitos nos cálculos e nas comparações.

### Ler a estrutura sem correr riscos

Um clique com o botão direito em uma tabela abre um menu de contexto (o menu que se abre com o clique direito). Várias entradas são inofensivas; outras modificam o banco:

| Entrada do menu (em inglês) | Efeito | Sem perigo? |
|---|---|---|
| `Select Top 1000 Rows` | Escreve e executa uma consulta que lê no máximo 1000 linhas | Sim: uma leitura |
| `Script Table as` > `CREATE To` > `New Query Editor Window` | Escreve, em uma nova aba, o código que criaria a tabela, **sem executá-lo** | Sim: lê-se a estrutura em SQL |
| `Properties` | Mostra as características da tabela | Sim |
| `Edit Top 200 Rows` | Abre as 200 primeiras linhas em uma grade **editável** | **Não**: veja [os erros de iniciante](#os-erros-de-iniciante) |
| `Design` | Abre o editor de estrutura da tabela | **Não**: podem-se alterar colunas ali |
| `Delete`, `Rename` | Exclui ou renomeia a tabela | **Não** |

A estrutura também pode ser lida por uma consulta. `INFORMATION_SCHEMA.COLUMNS` é uma exibição de descrição que o servidor fornece (veja a [documentação](https://learn.microsoft.com/en-us/sql/relational-databases/system-information-schema-views/columns-transact-sql)): cada linha descreve uma coluna do banco atual.

```sql
-- SELECT escolhe as colunas a exibir; AS serve apenas para renomear o título de uma coluna
SELECT COLUMN_NAME AS coluna,     -- o nome da coluna
       DATA_TYPE AS tipo,          -- o tipo dela (int, varchar, date...)
       CHARACTER_MAXIMUM_LENGTH AS tamanho,  -- o tamanho máximo de um texto (senão NULL)
       IS_NULLABLE AS aceita_null -- YES se a coluna aceita NULL, NO caso contrário
-- FROM indica o que é lido: a exibição de descrição das colunas
FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE mantém somente as linhas que respeitam a condição: aqui, as colunas de clientes
-- AND exige que as duas condições sejam verdadeiras ao mesmo tempo
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'clientes'
-- ORDER BY ordena o resultado; ORDINAL_POSITION é a posição da coluna na tabela
ORDER BY ORDINAL_POSITION;
```

Resultado esperado para a tabela do exemplo (valores ilustrativos):

| coluna | tipo | tamanho | aceita_null |
|---|---|---|---|
| id | int | NULL | NO |
| nome | varchar | 50 | NO |
| cidade | varchar | 50 | YES |
| desconto | decimal | NULL | YES |

## Abrir uma janela de consulta

Uma **janela de consulta** é uma aba do editor na qual se escreve SQL. Três formas de abrir uma:

| Gesto | Particularidade |
|---|---|
| Botão `Nova consulta` (*New Query*) da barra de ferramentas | A consulta é ligada ao servidor selecionado no Explorador, no banco inicial da conexão ou no do nó selecionado |
| Atalho `Ctrl + N` | Mesmo efeito que o botão |
| Clique com o botão direito em **um banco** no Explorador, depois `Nova consulta` | A consulta fica ligada **a este banco**: é a forma mais segura de começar no lugar certo |

### O banco atual

Cada aba está ligada a **um** banco de cada vez: o **banco atual**. Uma consulta que escreve `FROM dbo.clientes` procura a tabela somente neste banco. Três formas de escolhê-lo ou trocá-lo:

| Método | Como | Observação |
|---|---|---|
| Lista suspensa da barra de ferramentas | Escolhe-se o banco na lista dos bancos disponíveis (*Available Databases*) | Visível o tempo todo; vê-se de relance onde se está |
| Instrução `USE` | `USE livraria_demo;` troca o banco atual da aba | Prático em um script (um arquivo de várias instruções SQL), mas um `USE` copiado de outro script pode levá-lo a outro banco sem que você perceba |
| Nome completo com três partes | `livraria_demo.dbo.clientes` | Designa a tabela sem trocar de banco (veja [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)) |

Para conferir, sem confiar na lista suspensa, pergunta-se ao servidor:

```sql
-- SELECT sem FROM: o servidor calcula valores e os devolve em uma única linha
SELECT
    -- DB_NAME() devolve o nome do banco atual desta aba
    DB_NAME()    AS base_atual,
    -- SUSER_NAME() devolve o nome da conta com que estamos conectados
    SUSER_NAME() AS conta_conectada,
    -- @@SERVERNAME devolve o nome do servidor (e da instância) ao qual estamos ligados
    @@SERVERNAME AS servidor;
```

Resultado possível (valores ilustrativos):

| base_atual | conta_conectada | servidor |
|---|---|---|
| livraria_demo | meu_login | NOME_DO_SERVIDOR |

Esta consulta, reescrita em uma linha (`SELECT DB_NAME(), SUSER_NAME();`), roda **antes de qualquer outra**: ela troca uma incerteza por uma resposta do servidor. Documentação: [`DB_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/db-name-transact-sql), [`SUSER_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/suser-name-transact-sql), [`@@SERVERNAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/servername-transact-sql).

> **Nota:** segundo a documentação do SSMS, a janela de conexão também permite associar uma **cor** a um servidor (propriedades de conexão, *Use custom color*): a barra de status das abas ligadas a esse servidor pode então assumir essa cor. Uma cor vermelha para o servidor de produção, verde para o de testes, torna a confusão visível.

### A palavra `GO`

Um script copiado de um colega costuma ter linhas com `GO` sozinho. `GO` não é SQL: é um separador entendido pelo SSMS, que divide o texto em **lotes** (*batches*) enviados ao servidor um após o outro. Como os lotes são independentes, uma [variável](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (um valor guardado sob um nome) criada em um deles não existe mais no seguinte; um `USE`, em compensação, continua valendo para os lotes seguintes da mesma aba.

## Executar: o arquivo inteiro ou só a seleção

Escrever uma consulta não a executa. Para enviá-la ao servidor, usa-se o botão `Executar` (*Execute*), o atalho `F5` (ou `Ctrl + E`). O ponto decisivo:

| Estado do editor | O que é enviado ao servidor |
|---|---|
| **Nenhum texto selecionado** | **Todo** o conteúdo da aba, da primeira à última linha |
| **Há texto selecionado** (destacado) | **Somente** o texto destacado; o resto é ignorado |

Uma aba pode, portanto, conter várias consultas, e a seleção escolhe qual sai. Exemplo de aba com três instruções:

```sql
-- instrução 1: verificar onde estamos (leitura)
SELECT DB_NAME() AS base_atual;
-- instrução 2: ler os clientes de Lyon (leitura)
SELECT id, nome, cidade FROM dbo.clientes WHERE cidade = 'Lyon';
-- instrução 3: DELETE exclui linhas; aqui, todos os clientes de Paris (escrita!)
DELETE FROM dbo.clientes WHERE cidade = 'Paris';
```

```
  F5 sem selecionar nada:          F5 com a linha 2 selecionada:

  1  SELECT DB_NAME() ...    <- sai   1  SELECT DB_NAME() ...
  2  SELECT id, nome ...      <- sai   2 [SELECT id, nome ...]    <- só esta, a partir daqui
  3  DELETE FROM ...         <- sai   3  DELETE FROM ...
```

Isso é útil (testar uma consulta por vez) e perigoso (veja [o erro “seleção esquecida”](#2-executar-uma-selecao-esquecida)). A barra de ferramentas também oferece `Analisar` (*Parse*, menu `Consulta` > `Analisar`, ou `Ctrl + F5`), que verifica a **sintaxe** (a ortografia SQL) sem executar nada, e um botão `Cancelar a execução da consulta` (*Cancel Executing Query*) que interrompe uma consulta longa demais.

## Ler o resultado

Depois de `F5`, o painel de baixo exibe duas abas: `Resultados` e `Mensagens`. É preciso ler as duas.

### A aba Resultados

A aba `Resultados` (*Results*) apresenta por padrão uma **grade** (*grid*): uma linha do resultado por linha da grade, uma coluna por coluna escolhida. Resultado da consulta 2 acima em cinco clientes de teste (ilustração):

| id | nome | cidade |
|---|---|---|
| 1 | Martin | Lyon |
| 3 | Petit | Lyon |

Na grade, um valor ausente aparece com a palavra `NULL`: não é texto, é a ausência de valor. O menu `Consulta` > `Resultados para` (*Results To*) permite escolher uma saída em grade, em texto puro ou em um arquivo. Um clique com o botão direito na grade permite copiar as linhas, com ou sem o cabeçalho das colunas.

### A aba Mensagens e “n linhas afetadas”

A aba `Mensagens` relata o que o servidor diz sobre a execução. Depois de uma consulta bem-sucedida, ela mostra uma linha da forma:

```text
(2 rows affected)
```

Em português, conforme o idioma da interface: `(2 linhas afetadas)`. O número significa o que a instrução **tocou**, e se lê de forma diferente conforme a instrução:

| Instrução | O que “n linhas afetadas” designa |
|---|---|
| `SELECT` | O número de linhas **devolvidas** por esta consulta |
| `INSERT` (adiciona linhas) | O número de linhas **adicionadas** |
| `UPDATE` | O número de linhas **alteradas** |
| `DELETE` | O número de linhas **excluídas** |

Duas consequências práticas:

| Constatação | Interpretação |
|---|---|
| `(0 rows affected)` depois de um `DELETE` ou de um `UPDATE` | Nenhuma linha correspondia à condição `WHERE`: nada mudou, o que é uma informação, não uma falha |
| `(1500 rows affected)` depois de um `DELETE` que devia tocar 3 linhas | A condição era ampla demais: o alerta chega **depois** do fato, daí o interesse de prevê-lo (veja [excluir sem `WHERE`](#3-excluir-sem-where)) |

> **Armadilha:** a mensagem **não** indica o total das linhas que correspondem à pergunta. Com `SELECT TOP 10 * FROM dbo.clientes;` (`*` designa todas as colunas, e `TOP 10` limita o resultado a 10 linhas, palavra própria do SQL do SQL Server, o [*T-SQL*](https://learn.microsoft.com/en-us/sql/t-sql/language-reference)), a mensagem diz `(10 rows affected)` mesmo que a tabela tenha 40.000. Para conhecer o total, pede-se `SELECT COUNT(*) FROM dbo.clientes;`, em que `COUNT(*)` conta as linhas.

Sem `ORDER BY`, o SQL Server não garante ordem nenhuma: as 10 linhas de um `TOP 10` são arbitrárias e podem variar de uma execução para outra. Para um resultado reproduzível, ordena-se: `SELECT TOP 10 * FROM dbo.clientes ORDER BY id;` devolve sempre os 10 menores `id`.

A barra de status (na parte de baixo da janela) repete o número de linhas e a duração da consulta. Uma duração que cresce para um simples `SELECT` sinaliza uma tabela volumosa: interrompa com `Cancelar a execução da consulta` e recomece com `TOP` em vez de esperar.

### Quando aparece um erro

Um erro aparece na aba `Mensagens`, em texto vermelho, na forma `Msg número, Level n, State n, Line n` seguida de uma frase (`Level`: gravidade do erro; `State`: referência interna do servidor; `Line`: linha em causa). Um duplo clique na mensagem coloca o cursor na linha em causa. Duas mensagens dizem respeito diretamente a um iniciante:

| Mensagem (em inglês) | Significado | Causa frequente |
|---|---|---|
| `Msg 208 ... Invalid object name 'dbo.clientes'` | A tabela pedida não existe **no banco atual** | Você está no **banco errado**, ou o esquema/nome está mal escrito |
| `Msg 229 ... The SELECT permission was denied on the object 'clientes'` | A conta não tem o direito de ler esta tabela | As permissões faltam: veja a seção seguinte |

## Permissões: a leitura somente vem da conta, não da atenção

Dizer “eu só leio” não protege de nada: um erro de digitação, uma seleção mal feita, um script copiado bastam para escrever por engano. A única proteção confiável é que a conta usada **não tenha o direito de escrever**. Essa ideia é o **princípio do menor privilégio**, explicado no capítulo [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql): uma conta recebe somente as permissões de que precisa.

### Dois níveis de permissões

```
   Servidor (instância)
   +-- Login "meu_login"            <- a conta, conhecida pelo servidor
   |     |
   |     +-- Banco "livraria_demo"
   |     |     +-- Usuário "meu_login"    <- a mesma conta, declarada neste banco
   |     |     |     +-- papel db_datareader   <- leitura de todas as tabelas
   |     |     +-- Tabela dbo.clientes
   |     |
   |     +-- Banco "outro_banco"
   |           +-- (nenhum usuário)        <- a conta não tem nenhuma permissão aqui
```

Uma conta pode **conectar-se** ao servidor e, mesmo assim, não poder fazer nada em um banco determinado: as permissões são concedidas **banco por banco**. O **login** dá acesso ao servidor; o **usuário de banco** é a mesma conta declarada em um banco específico, e é ele que recebe as permissões sobre esse banco. Um **papel** é um grupo de permissões que se atribui de uma vez:

| Papel do banco (em inglês) | O que permite | Para uma leitura simples |
|---|---|---|
| `db_datareader` | Ler (`SELECT`) todas as tabelas do banco | Suficiente, e é o papel a pedir |
| `db_datawriter` | Adicionar, alterar, excluir linhas em todas as tabelas | A evitar para explorar |
| `db_owner` | Todas as permissões sobre o banco, inclusive excluir tabelas | Nunca para explorar |
| `db_denydatawriter` | **Proíbe** escrever (uma recusa prevalece sobre as outras permissões) | Uma barreira explícita, útil além da leitura |

No nível do servidor, uma conta membro do papel `sysadmin` (a conta `sa` é uma delas) tem todas as permissões sobre todos os bancos: com ela, **nenhum** banco está protegido. Veja a [lista dos papéis de servidor](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/server-level-roles) e a [lista dos papéis de banco](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/database-level-roles). O capítulo [o ambiente local com SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) mostra, ao contrário, uma conta que recebe `db_owner` em um único banco: é uma escolha de desenvolvimento, não a de uma pessoa que apenas lê.

### Verificar as permissões por meio de uma consulta

Pergunta-se ao servidor sobre a conta conectada, com o banco atual da aba (daí a importância de verificá-lo antes). Nenhuma dessas consultas modifica nada.

```sql
-- sys.databases lista os bancos do servidor; HAS_DBACCESS(nome) vale 1 se a conta tem acesso
-- ORDER BY name ordena o resultado pelo nome do banco
SELECT name FROM sys.databases WHERE HAS_DBACCESS(name) = 1 ORDER BY name;

-- sys.fn_my_permissions(NULL, 'DATABASE') lista as permissões da conta sobre o banco atual
SELECT permission_name FROM sys.fn_my_permissions(NULL, 'DATABASE');

-- HAS_PERMS_BY_NAME devolve 1 se a permissão for concedida sobre o objeto, 0 caso contrário
-- pode_ler: SELECT sobre a tabela; pode_adicionar: INSERT (adicionar linhas)
-- pode_alterar: UPDATE (alterar linhas); pode_excluir: DELETE (remover linhas)
SELECT HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'SELECT') AS pode_ler,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'INSERT') AS pode_adicionar,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'UPDATE') AS pode_alterar,
       HAS_PERMS_BY_NAME('dbo.clientes', 'OBJECT', 'DELETE') AS pode_excluir;

-- IS_MEMBER devolve 1 se a conta pertencer ao papel do banco atual, 0 caso contrário
SELECT IS_MEMBER('db_datareader') AS leitor, IS_MEMBER('db_owner') AS proprietario;
```

Resultado possível para uma conta somente leitura (valores ilustrativos):

| pode_ler | pode_adicionar | pode_alterar | pode_excluir |
|---|---|---|---|
| 1 | 0 | 0 | 0 |

Documentações de referência: [`sys.databases`](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql), [`HAS_DBACCESS`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-dbaccess-transact-sql), [`IS_MEMBER`](https://learn.microsoft.com/en-us/sql/t-sql/functions/is-member-transact-sql), [`HAS_PERMS_BY_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-perms-by-name-transact-sql) e [`sys.fn_my_permissions`](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-my-permissions-transact-sql).

### O procedimento

| Etapa | Ação |
|---|---|
| 1 | Pedir ao administrador uma conta reservada para consulta (papel `db_datareader` no banco desejado, nenhum outro) |
| 2 | Conectar-se com essa conta para explorar, e com outra conta somente pelo tempo de uma alteração decidida antecipadamente |
| 3 | Assim que conectar, executar as consultas de verificação acima: banco atual, permissões |
| 4 | Se `pode_adicionar`, `pode_alterar` ou `pode_excluir` valer `1` quando você só quer ler, sinalize: a conta tem permissões demais |
| 5 | Refazer a verificação **para cada banco** consultado, pois as permissões não são herdadas de um banco para outro |

> **Nota:** estar em somente leitura protege os dados contra uma alteração, não contra sua **divulgação**: o que você lê pode ser confidencial (dados de contato de clientes, por exemplo). Não copie resultados reais para fora das ferramentas previstas para isso.

## Os erros de iniciante

### 1. Consulta executada no banco errado

**Cenário.** O Explorador de objetos contém um banco de teste e um banco de trabalho, com tabelas de mesmo nome. Uma aba aberta no banco errado executa `SELECT * FROM dbo.clientes;`: o resultado aparece normalmente, mas vem de outro lugar. Pior com uma escrita: o `DELETE` vai para o banco de trabalho.

| Sintoma | Causa | Solução |
|---|---|---|
| Linhas inesperadas, ou `Msg 208 Invalid object name` | O banco atual não é o que você acha | Verificar a barra de status, depois `SELECT DB_NAME();` |
| Nenhum erro, mas o resultado não parece o esperado | A tabela existe nos dois bancos, com outros dados | Abrir a consulta com um clique com o botão direito no banco desejado |
| Um script encadeia `USE` que trocam de banco no meio do caminho | O script não parte do estado presumido | Ler os `USE` de um script antes de executá-lo |

### 2. Executar uma seleção esquecida

**Cenário.** Testa-se uma consulta destacando-a, depois passa-se para outra coisa sem clicar em outro lugar. Mais tarde, escreve-se uma nova consulta embaixo e aperta-se `F5`: só sai o texto destacado antigo. Ao contrário, acredita-se executar uma única linha e, como a seleção desapareceu, **todo** o conteúdo da aba é executado, instruções de escrita inclusive.

| Sintoma | Causa | Solução |
|---|---|---|
| A nova consulta não produz “nada” ou refaz a antiga | Uma seleção antiga ainda está ativa | Clicar no texto para desfazer a seleção, depois reler o que vai sair |
| Uma escrita é executada quando se pensava lançar uma leitura | Nenhuma seleção: a aba inteira é enviada | Manter as escritas em uma aba separada, ou colocá-las em comentário |
| O resultado não corresponde à consulta exibida | O texto destacado não é o que você está olhando | Perguntar-se antes de cada `F5`: “tenho uma seleção?” |

### 3. Excluir sem `WHERE`

`DELETE FROM dbo.clientes;` **sem** condição exclui **todas** as linhas. `UPDATE dbo.clientes SET cidade = 'Lyon';` (`UPDATE` altera linhas, `SET` dá o novo valor) muda a cidade de **todos** os clientes. A condição `WHERE` é o que restringe a ação às linhas desejadas.

Por padrão, cada instrução é **confirmada** (tornada definitiva) assim que é executada: não há botão “Desfazer”. `Ctrl + Z` desfaz uma digitação no editor, não um efeito no banco. A solução cabe em quatro gestos, a serem executados **um por um**, selecionando o texto antes de `F5` (veja [a execução por seleção](#executar-o-arquivo-inteiro-ou-so-a-selecao)):

```sql
-- 1. primeiro um SELECT com EXATAMENTE a mesma condição: vemos as linhas envolvidas
SELECT id, nome, cidade FROM dbo.clientes WHERE cidade = 'Lyon';
-- 2. COUNT(*) dá o número delas; deve ser o que se espera (aqui, 2)
SELECT COUNT(*) AS a_excluir FROM dbo.clientes WHERE cidade = 'Lyon';
-- 3. BEGIN TRANSACTION abre uma transação: um grupo de instruções que se pode desfazer
-- selecione essas duas linhas (BEGIN e DELETE), depois F5; a transação continua aberta
BEGIN TRANSACTION;
-- o DELETE é executado, mas ainda não é definitivo
DELETE FROM dbo.clientes WHERE cidade = 'Lyon';
-- leia então a aba Mensagens: deve exibir (2 rows affected), senão não confirme
-- 4. selecione UMA SÓ das duas linhas seguintes, depois F5
-- ROLLBACK TRANSACTION desfaz tudo o que aconteceu desde BEGIN TRANSACTION
ROLLBACK TRANSACTION;
-- no lugar, COMMIT TRANSACTION tornaria a exclusão definitiva
-- COMMIT TRANSACTION;
```

Entre dois `F5`, a transação continua aberta na aba: isso dá tempo de ler a mensagem. Executar este bloco inteiro, sem seleção, encadearia `DELETE` e depois `ROLLBACK` sem pausa (o `COMMIT` estando em comentário) e tiraria todo o controle.

Para uma tabela de 5 clientes, dos quais 2 moram em Lyon, o `SELECT COUNT(*)` dá 2, o `DELETE` anuncia 2 linhas, e depois do `ROLLBACK` um novo `SELECT COUNT(*) FROM dbo.clientes;` devolve 5 de novo. Sem `WHERE`, o mesmo `DELETE` anuncia 5 linhas: a diferença salta aos olhos **antes** de escolher entre `COMMIT` e `ROLLBACK`.

| Ponto | O que saber |
|---|---|
| Uma transação aberta e esquecida | Ela pode **bloquear** os outros usuários da tabela enquanto não for confirmada nem desfeita. Terminar sempre com `COMMIT` ou `ROLLBACK` |
| Fechar a aba com uma transação aberta | Segundo a documentação, o SSMS pergunta se é preciso confirmar ou desfazer |
| Um backup do banco | Último recurso, mas que equivale a restaurar o banco inteiro: veja [a restauração de um `.bak`](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#restaurar-um-backup-bak-localmente) |
| Uma conta somente leitura | Torna a exclusão **impossível**: a verdadeira solução, que não depende de nenhum reflexo |

Documentação: [as transações em T-SQL](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql).

### 4. Alterar uma linha na grade de edição

A entrada `Edit Top 200 Rows` abre as linhas em uma grade parecida com a dos resultados, mas **editável**: segundo a documentação, alterar uma célula e sair da linha grava a modificação no banco. Para um iniciante que só quer olhar, a entrada certa é `Select Top 1000 Rows`.

## Um percurso completo de ponta a ponta

| Etapa | Gesto | Controle |
|---|---|---|
| 1 | Obter nome do servidor, modo de autenticação, nome do banco, permissões | Uma conta de consulta, não `sa` |
| 2 | Conectar-se; marcar a confiança no certificado somente na própria máquina | A conexão abre |
| 3 | Abrir o Explorador de objetos: banco, `Tabelas`, uma tabela, `Colunas` | Tipos, chave primária, colunas `Null` identificadas |
| 4 | Clicar com o botão direito no banco desejado, depois `Nova consulta` | Barra de status: servidor certo, banco certo |
| 5 | Executar `SELECT DB_NAME(), SUSER_NAME();` | Os dois valores esperados |
| 6 | Verificar suas permissões (`HAS_PERMS_BY_NAME` ou `sys.fn_my_permissions`) | `pode_adicionar`, `pode_alterar` e `pode_excluir` valem `0` |
| 7 | Escrever a leitura com `TOP` (por exemplo `SELECT TOP 10 * FROM dbo.livros;`) | Reler antes de `F5`, verificar que nenhuma seleção permanece |
| 8 | Ler `Resultados` **e** `Mensagens` | O número de linhas é coerente |
| 9 | Escrever uma alteração somente com uma conta prevista para isso, depois de um `SELECT`, em uma transação | `COUNT(*)` e mensagem idênticos antes do `COMMIT` |

## Para ir além

| Assunto | Onde |
|---|---|
| A sintaxe SQL, os agregados, as junções, `NULL`, o menor privilégio | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) |
| Esquemas, `dbo`, tabelas técnicas | [Esquemas e tabelas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) |
| Restaurar um backup `.bak` no SSMS, criar uma conta dedicada | [Ambiente local com SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) |
| Para que servem os índices que aparecem na árvore | [Os índices](/?c=donnees&s=bases-de-donnees&p=les-index) |
| O certificado TLS e o que ele garante | [Criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) |
| Todo o SSMS, versão por versão | [Documentação oficial do SSMS](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms) |

## As armadilhas

| Armadilha | Consequência | Solução |
|---|---|---|
| Marcar a confiança no certificado por reflexo | A conexão não verifica mais a identidade do servidor: exposição ao homem no meio | Fazê-lo somente na própria máquina, ou corrigir o certificado |
| Usar `sa` ou uma conta `sysadmin` para consultar | Nenhuma proteção: uma escrita acidental passa | Uma conta `db_datareader` somente no banco desejado |
| Executar uma consulta sem verificar o banco atual | Resultado vindo de outro banco, ou escrita no banco errado | Barra de status, clique com o botão direito no banco, `SELECT DB_NAME();` |
| `F5` com uma seleção antiga ativa | Só a consulta antiga sai | Clicar no texto antes de reler |
| `F5` sem seleção em uma aba que contém escritas | A aba inteira é executada | Separar leituras e escritas em abas distintas |
| `DELETE` ou `UPDATE` sem `WHERE` | Todas as linhas são afetadas, sem volta automática | `SELECT` idêntico primeiro, depois transação |
| Ler “10 linhas afetadas” como o total da tabela | Conclusão errada depois de um `TOP` | `SELECT COUNT(*)` para conhecer o total |
| `Edit Top 200 Rows` para “olhar” | Uma célula alterada é gravada | `Select Top 1000 Rows` |
| Deixar uma transação aberta | Os outros usuários da tabela ficam bloqueados | `COMMIT` ou `ROLLBACK` no fim de cada teste |
| Achar que um banco com permissões corretas também as tem nos outros | As permissões são definidas banco por banco | Verificar em cada banco consultado |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Pedir uma conta de consulta dedicada (`db_datareader`) | A leitura somente é imposta pelo servidor, não pela vigilância |
| Verificar suas permissões depois de cada nova conexão | Sabe-se o que se pode fazer antes de fazê-lo |
| Abrir cada aba com um clique com o botão direito no banco desejado | O banco atual já é o certo desde o começo |
| Executar `SELECT DB_NAME(), SUSER_NAME();` primeiro | O servidor confirma onde você está e quem você é |
| Colorir as conexões de produção na janela de conexão | A confusão fica visível |
| Ler com `TOP`, contar com `COUNT(*)` | Uma tabela volumosa não trava a máquina, e o total continua conhecido |
| Separar as abas de leitura e as de escrita | Um `F5` sem seleção nunca escreve |
| Escrever primeiro o `SELECT` de uma alteração, depois a transação | Vê-se as linhas visadas antes de tocá-las |
| Ler `Mensagens` depois de cada execução | O número de linhas afetadas revela um `WHERE` amplo demais |
| Não marcar a confiança no certificado fora da sua máquina | A identidade do servidor continua verificada |

## O que reter

| | |
|---|---|
| **Para lembrar** | **SSMS** é o cliente gráfico da Microsoft para o SQL Server (somente Windows). Conecta-se com um nome de servidor (`SERVIDOR\INSTANCIA`, ou `SERVIDOR,PORTA`) e uma autenticação: **do Windows** (a sessão, sem senha a digitar, mas a conta precisa existir no servidor) ou **do SQL Server** (login e senha próprios do servidor). A caixa de confiança no certificado desativa a **verificação da identidade do servidor**, não a criptografia: deve ser reservada à própria máquina. O **Explorador de objetos** mostra bancos, esquemas, tabelas, colunas com o tipo, a **chave primária** (`PK`, identificador único de cada linha) e se a coluna aceita `NULL`. Uma aba de consulta está ligada a **um banco atual** que a barra de status e `SELECT DB_NAME();` confirmam. `F5` executa **a aba inteira** sem seleção, **somente a seleção** caso contrário. A aba `Resultados` mostra as linhas, a aba `Mensagens` dá “n linhas afetadas”: número de linhas devolvidas, adicionadas, alteradas ou excluídas, jamais o total de uma tabela depois de um `TOP`. A leitura somente é garantida pelas **permissões da conta** (papel `db_datareader`, verificadas por `HAS_PERMS_BY_NAME`), banco por banco, segundo o [menor privilégio](/?c=langages&s=domain-specific-languages-dsl&p=sql). |
| **Armadilhas a evitar** | Marcar a confiança no certificado por reflexo; consultar com `sa` ou uma conta `sysadmin`; não verificar o banco atual; `F5` com uma seleção esquecida, ou sem seleção em uma aba que contém escritas; `DELETE` ou `UPDATE` sem `WHERE`; tomar a mensagem de um `TOP` pelo total; `Edit Top 200 Rows` para olhar; deixar uma transação aberta; supor que as permissões de um banco valem para outro. |
| **Boas práticas** | Conta de consulta dedicada; `SELECT DB_NAME(), SUSER_NAME();` seguido da verificação das permissões a cada conexão; aba aberta com clique com o botão direito no banco certo; conexões de produção coloridas; `TOP` para ler e `COUNT(*)` para contar; abas de leitura separadas das abas de escrita; `SELECT` idêntico antes de qualquer alteração, em uma transação que se pode desfazer; leitura sistemática da aba `Mensagens`. |
