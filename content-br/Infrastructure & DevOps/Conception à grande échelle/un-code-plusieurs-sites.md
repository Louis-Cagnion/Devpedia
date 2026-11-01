---
order: 6
---

# Um código, vários sites: o padrão multisite

Um **site** é aqui o que um visitante alcança ao digitar um endereço no seu navegador: `boutique.example` é um site, `blog.example` é outro. Cada site tem sua aparência, suas configurações, seus dados e seu público. Quando uma organização gerencia dez, quarenta ou duzentos (uma marca por país, um site por cliente, um site por evento), surge uma questão de arquitetura: será preciso escrever, implantar e corrigir o programa dez, quarenta ou duzentas vezes, ou fazê-lo **uma única vez**, para todos? O **padrão multisite** (*multisite* em inglês) escolhe a segunda resposta: **uma só base de código** (o conjunto dos arquivos do programa) atende N sites, e cada site mantém sua própria configuração, seus próprios arquivos e seus próprios dados. O conjunto dos sites servidos pelo mesmo código chama-se o **parque**.

Este capítulo trata de concepção, na sequência de [Autoscaling e distribuição de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) (vários **servidores de aplicação**, as máquinas que executam o código, idênticas atrás de um balanceador): lá, N servidores executam o mesmo código para **um** site; aqui, o mesmo código atende **N** sites. As duas abordagens se combinam. Ele supõe que você saiba o que é um [banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (um software que guarda informações em **tabelas**, como planilhas com uma linha por item e uma coluna por característica) e a linguagem [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) que permite consultá-lo.

| Seção | Pergunta à qual ela responde |
|---|---|
| [O problema](#o-problema-copiar-o-codigo-para-cada-site) | Por que não simplesmente copiar o programa para cada site? |
| [O padrão em uma imagem](#o-padrao-em-uma-imagem) | O que acontece, passo a passo, quando uma requisição chega? |
| [Reconhecer o site](#reconhecer-o-site-pedido) | Como o código sabe qual site está sendo pedido? |
| [Compartilhado e isolado](#o-que-e-compartilhado-o-que-e-isolado) | O que é comum a todos os sites, e o que continua próprio de cada um? |
| [Três variantes de armazenamento](#onde-vivem-os-dados-tres-variantes) | Um banco por site, um prefixo de tabelas por site ou um esquema por site? |
| [Fazer backup de um site](#fazer-backup-e-restaurar-um-unico-site) | Como extrair um único site de um conjunto? |
| [Atualizar o parque](#atualizar-todo-o-parque) | Como aplicar uma mudança de estrutura em N sites? |
| [Os riscos](#os-riscos-do-padrao) | O que pode dar errado quando tudo é compartilhado? |
| [Quando usar](#quando-escolher-este-padrao) | Diante de quais alternativas, e para quais casos? |
| [Um exemplo de CMS](#um-exemplo-de-cms-drupal) | Como isso aparece num sistema de gerenciamento de conteúdo real? |

## O problema: copiar o código para cada site

Quarenta sites que compartilham a mesma lógica (um catálogo, contas de usuários, páginas editoriais) podem ser geridos de duas formas opostas:

| | Uma cópia do código por site | Um único código para todos os sites |
|---|---|---|
| Correção de um erro | A refazer em 40 cópias, arriscando esquecer uma | Uma correção, válida em toda parte na próxima implantação (a colocação em produção de uma nova versão) |
| Nova funcionalidade | Desenvolvida uma vez, copiada 40 vezes | Desenvolvida uma vez, disponível em toda parte |
| Divergência entre sites | Inevitável: cada cópia acaba diferindo das outras | Impossível para o código (ele existe uma única vez) |
| Espaço em disco e memória | 40 conjuntos de arquivos idênticos | Um conjunto de arquivos |
| Liberdade de um site | Total: pode-se alterar a sua cópia | Limitada: qualquer mudança de código afeta todo mundo |
| Risco de um erro | Limitado a um site | Estendido a todo o parque |

A última linha é o preço do padrão: ganha-se em esforço e em coerência, perde-se em independência. Todo o capítulo consiste em manter o ganho limitando essa perda.

> **Analogia:** um prédio de escritórios. O edifício (o código), o elevador e a caldeira (as atualizações, a manutenção) são comuns. Cada empresa tem sua porta, sua chave, seus móveis e seus arquivos (a configuração, os arquivos, os dados). Uma pane no elevador incomoda todo mundo; um incêndio num escritório mal isolado pode se espalhar para os outros.

## O padrão em uma imagem

Uma **requisição** é a mensagem que o navegador de um visitante envia a um servidor; ela contém o **nome de host** do site visado (por exemplo `blog.example`, detalhado na seção seguinte). O **prefixo** de um site é um trecho de texto colocado diante do nome de suas tabelas (`blog_artigos` em vez de `artigos`), explicado mais adiante.

```text
  boutique.example      blog.example      club.example      <- três nomes de host
        |                    |                  |
        +--------------------+------------------+
                             |
                             v
                  Balanceador de carga            <- o mesmo para todos
                             |
                +------------+------------+
                v                         v
          Servidor de aplicação 1     Servidor de aplicação 2   <- UM código implantado
                |                         |
                +------------+------------+
                             |
        1. ler o nome de host da requisição
        2. escolher a configuração deste site  (título, idioma, prefixo, base...)
        3. abrir SEU banco ou SUAS tabelas
        4. responder com SEUS arquivos
                             |
          +------------------+-------------------+
          v                  v                   v
     dados da          dados do         dados do
     loja              blog             clube          <- isolados por site
```

| Etapa | O que acontece | O que deve continuar verdadeiro |
|---|---|---|
| 1. Ler o nome de host | O código extrai da requisição o nome do site pedido | O nome vem da requisição, portanto de um terceiro: deve ser verificado |
| 2. Escolher a configuração | Uma tabela de correspondência « nome de host para configurações » fornece o título, o idioma, os acessos ao banco | Um nome desconhecido é recusado, nunca redirecionado para um site qualquer |
| 3. Abrir os dados | Uma conexão com o banco do site, ou com as suas tabelas prefixadas | Nenhuma consulta pode alcançar os dados de outro site |
| 4. Responder | A página é montada com os arquivos, o cache e a sessão deste site | Nada do que um site produz deve aparecer em outro |

## Reconhecer o site pedido

O **nome de host** é o nome da máquina ou do site visado pela requisição: `blog.example` no endereço `https://blog.example/artigos` (`https` designa HTTP cifrado). O **DNS** (veja a [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034)) é o diretório da internet que traduz esse nome num endereço numérico de máquina; vários nomes podem apontar para a mesma máquina, e é isso que torna o padrão possível: os três sites da imagem acima chegam todos ao mesmo balanceador. Uma requisição [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (a mensagem que um navegador envia a um servidor) transporta o nome visado num **cabeçalho** (uma linha de informação acrescentada à requisição) chamado `Host` (veja [a especificação HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-host-and-authority)). O código lê esse cabeçalho e deduz dele o site.

| Critério de escolha | Exemplo | Vantagem | Limite |
|---|---|---|---|
| Nome de host completo | `blog.example` e `boutique.example` | Natural, um nome por site, um certificado por nome (o documento digital que comprova a identidade de um site em HTTPS) | Um nome (e um registro DNS) a criar para cada site |
| Subdomínio (um nome acrescentado antes de um domínio existente) | `blog.groupe.example` | Um único domínio para gerenciar, um certificado « curinga » (`*.groupe.example`) possível | Os sites compartilham o domínio pai: atenção aos **cookies**, esses pequenos arquivos que o navegador guarda e devolve a cada requisição (veja mais abaixo) |
| Início do caminho | `groupe.example/blog/` | Nenhum nome adicional a comprar | O código deve retirar o prefixo de cada endereço; os links relativos se quebram facilmente |
| Porta (o número da « porta » de uma máquina, 443 para HTTPS) | `groupe.example:8081` | Prático em desenvolvimento | Raro em produção (o site realmente aberto aos visitantes): os visitantes não digitam porta |

A escolha mais comum é o nome de host. Os exemplos deste capítulo usam o sufixo `.example`, **reservado** à documentação pela [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) (uma **RFC** é um documento de referência dos padrões da internet): esses nomes jamais designarão um site real.

### Um exemplo executável em Python

O programa a seguir simula o núcleo do padrão: uma requisição chega com um nome de host, o código escolhe a configuração do site e depois lê as tabelas **deste site** num banco compartilhado em que cada tabela leva o **prefixo** do site (um trecho de texto colocado antes do nome da tabela: `blog_artigos` em vez de `artigos`). Ele usa [Python](/?c=langages&s=python&p=python) e [SQLite](https://www.sqlite.org/docs.html), um banco de dados contido em um único arquivo (ou em memória), sem servidor a instalar, operado aqui pelo módulo `sqlite3` que vem com o Python. Ele é escrito em um único arquivo `multisite.py`, apresentado em três trechos em sequência. Usa noções básicas de Python: um [dicionário](/?c=langages&s=python&p=dictionnaires-et-ensembles) (uma tabela « chave para valor »), uma [tupla](/?c=langages&s=python&p=listes-et-tuples) (uma sequência de valores fixa), uma [função](/?c=langages&s=python&p=fonctions) (um bloco de código com nome, cujo texto entre aspas triplas colocado sob o nome, a *docstring*, serve de descrição) e um [módulo](/?c=langages&s=python&p=modules-et-environnements) (um arquivo de código que se importa). Nas docstrings deste capítulo, `@brief` resume a função, `@param` descreve um argumento e `@returns` o valor devolvido. Para experimentar o programa, cole os três trechos, na ordem, num arquivo `multisite.py` criado com um editor de texto, depois execute-o a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Cada outro programa do capítulo se cola da mesma forma num arquivo `.py` separado.

Primeiro trecho: a configuração e a verificação dos prefixos. Uma **expressão regular** (veja [as regex em Python](/?c=langages&s=python&p=regex-en-python)) é um padrão de texto que descreve as cadeias aceitas; aqui ela só aceita uma letra minúscula, depois letras minúsculas ou números (de 0 a 15 vezes, anotado `{0,15}`), depois um sublinhado final. Algumas notações do Python já aparecem neste trecho. Uma [*f-string*](/?c=langages&s=python&p=variables#as-f-strings-inserir-variaveis-em-texto) é um texto precedido de `f` em que `{expressão}` é substituído pelo seu valor; `{valor!r}` mostra o valor com as suas aspas. Uma **exceção** (veja [o tratamento de erros](/?c=langages&s=python&p=gestion-des-erreurs)) é o sinal que um programa emite quando não pode continuar normalmente: `raise` emite uma ([lançar suas próprias exceções](/?c=langages&s=python&p=gestion-des-erreurs#lancar-suas-proprias-excecoes)), e `ValueError` sinaliza um valor inaceitável. Uma [compreensão de lista](/?c=langages&s=python&p=listes-et-tuples#as-compreensoes-de-lista), `[x for x in sequencia]`, constrói uma lista em uma única linha. O `r` diante de `r"..."` indica uma cadeia bruta, em que a barra invertida não tem sentido especial.

```python
# re : módulo Python das expressões regulares (padrões de texto)
import re
# sqlite3 : módulo que vem com o Python para falar com um banco SQLite
import sqlite3

# Um dicionário : a cada nome de host, as configurações do seu site
SITES = {
    # Um título de exibição e o prefixo das tabelas de cada site
    "boutique.example": {"titulo": "A Loja", "prefixo": "loja_"},
    "blog.example": {"titulo": "O Blog", "prefixo": "blog_"},
    "club.example": {"titulo": "O Clube", "prefixo": "clube_"},
}

# Um prefixo seguro : uma letra minúscula, 0 a 15 minúsculas ou números, depois um « _ » final
PREFIXO_SEGURO = re.compile(r"[a-z][a-z0-9]{0,15}_")


def verificar_os_prefixos():
    """
    @brief Recusa um prefixo perigoso ou que sobrepõe outro.
    """
    # Lista dos prefixos de todos os sites, construída em uma linha ; values() dá
    # as configurações de cada site
    prefixos = [site["prefixo"] for site in SITES.values()]
    # enumerate dá cada prefixo com sua posição i na lista
    for i, prefixo in enumerate(prefixos):
        # fullmatch exige que TODO o texto corresponda ao padrão
        if not PREFIXO_SEGURO.fullmatch(prefixo):
            # raise interrompe o programa com uma mensagem ; !r coloca o prefixo entre aspas
            raise ValueError(f"prefixo recusado: {prefixo!r}")
        # Comparamos com todos os outros prefixos
        for j, outro in enumerate(prefixos):
            # startswith testa se « outro » começa com « prefixo » : risco de mistura
            if i != j and outro.startswith(prefixo):
                raise ValueError(f"prefixo sobreposto: {prefixo!r}")
```

Segundo trecho: a escolha do site a partir do nome de host, e o cálculo do nome real de uma tabela. Este trecho também levanta exceções (definidas acima); `LookupError` sinaliza « não encontro o que você pede ».

```python
def escolher_site(hospedeiro):
    """
    @brief Encontra a configuração do site pedido pela requisição.

    @param hospedeiro Texto « nome » ou « nome:porta », em maiúsculas ou minúsculas.

    @returns O dicionário de configuração do site.
    """
    # split(":") corta no « : » e [0] guarda a parte antes (a porta é retirada) ;
    # lower() passa para minúsculas
    nome = hospedeiro.split(":")[0].lower()
    # Um nome ausente da tabela de correspondência NÃO é um site deste parque
    if nome not in SITES:
        # Recusamos em vez de cair num site padrão
        raise LookupError(f"site ausente: {nome}")
    # Senão devolvemos as configurações deste site
    return SITES[nome]


def tabela(site, nome):
    """
    @brief Dá o nome real de uma tabela: o prefixo do site, depois o nome comum.

    @param site Dicionário de configuração de um site.
    @param nome Nome de tabela escrito no código, nunca digitado por um visitante.

    @returns O nome completo, seguro para inserir numa consulta SQL.
    """
    # O prefixo foi validado no início: ele só contém caracteres seguros
    return site["prefixo"] + nome
```

Terceiro trecho: a criação das tabelas de cada site, a resposta a uma requisição e a execução. O ponto de interrogação `?` numa consulta SQL é um **parâmetro vinculado**: o valor é transmitido à parte, nunca colado no texto da consulta, o que impede a [injeção SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql#injecao-sql-por-que-nunca-concatenar-um-valor-externo). Ele serve apenas para **valores**. Um nome de tabela não pode ser um parâmetro: ele é então composto no texto da consulta (com uma *f-string*, um texto em que `{expressão}` é substituído pelo seu valor), o que só é seguro porque o prefixo vem da configuração e foi validado.

```python
def instalar(conexao, site):
    """
    @brief Cria as tabelas de um site e põe nelas um primeiro artigo.

    @param conexao Conexão SQLite aberta.
    @param site Dicionário de configuração de um site.
    """
    # Nome real da tabela de artigos deste site, por exemplo « blog_artigos »
    artigos = tabela(site, "artigos")
    # CREATE TABLE IF NOT EXISTS cria a tabela só se ela ainda não existir
    conexao.execute(
        f"CREATE TABLE IF NOT EXISTS {artigos} "
        "(id INTEGER PRIMARY KEY, titulo TEXT NOT NULL)"
    )
    # INSERT acrescenta uma linha ; o valor passa pelo parâmetro « ? »
    # (a vírgula final faz do valor uma tupla de um só elemento, exigida por execute)
    conexao.execute(
        f"INSERT INTO {artigos} (titulo) VALUES (?)",
        (f"Bem-vindo: {site['titulo']}",),
    )


def servir(conexao, hospedeiro):
    """
    @brief Responde a uma requisição: escolhe o site, depois lê os seus artigos.

    @param conexao Conexão SQLite aberta.
    @param hospedeiro Nome de host da requisição.

    @returns O título do site e a lista dos títulos dos artigos.
    """
    # Passos 1 e 2 da imagem : ler o nome de host, escolher a configuração
    site = escolher_site(hospedeiro)
    # Passo 3 : SELECT lê as linhas, somente nas tabelas DESTE site
    linhas = conexao.execute(f"SELECT titulo FROM {tabela(site, 'artigos')}")
    # Cada linha é uma tupla ; lista construída em uma linha com o primeiro elemento
    return site["titulo"], [linha[0] for linha in linhas]


# Início : recusamos continuar se um prefixo for duvidoso
verificar_os_prefixos()
# Um banco SQLite em memória : ele desaparece ao fim do programa
conexao = sqlite3.connect(":memory:")
# Criamos as tabelas de cada um dos três sites no MESMO banco
for site in SITES.values():
    instalar(conexao, site)

# Cinco requisições: três sites conhecidos (um com porta e maiúsculas), dois falsos
HOSPEDEIROS = [
    "boutique.example",
    "BLOG.example:8080",
    "club.example",
    "pirate.example",
    "boutique.example.pirate.example",
]
# Para cada nome de host recebido
for hospedeiro in HOSPEDEIROS:
    # try / except : tentamos a resposta ; capturamos a exceção se o site for desconhecido
    try:
        # :33 reserva 33 caracteres para o nome de host, para alinhar as colunas
        print(f"{hospedeiro:33} -> {servir(conexao, hospedeiro)}")
    except LookupError as erro:
        print(f"{hospedeiro:33} -> recusado ({erro})")

# sqlite_master é a tabela interna que lista tudo o que o banco contém
nomes = conexao.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
# Mostramos os nomes das tabelas : três sites, três conjuntos de tabelas num só banco
print("tabelas da base:", [nome[0] for nome in nomes])
```

Executado com `python3 -I multisite.py` (a opção `-I` executa o Python em modo isolado, que ignora o ambiente do usuário), o programa exibe:

```text
boutique.example                  -> ('A Loja', ['Bem-vindo: A Loja'])
BLOG.example:8080                 -> ('O Blog', ['Bem-vindo: O Blog'])
club.example                      -> ('O Clube', ['Bem-vindo: O Clube'])
pirate.example                    -> recusado (site ausente: pirate.example)
boutique.example.pirate.example   -> recusado (site ausente: boutique.example.pirate.example)
tabelas da base: ['loja_artigos', 'blog_artigos', 'clube_artigos']
```

As três primeiras linhas mostram o padrão funcionando: a mesma função `servir` responde de forma diferente conforme o nome de host, e `BLOG.example:8080` é reconhecido apesar das maiúsculas e da porta. As duas últimas requisições são recusadas: **um nome desconhecido não é redirecionado para um site padrão**, e um nome que *começa* como um verdadeiro (`boutique.example.pirate.example`) não é tomado por ele, porque a comparação recai sobre o nome inteiro. A última linha mostra o armazenamento: um só banco, três conjuntos de tabelas.

> **Armadilha:** voltar para « o primeiro site » ou para um « site padrão » quando o nome de host é desconhecido. Um visitante (ou um robô) que envia um cabeçalho `Host` falso recebe então as páginas, às vezes os dados, de um site que não era o visado, e um cache intermediário pode memorizar essa mistura para outros visitantes. **Boa prática:** uma lista fechada de nomes autorizados, como `SITES` acima, e um erro claro para todo o resto (404, o código « página não encontrada », ou 421 *Misdirected Request* « requisição endereçada incorretamente », descrito na mesma [especificação HTTP](https://www.rfc-editor.org/rfc/rfc9110#name-421-misdirected-request)).

O cabeçalho `Host` é fornecido pelo visitante: ele **nunca** deve ser usado tal qual para montar um endereço absoluto (por exemplo, o link de um e-mail de redefinição de senha), senão um atacante faz com que a sua vítima receba um link para um domínio que ele controla. O endereço « oficial » de cada site se lê na configuração, não na requisição. Atrás de um balanceador ou de um servidor intermediário, o nome de origem pode também viajar num cabeçalho de encaminhamento (muitas vezes chamado [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)): só é preciso levá-lo em conta se o intermediário for confiável e sobrescrever ele mesmo esse cabeçalho.

## O que é compartilhado, o que é isolado

| Elemento | Compartilhado entre os sites | Próprio de cada site |
|---|---|---|
| Código da aplicação (arquivos) | Sim, uma única cópia | Não |
| Bibliotecas (código reutilizável escrito por outros) e extensões (módulos que acrescentam funções) instaladas | Sim, mesmas versões para todos | Eventualmente ativadas ou não por site |
| Atualizações do código | Sim: uma implantação afeta todos os sites | Não |
| Servidores, memória, processador | Sim, a menos que se configurem cotas | Não por padrão |
| Configuração (título, idioma, acesso ao banco, [chaves de API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | Não | Sim, um conjunto de configurações por site |
| Dados (artigos, contas, pedidos) | Não | Sim |
| Arquivos enviados (imagens, documentos) | Não | Sim, uma pasta por site |
| **Cache** (memória onde se guarda um resultado para não recalculá-lo) e **sessões** (a lembrança de quem está conectado) | O mecanismo pode ser (um mesmo servidor de cache), nunca as chaves | Sim: as chaves carregam o identificador do site |
| Segredos (senhas de banco, chaves) | Não | Sim, um conjunto por site (veja [Gerenciamento de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Tarefas agendadas (programas executados em hora fixa) | O disparador pode ser compartilhado | O trabalho roda para cada site |
| Registros (*logs*, os arquivos onde o programa anota o que faz) | Muitas vezes um mesmo fluxo | Cada linha indica o site envolvido |

A regra que decorre da tabela: **tudo o que é compartilhado é uma superfície de contágio** (uma pane ou uma falha se propaga para todos), e **tudo o que é isolado precisa sê-lo de fato**, ou seja, sem que um esquecimento numa consulta ou numa chave de cache deixe passar os dados de um site para outro. Essa lógica é a do *raio de impacto* descrito em [Princípios de desenvolvimento seguro](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise): procura-se reduzir o que um erro ou um comprometimento pode atingir.

## Onde vivem os dados: três variantes

A escolha mais estruturante do padrão é o lugar onde ficam os dados de cada site. Existem três organizações:

```text
 A. Um banco por site         B. Prefixo de tabelas         C. Esquema por site
                                 (um banco compartilhado)      (um banco compartilhado)

 +-----------+ +-----------+   +-----------------------+    +-----------------------+
 | base      | | base      |   | base única            |    | base única            |
 | loja      | | blog      |   |  loja_artigos         |    |  esquema loja         |
 |  artigos  | |  artigos  |   |  loja_clientes        |    |   artigos, clientes   |
 |  clientes | |  clientes |   |  blog_artigos         |    |  esquema blog         |
 +-----------+ +-----------+   |  blog_clientes        |    |   artigos, clientes   |
  (uma base a mais             +-----------------------+    +-----------------------+
   para cada site)
```

Um **esquema** é um espaço de nomes (um agrupamento que evita conflitos de nomes) dentro de um banco: duas tabelas de mesmo nome podem coexistir se pertencem a esquemas diferentes (veja [Esquemas e tabelas técnicas](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques)). Uma **conexão** é um vínculo aberto entre a aplicação e o banco, com seus próprios identificadores.

| | A. Um banco por site | B. Prefixo de tabelas por site | C. Esquema por site |
|---|---|---|---|
| Princípio | Cada site tem seu banco, com seus identificadores | Um banco comum; o nome de cada tabela começa pelo prefixo do site | Um banco comum; cada site tem seu espaço de nomes |
| Vantagens | A separação mais nítida; backup, restauração e exclusão de um site muito simples | Um só banco para hospedar e monitorar; funciona em qualquer lugar, mesmo com um mecanismo de banco de dados sem esquemas (SQLite, por exemplo) | Separação clara sem multiplicar os bancos; mesmos nomes de tabela para todos os sites |
| Limites | N bancos a criar, hospedar, monitorar e atualizar; N conjuntos de conexões | Nenhuma barreira real entre os sites; os nomes das tabelas se alongam; o catálogo do banco (a lista interna de suas tabelas) cresce: N vezes o número de tabelas | Depende do mecanismo: nem todos oferecem esquemas de verdade; a atualização continua a ser feita N vezes |
| Escrever código | Uma conexão diferente por site | Pensar no prefixo em cada consulta | Escolher o esquema da conexão, ou nomear `esquema.tabela` |

| | A. Um banco por site | B. Prefixo de tabelas por site | C. Esquema por site |
|---|---|---|---|
| Isolamento dos dados | Forte: uma consulta só alcança o banco aberto | Fraco: todas as tabelas são visíveis a partir da mesma conexão | Médio a forte, conforme os direitos dados a cada esquema |
| Direitos SQL (veja o [menor privilégio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) | Uma conta por banco, simples | Uma conta vê tudo, a menos que se deem direitos tabela por tabela (trabalhoso) | Uma conta por esquema possível |
| Backup de um único site | Copiar ou exportar um banco | Exportar apenas as tabelas do prefixo (veja mais abaixo) | Exportar um esquema |
| Restauração de um único site | Substituir um banco | Substituir um conjunto de tabelas, sem tocar nas outras | Substituir um esquema |
| Conexões ao banco | Uma por site usado e por processo (um programa em execução; veja [os riscos](#os-riscos-do-padrao)) | Uma por processo, qualquer que seja o site | Uma por processo, com o esquema escolhido na hora |
| Custo de hospedagem | Mais alto: memória e arquivos por banco | O mais baixo | Baixo |
| Mudança para outro servidor, para um site que ficou enorme | Fácil: move-se o banco | Difícil: é preciso extrair as tabelas do prefixo | Médio: move-se o esquema |

Nenhuma variante é a melhor em si. Na prática: **A** quando o isolamento e a autonomia pesam mais que o custo (clientes que exigem a separação de seus dados, sites muito desiguais); **B** quando se tem muitos sites pequenos parecidos e um mecanismo de banco simples; **C** quando o mecanismo oferece esquemas de verdade e se quer um compromisso. A [escalabilidade do banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (cache, réplicas, particionamento) se coloca depois, site a site ou para o conjunto.

### Variante A em código: um arquivo por site

Com SQLite, um « banco por site » é um arquivo por site. Este programa cria dois arquivos, mostra que a conexão de um site não enxerga as tabelas do outro, depois faz o backup de um único site. O módulo `tempfile` cria uma pasta temporária, e `pathlib.Path` manipula caminhos de arquivos (veja [manipular arquivos e pastas](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

```python
# sqlite3 : acesso ao SQLite ; tempfile : pasta temporária ; Path : caminhos de arquivos
import sqlite3
import tempfile
from pathlib import Path

# Os nomes dos sites são escolhidos pelo código, nunca por um visitante
SITES = ["loja", "blog"]
# Uma pasta temporária criada para o teste (mkdtemp não a apaga no fim)
pasta = Path(tempfile.mkdtemp())


def abrir(site):
    """
    @brief Abre o banco próprio de um site: um arquivo por site.

    @param site Nome do site, escolhido pelo código (nunca por um visitante).

    @returns Uma conexão SQLite no arquivo deste site.
    """
    # O arquivo é criado na primeira abertura ; o operador / monta os caminhos
    return sqlite3.connect(pasta / f"{site}.sqlite")


# Preparamos um arquivo por site
for site in SITES:
    # Conexão com o arquivo deste site
    base = abrir(site)
    # Mesmo nome « artigos » para todos : sem prefixo, a separação é o arquivo
    base.execute("CREATE TABLE artigos (id INTEGER PRIMARY KEY, titulo TEXT)")
    # Uma linha de exemplo
    base.execute("INSERT INTO artigos (titulo) VALUES (?)", (f"Artigo de {site}",))
    # commit torna as alterações definitivas no arquivo
    base.commit()
    # Fechamos a conexão
    base.close()

# Uma tabela « ventes » criada só na base da loja
loja = abrir("loja")
loja.execute("CREATE TABLE ventes (id INTEGER PRIMARY KEY, montant REAL)")
loja.commit()
loja.close()

# Isolamento : a conexão do blog só enxerga o arquivo do blog
blog = abrir("blog")
# Leitura dos próprios artigos ; fetchall devolve todas as linhas em forma de lista
print("blog:", blog.execute("SELECT titulo FROM artigos").fetchall())
# Tentativa de ler uma tabela que só existe no arquivo da loja
try:
    blog.execute("SELECT montant FROM ventes")
except sqlite3.OperationalError as erro:
    print("tabela de outro site ->", erro)

# Backup de um único site : copiar o banco dele para um novo arquivo
copia = sqlite3.connect(pasta / "blog-copia.sqlite")
# backup copia o banco inteiro do blog, mesmo que escritas cheguem durante a cópia
blog.backup(copia)
# iterdir() lista o conteúdo da pasta ; a lista ordenada dos nomes é construída em uma
# linha (expressão geradora : uma compreensão sem colchetes)
print("arquivos:", sorted(caminho.name for caminho in pasta.iterdir()))
# Fechamos as duas conexões restantes
blog.close()
copia.close()
```

Saída obtida:

```text
blog: [('Artigo de blog',)]
tabela de outro site -> no such table: ventes
arquivos: ['blog-copia.sqlite', 'blog.sqlite', 'loja.sqlite']
```

A consulta que visa a tabela `ventes`, presente apenas no arquivo da loja, falha a partir da conexão do blog: é o isolamento da variante A. O backup de um único site não exige nenhuma triagem, já que todo o conteúdo do arquivo pertence a ele.

### Variante C em código: um esquema por site

SQLite não tem esquemas no sentido dos outros mecanismos, mas sua instrução `ATTACH DATABASE` (« anexar um banco ») anexa a uma conexão vários bancos nomeados, que se consultam com a mesma escrita `nome.tabela` de um esquema. É uma boa simulação do comportamento, sem pretender reproduzir os direitos de um mecanismo mais completo.

```python
# sqlite3 : módulo Python para falar com um banco SQLite
import sqlite3

# Uma conexão principal, em memória
conexao = sqlite3.connect(":memory:")

# ATTACH anexa um banco extra sob um nome : aqui, um por site
conexao.execute("ATTACH DATABASE ':memory:' AS loja")
conexao.execute("ATTACH DATABASE ':memory:' AS blog")
# As duas tabelas têm o mesmo nome ; o nome antes do ponto as distingue
conexao.execute("CREATE TABLE loja.artigos (id INTEGER PRIMARY KEY, titulo TEXT)")
conexao.execute("CREATE TABLE blog.artigos (id INTEGER PRIMARY KEY, titulo TEXT)")
# Uma única linha, acrescentada na tabela do blog
conexao.execute("INSERT INTO blog.artigos (titulo) VALUES ('Artigo do blog')")
# Leitura no espaço « blog »
linhas_blog = conexao.execute("SELECT titulo FROM blog.artigos").fetchall()
print("blog.artigos:", linhas_blog)
# Leitura no espaço « loja » : mesmo nome de tabela, conteúdo separado
linhas_loja = conexao.execute("SELECT titulo FROM loja.artigos").fetchall()
print("loja.artigos:", linhas_loja)
```

Saída obtida:

```text
blog.artigos: [('Artigo do blog',)]
loja.artigos: []
```

As duas tabelas `artigos` coexistem sem conflito. Num mecanismo que conhece esquemas (PostgreSQL, por exemplo, cuja [documentação dos esquemas](https://www.postgresql.org/docs/current/ddl-schemas.html) também descreve o caminho de busca que evita escrever o nome do esquema antes de cada tabela), escolhe-se o esquema uma vez, na abertura da conexão.

## Fazer backup e restaurar um único site

Na variante A, fazer o backup de um site é evidente: copia-se o seu banco. Na variante B, é preciso encontrar **as tabelas deste site** entre todas as da base. A ideia natural é procurar os nomes que começam pelo prefixo, com o operador SQL `LIKE`, que compara um texto a um padrão. Ela tem uma armadilha clássica: num padrão `LIKE`, o sublinhado `_` não significa « um sublinhado », mas « **qualquer caractere único** » (e `%` significa « qualquer sequência de caracteres »).

```python
# sqlite3 : módulo Python para falar com um banco SQLite
import sqlite3

# Um banco em memória contendo as tabelas de dois sites de nomes parecidos
conexao = sqlite3.connect(":memory:")
# « blog_ » e « blogueiro_ » são dois prefixos diferentes ; nenhum começa com o outro
for nome in ["blog_artigos", "blog_notas", "blogueiro_artigos"]:
    # Criamos uma tabela mínima para cada nome
    conexao.execute(f"CREATE TABLE {nome} (id INTEGER)")

# sqlite_master lista as tabelas ; LIKE ? compara o nome ao padrão passado como parâmetro
consulta = "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ?"
# « _ » vale « qualquer caractere » : « blog_% » pega também blogueiro_artigos
ingenuo = conexao.execute(consulta, ("blog_%",)).fetchall()
print("LIKE 'blog_%':", sorted(nome[0] for nome in ingenuo))
# Escapamos o « _ » com « \ » e o declaramos com ESCAPE : vira um sublinhado real
exato = conexao.execute(consulta + " ESCAPE '\\'", ("blog\\_%",)).fetchall()
print("LIKE 'blog\\_%' ESCAPE:", sorted(nome[0] for nome in exato))
```

Saída obtida:

```text
LIKE 'blog_%': ['blog_artigos', 'blog_notas', 'blogueiro_artigos']
LIKE 'blog\_%' ESCAPE: ['blog_artigos', 'blog_notas']
```

Sem o escape, o backup do blog teria levado a tabela `blogueiro_artigos`, de outro site: um vazamento de dados num arquivo de backup. Mesmo com o escape, uma regra de segurança continua preferível: **verificar na inicialização que o prefixo de um site não é o início de nenhum outro** (o que faz `verificar_os_prefixos` acima) e **construir a lista das tabelas do site no código** (`prefixo + nome` para cada tabela conhecida) em vez de deduzi-la de um padrão. Para as variantes A e C, essa etapa de triagem não existe, o que é um argumento concreto a favor do isolamento delas.

| Operação | Variante A (banco) | Variante B (prefixo) | Variante C (esquema) |
|---|---|---|---|
| Fazer backup de um site | Uma exportação do banco | Exportar a lista exata de tabelas do site | Exportar o esquema |
| Restaurar um site | Substituir o banco | Excluir e recriar as tabelas do prefixo, verificando que nenhuma tabela de outro site é tocada | Substituir o esquema |
| Excluir um site | Excluir o banco | Excluir as suas tabelas, uma a uma | Excluir o esquema |
| Clonar um site (pré-produção: cópia de teste antes da publicação) | Copiar o banco | Copiar as tabelas sob um novo prefixo | Copiar o esquema |
| Risco principal | Esquecer um banco na lista dos backups | Confundir dois prefixos parecidos | Direitos amplos demais em vários esquemas |

## Atualizar todo o parque

Compartilhar o código significa também compartilhar as **mudanças de estrutura**: acrescentar uma coluna à tabela dos artigos (veja [Migrações de dados seguras](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) e a seção sobre migrações do [ORM](/?c=donnees&s=bases-de-donnees&p=orm) para a noção de migração versionada) precisa ser feito **em cada um dos N sites**, já que cada um tem suas próprias tabelas. O código é implantado uma vez; a estrutura, por sua vez, é atualizada N vezes.

```text
Implantação do código novo  (uma vez, instantânea)
        |
        v
Código novo espera uma coluna « publicado » nos artigos
        |
        v
Migração da estrutura
   site 1 ... OK
   site 2 ... OK
   site 3 ... FALHA            <- o parque agora está EM ESTADO MISTO
   sites 4 a 40 ... aguardando    (o código novo sobre tabelas com a estrutura antiga)
```

O estado misto é o risco próprio deste padrão: enquanto o laço não termina, o mesmo código roda diante de estruturas diferentes. As defesas são as mesmas de uma migração de dados: uma operação **reexecutável sem risco** (a **idempotência**, ou seja, dar o mesmo resultado quer seja executada uma ou várias vezes), um registro do que já foi feito, e um código compatível com a estrutura antiga **e** com a nova durante a transição.

```python
# sqlite3 : módulo Python para falar com um banco SQLite
import sqlite3

# Os prefixos de três sites que dividem um mesmo banco
PREFIXOS = ["loja_", "blog_", "clube_"]
# Banco em memória para o teste
conexao = sqlite3.connect(":memory:")
# Criamos a tabela de artigos de cada site, com a estrutura antiga
for prefixo in PREFIXOS:
    conexao.execute(f"CREATE TABLE {prefixo}artigos (id INTEGER, titulo TEXT)")
# Um site já recebeu a nova coluna num teste anterior interrompido
conexao.execute("ALTER TABLE blog_artigos ADD COLUMN publicado INTEGER DEFAULT 0")


def migrar(conexao, prefixo):
    """
    @brief Acrescenta a coluna « publicado » se ela faltar (reexecutável sem risco).

    @param conexao Conexão SQLite aberta.
    @param prefixo Prefixo de tabelas de um site, já validado.

    @returns « migrado » ou « já atualizado ».
    """
    # Nome real da tabela deste site
    tabela = f"{prefixo}artigos"
    # PRAGMA table_info lista as colunas ; o índice 1 de cada linha é o nome
    colunas = [linha[1] for linha in conexao.execute(f"PRAGMA table_info({tabela})")]
    # Coluna já presente : nada a fazer, e sobretudo nenhum erro « duplicate column »
    if "publicado" in colunas:
        # Resposta sem modificar nada
        return "já atualizado"
    # ALTER TABLE ... ADD COLUMN acrescenta a coluna, com valor 0 nas linhas existentes
    conexao.execute(f"ALTER TABLE {tabela} ADD COLUMN publicado INTEGER DEFAULT 0")
    # Sinalizamos que este site acaba de ser modificado
    return "migrado"


# Uma migração do parque = um laço sobre todos os sites ; rodamos duas vezes
for passagem in (1, 2):
    # Um dicionário por passagem (construído em uma linha) : prefixo -> resultado
    balanco = {prefixo: migrar(conexao, prefixo) for prefixo in PREFIXOS}
    print(f"passagem {passagem}:", balanco)
```

Saída obtida:

```text
passagem 1: {'loja_': 'migrado', 'blog_': 'já atualizado', 'clube_': 'migrado'}
passagem 2: {'loja_': 'já atualizado', 'blog_': 'já atualizado', 'clube_': 'já atualizado'}
```

A primeira passagem migra dois sites e reconhece que o terceiro já estava migrado; a segunda não muda mais nada. Sem a verificação da coluna, a primeira passagem teria falhado no blog e deixado os sites seguintes sem migrar.

| Prática de implantação | Efeito | Precaução |
|---|---|---|
| Migrar primeiro um site piloto, depois os outros em lotes | Um defeito é descoberto em um único site | Escolher um site representativo, mas pouco crítico |
| Escrever o código novo para que ele tolere a estrutura antiga | Sem interrupção durante o laço de migração | Retirar o código de compatibilidade quando todos os sites estiverem migrados |
| Registrar, por site, a versão de estrutura alcançada | Sabe-se exatamente onde retomar após uma pane | Uma tabela de acompanhamento por site, ou um identificador de versão na configuração |
| Prever o tempo total (número de sites vezes a duração de uma migração) | Evita a surpresa de uma migração de várias horas | 40 sites a 3 minutos cada são duas horas de laço |
| Manter um plano de reversão por site | Um site com falha não bloqueia os outros | Fazer backup de cada site antes de migrá-lo |

## Os riscos do padrão

A multiplicação transforma cada problema local num problema potencialmente coletivo:

| Risco | Mecanismo | Defesa |
|---|---|---|
| Uma atualização afeta todos os sites | Uma implantação defeituosa quebra os N sites de uma vez | Implantação progressiva (um site piloto, depois lotes); teste numa cópia; plano de reversão preparado (veja [atualizações progressivas](/?c=infrastructure-devops&s=kubernetes&p=autoscaling-et-rolling-updates)) |
| Uma falha de código afeta todo o parque | O código é idêntico em toda parte: uma injeção ou uma falha de acesso explorável num site o é em todos | Atualizações de segurança rápidas; direitos SQL limitados; isolamento dos dados (variantes A ou C); monitoramento por site |
| Um site « barulhento » desacelera os outros | Um site muito solicitado (campanha, robô, importação em massa) consome o processador, a memória ou as conexões do banco compartilhado: é o efeito do **vizinho barulhento** (*noisy neighbor*) | Cotas por site; limitação de taxa (veja [sobrecarga e negação de serviço na aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)); tirar o site do parque (veja mais abaixo) |
| Saturação das conexões do banco | Cada processo abre conexões: multiplicando pelo número de sites, ultrapassa-se o limite do banco | Um [pool de conexões](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#connection-pooling) compartilhado (um conjunto de conexões já abertas e reutilizadas); conexões abertas sob demanda; teto por site |
| Vazamento de dados entre sites | Uma consulta que esquece o prefixo ou o esquema; uma chave de cache sem identificador de site | Uma única função constrói os nomes de tabela; revisão de código; teste automático de não mistura |
| Cache misturado | Dois sites gravam sob a mesma chave (`carrinho:42`) no mesmo servidor de cache | Prefixar todas as chaves pelo site (`loja:carrinho:42`), veja [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| Sessões compartilhadas por um cookie amplo demais | Um cookie criado para o domínio pai (`.groupe.example`) é enviado a todos os subsites | Um cookie por nome de host, sem atributo de domínio; veja [sessões e cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Tarefas agendadas pesadas demais | Uma tarefa que percorre 40 sites dura 40 vezes mais; um site lento atrasa os seguintes | Um trabalho dividido por site, executado em paralelo com um teto |
| Registros ilegíveis | Impossível saber qual site causa um problema | Cada linha de registro contém sempre o identificador do site (veja [agregação de logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)) |

### A aritmética das conexões

Um banco aceita apenas um número limitado de conexões simultâneas. Se cada processo da aplicação abre uma conexão **por site**, o total cresce como um produto. Com números de exemplo (inventados): 6 servidores, 8 processos por servidor, 40 sites, e um banco que aceita 200 conexões.

| Organização | Cálculo | Conexões no pior caso |
|---|---|---|
| Um banco comum (variantes B e C), uma conexão por processo | 6 × 8 | 48 |
| Um banco por site (variante A), uma conexão aberta sob demanda por site atendido | 6 × 8 × 40 | 1 920 |
| Mesma variante A com um pool compartilhado limitado a 100 conexões | teto | 100 |

A variante A, a mais isolada, é a que satura mais depressa: sem pool nem teto, 1 920 conexões possíveis contra 200 aceitas significam recusas de conexão no primeiro pico de acesso. O aumento da escala dos servidores de aplicação (acrescentar máquinas com o [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge)) multiplica ainda mais o primeiro fator: **acrescentar um servidor aumenta o número de conexões que o banco deve suportar**, o que precisa ser antecipado.

### Quando um site deve sair do parque

Um site cujo tráfego ultrapassa muito o dos outros coloca o mesmo problema que a « conta de celebridade » do [feed de notícias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out): tratá-lo como os outros custa caro para todos. A defesa é comparável, um **modelo híbrido**: a maioria dos sites pequenos fica no parque compartilhado, e o site gigante recebe seu próprio banco, até mesmo seus próprios servidores, continuando a executar **o mesmo código**. É um argumento para que a configuração de um site decida onde moram os seus dados (e não o código), a fim de que essa mudança só exija uma alteração de configuração.

## Quando escolher este padrão

O padrão multisite não é a única forma de atender vários sites ou vários clientes:

| | Uma instalação por site | Multisite (este capítulo) | Uma única instalação, uma coluna « site » |
|---|---|---|---|
| Princípio | Cada site tem sua própria implantação completa (código, banco, servidores), por exemplo um [contêiner](/?c=infrastructure-devops&s=docker&p=concepts-de-base) por site | Um código, N configurações, N conjuntos de dados | Um único site técnico; cada linha de cada tabela leva o identificador do **locatário** (o cliente ou a marca a quem ela pertence) |
| Isolamento | Máximo | Bom a médio, conforme a variante | Fraco: tudo depende de um `WHERE site = ...` (a cláusula SQL que filtra as linhas) sem nenhum esquecimento |
| Custo por site | Alto | Médio | Baixo |
| Atualização | N implantações, mas independentes, escalonáveis | Uma implantação para o código, N migrações | Uma implantação, uma migração |
| Personalização de um site | Livre | Por configuração, ou extensões ativadas por site | Limitada |
| Quando usar | Poucos sites, forte autonomia ou restrições legais | Muitos sites parecidos, uma equipe que quer um código único | Locatários muito numerosos e idênticos (milhares), isolamento garantido pelo código |

O multisite se justifica quando os sites **se parecem muito** (mesmas funcionalidades, mesmos ciclos de atualização) e uma mesma equipe os gerencia. Justifica-se menos quando os sites divergem em funcionalidades (o código fica cheio de « se este site... »), quando obrigações contratuais ou legais exigem uma separação rígida (hospedagem em países diferentes, por exemplo), ou quando a independência das datas de atualização é uma exigência de cada site.

## Um exemplo de CMS: Drupal

> **Este exemplo não é o assunto do capítulo.** O padrão descrito acima se aplica a qualquer software. O Drupal é dado aqui apenas para mostrar uma implementação real desse padrão: é um [sistema de gerenciamento de conteúdo](https://www.drupal.org/docs) (*CMS*, em inglês *Content Management System*, um software que permite publicar e organizar páginas sem escrevê-las à mão) escrito em [PHP](/?c=langages&s=php&p=syntaxe) que sabe, por concepção, servir vários sites a partir de um único código. Os nomes e o comportamento descritos aqui são verificados no código-fonte do Drupal 11.x.

O Drupal organiza seus sites numa pasta `sites/` situada ao lado do código comum. Cada site tem sua subpasta, cujos arquivos desempenham os papéis da tabela do padrão:

| Elemento do padrão | Realização no Drupal |
|---|---|
| Um código compartilhado | Uma única cópia dos arquivos do Drupal e de seus módulos |
| Tabela « nome de host para site » | Um arquivo `sites/sites.php` que associa um endereço a uma subpasta; sem ele, o Drupal serve sempre `sites/default` |
| Configuração de um site | Um arquivo `settings.php` na subpasta do site |
| Arquivos próprios do site | Uma pasta de arquivos na subpasta do site |
| Banco de dados do site | Ajustado em `settings.php`: banco próprio, ou banco compartilhado com um **prefixo de tabelas** |

A árvore de diretórios se parece com isto:

```text
 raiz do projeto
  ├── (código comum da aplicação e de seus módulos)
  └── sites/
        ├── sites.php            <- correspondências « endereço -> subpasta »
        ├── default/             <- site padrão
        ├── loja/
        │     ├── settings.php   <- banco, prefixo, configurações do site « loja »
        │     └── files/         <- arquivos enviados deste site
        └── blog/
              ├── settings.php
              └── files/
```

O arquivo `settings.php` de um site declara a conexão ao banco e, eventualmente, o prefixo. Eis uma versão mínima, escrita para este capítulo (nomes inventados); `$databases` é um **array** PHP (uma lista de pares nome-valor) cujas chaves descrevem a conexão (`mysql` designa [MySQL](https://dev.mysql.com/doc/), um software de banco de dados):

```php
<?php

// Configurações da conexão ao banco do site « blog », no array $databases
$databases['default']['default'] = [
  // Nome do banco : um banco próprio do site (variante A do capítulo)
  'database' => 'base_blog',
  // Conta de acesso ao banco, limitada a este banco
  'username' => 'conta_blog',
  // getenv lê uma variável de ambiente : a senha não fica escrita no arquivo
  'password' => getenv('SENHA_BLOG'),
  // Endereço do servidor de banco de dados
  'host' => 'base.interne.example',
  // Mecanismo de banco de dados utilizado (MySQL aqui)
  'driver' => 'mysql',
  // Prefixo de tabelas : vazio aqui ; com um banco compartilhado (variante B), 'blog_'
  'prefix' => '',
];
```

O arquivo `sites/sites.php` associa um nome de host à subpasta que o serve. Ele não existe na instalação: copia-se o arquivo de exemplo `sites/example.sites.php` com o nome `sites/sites.php`. Sem `sites/sites.php`, o Drupal serve sempre o site `sites/default`, e é este arquivo que ativa o multisite:

```php
<?php

// O nome de host pedido (chave) serve as configurações da subpasta « blog » (valor)
$sites['blog.example'] = 'blog';
// Mesmo princípio para a loja : uma linha por site do parque
$sites['boutique.example'] = 'loja';
```

Um nome de host ausente de `sites.php` não é recusado: o Drupal também cai em `sites/default`, o « site padrão » que o capítulo desaconselha. Somente a configuração `trusted_host_patterns` de `settings.php` (a lista dos nomes de host aceitos) pode recusar um nome desconhecido.

O que o exemplo ilustra do padrão: o **código é comum**, a **tabela de correspondência** é uma simples lista, a **configuração** (inclusive a escolha entre banco próprio e prefixo de tabelas) é um arquivo por site, e os **arquivos** têm uma pasta por site. Ele também ilustra os riscos: uma atualização do Drupal ou de um módulo afeta todos os sites ao mesmo tempo, e os comandos de administração em linha de comando devem designar explicitamente o site visado (a ferramenta de administração do Drupal em linha de comando, o [Drush](https://www.drush.org/), faz isso por uma opção que informa o endereço do site), sob pena de agir sobre o errado.

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Um « site padrão » para qualquer nome desconhecido | Um cabeçalho `Host` falso obtém as páginas ou os dados de outro site; um cache pode memorizar a mistura | Lista fechada de nomes; erro (404 ou 421) para o resto |
| Montar endereços absolutos a partir do cabeçalho `Host` | Um atacante faz sua vítima receber um link para o domínio dele | Ler o endereço oficial do site na configuração |
| Prefixo de tabela digitado ou modificável por um visitante | Injeção SQL pelo nome da tabela, que um parâmetro vinculado não consegue proteger | Prefixo vindo da configuração, validado na inicialização por um padrão rigoroso |
| Dois prefixos iguais, ou um início do outro (`blog_` e `blog_eu_`, se o padrão admitir um `_` interno) | As tabelas de um site podem se confundir com as de outro | Verificar na inicialização que nenhum prefixo recobre outro |
| `LIKE 'prefixo_%'` para encontrar as tabelas de um site | O `_` do padrão vale « qualquer caractere »: um backup pode levar as tabelas de outro site | `ESCAPE`, ou melhor, uma lista de tabelas construída no código |
| Chaves de cache sem identificador de site | Um site lê o dado guardado em cache por outro | Prefixar todas as chaves pelo site |
| Cookie de sessão para o domínio pai | Uma sessão válida num site vale em todos os subsites | Um cookie por nome de host |
| Migrar os sites sem ter previsto uma reexecução segura | Uma falha no site 3 deixa um parque em estado misto, e a nova tentativa falha | Operação idempotente, registro por site |
| Uma conexão por processo e por site, sem teto | As conexões ultrapassam o limite do banco já no pico de acesso | Pool compartilhado, abertura sob demanda, teto por site |
| Registros sem identificador de site | Não se sabe qual site causa um incidente | O identificador do site em cada linha |
| Manter num site gigante o mesmo regime dos pequenos | O site prejudica todo o parque | Mover seus dados e seus servidores, com o mesmo código |
| Personalizar o código para um site | O código único vira uma coleção de casos particulares | Passar pela configuração ou por uma extensão ativada por site |

## Boas práticas

| Boa prática | Por que |
|---|---|
| Uma tabela de correspondência fechada « nome de host para configuração », verificada na inicialização | Nenhum site inesperado é servido |
| Toda diferença entre sites vive na configuração, nunca no código | O código continua único e testável |
| Uma única função constrói os nomes de tabela (ou escolhe a conexão) | Nenhuma consulta pode esquecer o isolamento |
| Um teste automático que consulta dois sites e verifica que nenhum dado passa de um para o outro | Um vazamento é detectado antes da produção |
| Escolher a variante de armazenamento pelo isolamento exigido, não pela comodidade do primeiro dia | Mudar de variante depois custa caro |
| Implantar primeiro num site piloto, depois em lotes | Um defeito não atinge o parque inteiro |
| Migrações idempotentes, com a versão alcançada registrada por site | Uma pane no meio do caminho se recupera |
| Contabilizar as conexões (processos × sites) antes de acrescentar servidores | O banco não cai no pico de acesso |
| Colocar o identificador do site nos registros, no cache e nas métricas (medidas numéricas da atividade) | Identifica-se o site barulhento e isola-se um incidente |
| Prever desde o início a saída de um site do parque | Um site gigante se muda com uma alteração de configuração |
| Fazer backup e testar a restauração site a site | Restaurar um site não envolve os outros |

## O que reter

| | |
|---|---|
| **Para lembrar** | O **padrão multisite** atende N sites a partir de **uma única base de código**: a cada requisição, o código lê o nome de host, escolhe a configuração do site numa lista fechada e depois abre os dados de **este** site. O código e suas atualizações são **compartilhados**; a configuração, os dados, os arquivos, as chaves de cache e os segredos são **isolados**. Os dados se organizam de três formas: um **banco por site** (isolamento forte, custo e conexões mais altos), um **prefixo de tabelas** num banco compartilhado (o mais barato, o isolamento mais fraco, cuidados para fazer backup), um **esquema por site** (compromisso, conforme o mecanismo). O preço do padrão é um risco coletivo: uma atualização ou uma falha de código atinge todos os sites, um site barulhento desacelera os outros, as conexões do banco se multiplicam com o número de sites. O Drupal é apenas um exemplo de produto que implementa esse padrão. |
| **Armadilhas a evitar** | Servir um site padrão para um nome desconhecido; montar endereços a partir do cabeçalho `Host`; deixar um visitante influenciar o prefixo; prefixos que se sobrepõem; recuperar as tabelas de um site com um `LIKE` sem escape; chaves de cache ou cookies comuns a vários sites; uma migração não reexecutável; uma conexão por processo e por site sem teto; registros sem identificador de site; personalizar o código para um site. |
| **Boas práticas** | Uma lista fechada de sites, verificada na inicialização; a configuração para toda diferença entre sites; uma função única para construir os nomes de tabela ou escolher a conexão; um teste de não mistura entre dois sites; uma implantação progressiva com um site piloto; migrações idempotentes acompanhadas por site; um cálculo das conexões antes de acrescentar servidores; o identificador do site em toda parte (registros, cache, métricas); uma saída prevista para um site que cresceu demais. |
