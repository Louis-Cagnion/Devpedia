---
order: 6
---

# Fila de espera, trabalhador e trava na aplicação (31/10/2026)

Uma **tarefa** é um trabalho que o programa precisa realizar: enviar um e-mail, recalcular uma ficha, apagar dados antigos. Quando um site recebe uma **requisição** (o pedido enviado pelo navegador de um visitante), ele pode fazer a tarefa ele mesmo antes de responder, ou **colocá-la na fila** e responder logo, deixando que outro programa a faça depois. Este capítulo constrói a segunda via, de ponta a ponta, em seis partes:

| Parte | Pergunta à qual responde | Seção |
|---|---|---|
| A **fila de espera** | Onde guardar as tarefas enquanto esperam? | [A fila](#o-mini-sistema-de-teste-a-fila) |
| O **trabalhador** (*worker*) | Quem as executa, e como escrever vários trabalhadores sem copiar o laço? | [Método modelo](#o-padrao-metodo-modelo-um-esqueleto-fixo-um-vazio-a-preencher) |
| A **trava na aplicação** | Como impedir que dois trabalhadores toquem na mesma ficha ao mesmo tempo? | [A trava](#a-trava-na-aplicacao-sobre-uma-entidade) |
| O **agendador** | Quem deposita as tarefas recorrentes? | [O agendador](#o-agendador-da-aplicacao-um-unico-cron-que-decide) |
| As **novas tentativas** | O que fazer quando uma tarefa falha, ou falha sempre? | [Novas tentativas](#novas-tentativas-tarefa-envenenada-e-idempotencia) |
| O **supervisor** | Quem relança um trabalhador que parou? | [O supervisor](#manter-um-trabalhador-vivo-o-supervisor) |

O código está escrito em [Python](/?c=langages&s=python) com um banco [SQLite](https://www.sqlite.org/docs.html) (um banco de dados contido em um único arquivo), consultado em [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql). É um **mini-sistema inventado para a ocasião**, pequeno o bastante para ser lido por inteiro e executado; ele mostra o princípio, mas não substitui um gerenciador de filas de verdade. Uma última seção mostra as mesmas ideias num framework [PHP](/?c=langages&s=php) (uma estrutura de software pronta que organiza uma aplicação) muito difundido, o [Drupal](https://www.drupal.org), apenas a título de **exemplo**.

| Ferramenta real | O que é | Para aprofundar |
|---|---|---|
| Redis | Banco de dados em memória cuja lista pode servir de fila | [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| RabbitMQ | Programa dedicado a filas de mensagens, com confirmação e novas tentativas | [Documentação](https://www.rabbitmq.com/docs) |
| Amazon SQS | Serviço de fila hospedado pela Amazon Web Services, sem servidor para gerenciar | [Documentação](https://docs.aws.amazon.com/sqs/) |
| Celery | Biblioteca Python que põe tarefas numa fila e as executa | [Documentação](https://docs.celeryq.dev/) |

O capítulo vizinho sobre [bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#filas-e-processamento-assincrono) apresenta a fila de espera em poucas linhas como remédio para uma requisição lenta; este aqui entra nos detalhes do funcionamento. A seção [Automação](/?c=infrastructure-devops&s=automatisation) cobre outro meio de encadear tarefas: [o workflow visual](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow), em que se montam blocos numa tela em vez de escrever código.

## Por que colocar um trabalho na fila

Sem fila, o visitante espera o fim do trabalho. Com fila, a requisição deposita uma tarefa (alguns milissegundos) e responde; o trabalho pesado é feito por trás, no seu ritmo.

```text
SEM FILA                                   COM FILA

visitante --requisição--> servidor         visitante --requisição--> servidor
                           | faz o trabalho                          | deposita a tarefa
                           | (8 segundos)                             v
visitante <--resposta--- servidor          visitante <--resposta-- FILA (instantâneo)
        (depois de 8 s)                                              |
                                                                     v
                                                     trabalhador: faz o trabalho
                                                     (8 segundos, nos bastidores)
```

| Necessidade | Sem fila | Com fila |
|---|---|---|
| **Responder rápido** | A requisição dura o tempo do trabalho | A requisição dura o tempo de um depósito |
| **Absorver um pico** | 1 000 envios de uma vez saturam o servidor | As 1 000 tarefas esperam, 2 ou 3 trabalhadores as escoam em velocidade constante |
| **Repetir uma falha** | O trabalho que falhou se perde, ou o visitante vê um erro | A tarefa volta para a fila e é tentada de novo mais tarde |
| **Sobreviver a uma reinicialização** | O trabalho guardado na memória desaparece | A fila é guardada (aqui, no banco): as tarefas esperam o retorno do trabalhador |
| **Separar os ritmos** | Um envio de e-mail lento atrasa o site inteiro | Cada tipo de tarefa tem seus próprios trabalhadores |

O preço a pagar: o resultado não é mais imediato (é preciso avisar o usuário ou deixá-lo consultar um estado), o sistema tem uma peça a mais para vigiar, e uma tarefa pode ser executada **mais de uma vez** (ver [Novas tentativas](#novas-tentativas-tarefa-envenenada-e-idempotencia)).

## Produtor, fila e trabalhador

Três papéis dividem o trabalho:

```text
  PRODUTOR                FILA DE ESPERA                 TRABALHADOR
 (deposita)              (guarda, em ordem)             (executa)

 requisição web --+      +---------------------+        +--> trabalhador A
 agendador -------+----> | tarefa 1            | -----> |
 outro trabalhador+      | tarefa 2            |        +--> trabalhador B
                         | tarefa 3  ...       |
                         +---------------------+
                          o primeiro a chegar é o primeiro a ser atendido
```

| Papel | Definição | Exemplo |
|---|---|---|
| **Produtor** | Tudo o que deposita uma tarefa | O código que trata um formulário; o agendador |
| **Fila de espera** (*queue*) | Uma lista ordenada onde se deposita de um lado e se retira do outro: o primeiro a chegar é o primeiro a ser atendido | Uma tabela no banco, um serviço dedicado |
| **Trabalhador** (*worker*, « operário ») | Um [processo](/?c=langages&s=c&p=processus) (um programa em execução) que roda em laço: pega uma tarefa, a processa, recomeça | O script `lancer_worker.py` mais adiante |
| **Agendador** (*scheduler*) | Um produtor que deposita tarefas em horários fixos | Ver [o agendador](#o-agendador-da-aplicacao-um-unico-cron-que-decide) |
| **Supervisor** | Um programa que relança um trabalhador parado | [`systemd`](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [`supervisord`](https://supervisord.org/) |

O processamento é dito **assíncrono**: quem deposita não fica esperando o resultado. Uma tarefa atravessa quatro estados:

```text
                 pegar                    confirmar
 aguardando -------------------> em_curso -------------------> concluida
     ^                              |
     |   falha, ou trava recusada   |   falhas demais
     +------------------------------+--------------------------> morta
```

| Estado | Sentido |
|---|---|
| `aguardando` | Depositada, ninguém a pegou ainda (ou ela voltou depois de uma falha) |
| `em_curso` | Um trabalhador a pegou e a processa |
| `concluida` | O trabalhador **confirmou**: ele garante que a tarefa está feita (a linha continua na base, mas ninguém mais a retoma) |
| `morta` | A tarefa falhou vezes demais: é posta de lado para que uma pessoa a examine |

## O mini-sistema de teste: a fila

Os arquivos do teste, todos em Python legível num editor. Eles ficam numa **mesma pasta**; a primeira linha de cada bloco de código abaixo (`# arquivo: ...`) dá o nome do arquivo a criar:

| Arquivo | Papel |
|---|---|
| `fileq.py` | O esquema SQL das tabelas, dois relógios, a abertura do banco |
| `file_attente.py` | A fila: depositar, pegar, confirmar, adiar, abandonar |
| `verrou.py` | A trava com expiração |
| `worker.py` | O esqueleto de um trabalhador (método modelo) |
| `recalculateur.py` | Um trabalhador concreto |
| `planificateur.py` | O agendador da aplicação |
| `demo.py` | Seis cenas que fazem tudo funcionar |
| `deposer_taches.py` | Cria um banco e nele deposita três tarefas, antes de lançar o trabalhador de verdade |
| `lancer_worker.py` | O laço de um trabalhador de verdade, para o supervisor |

No código, os blocos entre `"""` (aspas triplas) colocados no início de uma função ou de uma classe são **docstrings**, textos de documentação: `@brief` resume o que o elemento faz, `@param` descreve um argumento, `@returns` o valor devolvido. As linhas que começam com `#` são comentários, ignorados na execução.

Primeiro bloco: o esquema e os relógios. O **relógio fictício** (`Relogio`) é o truque que torna o teste reprodutível: em vez de esperar de verdade 30 segundos, avançamos um contador.

```python
# arquivo: fileq.py
# sqlite3: módulo do Python que controla um banco SQLite (um banco guardado em um arquivo)
import sqlite3
# time: módulo do Python que fornece a hora do sistema
import time

# ESQUEMA: o texto SQL que cria as quatro tabelas (uma tabela = uma grade de linhas)
ESQUEMA = """
-- (dois hífens: comentário SQL) tarefas: a fila; uma linha por tarefa a fazer
-- CREATE TABLE IF NOT EXISTS: cria a tabela só se ela ainda não existir
CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY,                    -- INTEGER: inteiro; número único
    chave TEXT NOT NULL,                       -- TEXT: texto; NOT NULL: obrigatório
    acao TEXT NOT NULL,                        -- o que fazer: "recalcular"
    estado TEXT NOT NULL DEFAULT 'aguardando', -- DEFAULT: valor inicial
    tentativas INTEGER NOT NULL DEFAULT 0,     -- número de tentativas já começadas
    disponivel_em INTEGER NOT NULL DEFAULT 0   -- não antes deste momento (segundos)
);
-- travas: uma linha por chave atualmente reservada
CREATE TABLE IF NOT EXISTS travas (
    chave TEXT PRIMARY KEY,                    -- a chave reservada; PRIMARY KEY = única
    dono TEXT NOT NULL,                        -- o nome do trabalhador que a reservou
    expira_em INTEGER NOT NULL                 -- momento em que a reserva se apaga
);
-- agenda: as tarefas recorrentes que o agendador deve depositar
CREATE TABLE IF NOT EXISTS agenda (
    acao TEXT PRIMARY KEY,                     -- o nome da tarefa recorrente
    a_cada INTEGER NOT NULL,                   -- o intervalo, em segundos
    proxima INTEGER NOT NULL                   -- o próximo vencimento
);
-- resultados: o que os trabalhadores produzem, uma linha por tarefa processada
CREATE TABLE IF NOT EXISTS resultados (
    tarefa INTEGER PRIMARY KEY,                -- o número da tarefa
    texto TEXT NOT NULL                        -- o resultado
);
"""


class Relogio:
    """
    @brief Relógio fictício: avançamos o tempo à mão, sem esperar.
    """

    def __init__(self):
        # __init__ é o construtor: prepara o objeto novo; t = tempo atual (s)
        self.t = 0

    def agora(self):
        # devolve o tempo atual
        return self.t

    def avancar(self, segundos):
        # faz o tempo passar sem esperar de verdade
        self.t += segundos


class RelogioReal:
    """
    @brief Relógio do sistema, em segundos inteiros.
    """

    def agora(self):
        # time.time() dá os segundos decorridos desde 1970; int() os arredonda
        return int(time.time())


def abrir(caminho):
    """
    @brief Abre o banco SQLite e cria as tabelas que faltam.

    @param caminho: texto, caminho do arquivo do banco

    @returns: uma conexão com confirmação automática
    """
    # isolation_level=None: cada requisição é confirmada sozinha, na hora
    # timeout=5: se o banco estiver ocupado por outro, esperamos 5 s antes de falhar
    base = sqlite3.connect(caminho, isolation_level=None, timeout=5)
    # row_factory: permite ler uma coluna pelo nome (linha["chave"])
    base.row_factory = sqlite3.Row
    # executa o texto SQL de criação das tabelas
    base.executescript(ESQUEMA)
    return base
```

A fila em si. Uma **classe** (`class Fila`) agrupa funções (chamadas **métodos**) e dados; `self` designa o objeto atual (ver [a programação orientada a objetos em Python](/?c=langages&s=python&p=poo)). Os valores entre parênteses, como `(chave, acao)`, formam uma **tupla**, uma lista fixa (ver [listas e tuplas](/?c=langages&s=python&p=listes-et-tuples)).

```python
# arquivo: file_attente.py
class Fila:
    """
    @brief A fila: depositar, pegar, confirmar, adiar, abandonar.
    """

    # PRAZO_VISIBILIDADE: uma tarefa pega reaparece se ninguém a confirmar em 30 s
    PRAZO_VISIBILIDADE = 30

    def __init__(self, base, relogio):
        # base: a conexão SQLite; relogio: a fonte do tempo
        self.base = base
        self.relogio = relogio

    def depositar(self, chave, acao):
        # INSERT adiciona uma linha; cada « ? » recebe, na ordem, um valor da tupla
        self.base.execute(
            "INSERT INTO tarefas (chave, acao) VALUES (?, ?)", (chave, acao)
        )

    def pegar(self):
        """
        @brief Reserva a tarefa devida mais antiga, em uma única consulta.

        @returns: uma linha da tabela tarefas, ou None se nada estiver devido
        """
        agora = self.relogio.agora()
        cursor = self.base.execute(
            # UPDATE altera a linha escolhida: ela passa a em_curso, mais uma tentativa,
            # e sua data de reaparição é adiada em 30 s (* = todas as colunas)
            "UPDATE tarefas SET estado = 'em_curso', tentativas = tentativas + 1,"
            " disponivel_em = ? WHERE id = (SELECT id FROM tarefas"
            # candidatas: aguardando, ou em curso mas deixadas sem confirmação
            " WHERE estado IN ('aguardando', 'em_curso') AND disponivel_em <= ?"
            # ORDER BY id LIMIT 1: a mais antiga; RETURNING devolve a linha alterada
            " ORDER BY id LIMIT 1) RETURNING *",
            (agora + self.PRAZO_VISIBILIDADE, agora),
        )
        # fetchall() lê as linhas devolvidas (zero ou uma aqui)
        linhas = cursor.fetchall()
        return linhas[0] if linhas else None

    def confirmar(self, id_tarefa):
        # tarefa bem-sucedida: estado concluida, sem prazo, nenhuma tentativa devolvida
        self._mudar(id_tarefa, "concluida", 0, 0)

    def adiar(self, id_tarefa, prazo, devolver_tentativa):
        # volta para a fila, invisível durante « prazo » segundos
        self._mudar(id_tarefa, "aguardando", prazo, devolver_tentativa)

    def abandonar(self, id_tarefa):
        # tarefa envenenada: estado morta, nunca mais retomada
        self._mudar(id_tarefa, "morta", 0, 0)

    def _mudar(self, id_tarefa, estado, prazo, devolver_tentativa):
        # o « _ » antes do nome indica um método interno da classe
        self.base.execute(
            "UPDATE tarefas SET estado = ?, disponivel_em = ?,"
            " tentativas = tentativas - ? WHERE id = ?",
            (estado, self.relogio.agora() + prazo, devolver_tentativa, id_tarefa),
        )
```

Tudo se decide em `pegar()`. Se o trabalhador A lesse a tarefa mais antiga (`SELECT`) e depois a marcasse « em curso » (`UPDATE`) em duas consultas separadas, o trabalhador B poderia lê-la entre as duas e pegá-la também. Aqui, **uma única consulta** escolhe e marca: uma operação é dita **atômica** quando se executa num bloco só, sem que nenhuma outra possa se intercalar. O SQLite serializa as gravações, então dois `pegar()` simultâneos se sucedem, sem se misturar.

| Etapa de `pegar()` | O que acontece | Por quê |
|---|---|---|
| `WHERE estado IN ('aguardando', 'em_curso') AND disponivel_em <= ?` | Candidatas: as tarefas devidas, mais as « em curso » cujo prazo passou | Uma tarefa abandonada por um trabalhador travado **reaparece** |
| `ORDER BY id LIMIT 1` | Guarda-se a mais antiga | Primeiro a chegar, primeiro a ser atendido |
| `SET estado = 'em_curso', tentativas = tentativas + 1, disponivel_em = ?` | Ela fica reservada por 30 s | Os outros trabalhadores não a veem durante este **prazo de visibilidade** |
| `confirmar()` | Estado `concluida` | Sem confirmação, a tarefa volta: nunca há perda silenciosa |

O acesso ao banco por vários processos ao mesmo tempo funciona aqui porque o SQLite trava o arquivo durante uma gravação; `timeout=5` diz « espere até 5 segundos se o arquivo estiver ocupado ». As palavras `RETURNING` e `ON CONFLICT` pedem uma versão recente do SQLite (`python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` mostra a sua; ver [a cláusula RETURNING](https://www.sqlite.org/lang_returning.html) e [o upsert](https://www.sqlite.org/lang_upsert.html), « inserir, ou alterar se a linha já existir »). Em uma implantação de verdade, usa-se em geral um serviço dedicado ou um banco servidor; o princípio continua o mesmo.

## O padrão « método modelo »: um esqueleto fixo, um vazio a preencher

Um **padrão de projeto** (*design pattern*) é uma solução testada para um problema de estrutura que aparece com frequência. O **método modelo** (*template method*) se aplica aqui: todos os trabalhadores seguem a **mesma sequência de etapas** (pegar, travar, processar, confirmar ou tentar de novo, liberar), e só o « processar » muda. Em vez de copiar o laço em cada trabalhador (e esquecer a trava em um deles), uma **classe base** fixa o esqueleto, e cada **classe filha** fornece apenas a etapa variável (ver [a herança em Python](/?c=langages&s=python&p=poo#a-heranca)).

```text
Trabalhador.um_turno()      <- esqueleto, escrito UMA vez
  1. pegar uma tarefa
  2. pegar a trava sobre sua chave
  3. self.processar(tarefa)     <- o vazio: definido pela classe filha
  4. confirmar, ou tentar de novo / abandonar
  5. liberar a trava
```

O esqueleto usa o bloco `try` / `except` / `else` / `finally` (ver [o tratamento de erros em Python](/?c=langages&s=python&p=gestion-des-erreurs)): `try` tenta o trabalho, `except` é executado se ele falhar, `else` se ele tiver sucesso, `finally` em todos os casos. Ele usa também `raise`, que dispara um erro manualmente.

```python
# arquivo: worker.py
class Trabalhador:
    """
    @brief Esqueleto de um trabalhador. As classes filhas fornecem processar().
    """

    # MAX_TENTATIVAS: após 3 falhas, a tarefa é abandonada
    MAX_TENTATIVAS = 3
    # DURACAO_TRAVA: a trava se apaga sozinha após 20 s
    DURACAO_TRAVA = 20

    def __init__(self, nome, fila, trava, relogio):
        # nome: identidade do trabalhador; fila, trava, relogio: suas três ferramentas
        self.nome = nome
        self.fila = fila
        self.trava = trava
        self.relogio = relogio

    def processar(self, tarefa):
        # raise dispara um erro; NotImplementedError = « ainda não escrito »:
        # a classe base não sabe trabalhar, a classe filha deve redefinir processar()
        raise NotImplementedError("a classe filha deve definir processar()")

    def dizer(self, texto):
        # f"..." : os {...} são trocados pelo valor; :>3 alinha à direita em 3
        print(f"[t={self.relogio.agora():>3}] {self.nome}: {texto}")

    def um_turno(self):
        """
        @brief Um turno: pegar, travar, processar, confirmar ou tentar de novo.

        @returns: False se a fila estava vazia, True caso contrário
        """
        # 1. leitura da fila
        tarefa = self.fila.pegar()
        if tarefa is None:
            return False
        id_tarefa, chave = tarefa["id"], tarefa["chave"]
        # 2. trava sobre a chave; recusada: adiamos 5 s e devolvemos a tentativa
        if not self.trava.pegar(chave, self.nome, self.DURACAO_TRAVA):
            self.dizer(f"tarefa {id_tarefa}, {chave} está travada, adiamos")
            self.fila.adiar(id_tarefa, prazo=5, devolver_tentativa=1)
            return True
        try:
            # 3. o trabalho: a única parte que muda de uma classe filha para outra
            self.processar(tarefa)
        except Exception as erro:
            # captura qualquer erro e o nomeia « erro »
            # 4a. falha: nova tentativa mais tarde, ou abandono
            self._falha(tarefa, erro)
        else:
            # 4b. sucesso: confirmamos, a tarefa não voltará
            self.fila.confirmar(id_tarefa)
            self.dizer(f"tarefa {id_tarefa} ({tarefa['acao']}) concluída")
        finally:
            # 5. em todos os casos, devolvemos a trava
            self.trava.liberar(chave, self.nome)
        return True

    def _falha(self, tarefa, erro):
        # tentativas: número de tentativas já feitas, esta incluída
        id_tarefa, tentativas = tarefa["id"], tarefa["tentativas"]
        if tentativas >= self.MAX_TENTATIVAS:
            # falhas demais: a tarefa passa para o estado « morta »
            self.fila.abandonar(id_tarefa)
            self.dizer(f"tarefa {id_tarefa} abandonada após {tentativas} tentativas: {erro}")
            return
        # espera dobrada a cada falha (2 ** n = 2 elevado a n): 10 s, 20 s, 40 s...
        # com MAX_TENTATIVAS = 3, a 3ª espera (40 s) não existe: a falha n.º 3 abandona
        espera = 10 * 2 ** (tentativas - 1)
        self.fila.adiar(id_tarefa, prazo=espera, devolver_tentativa=0)
        self.dizer(f"tarefa {id_tarefa} falha (tentativa {tentativas}), nova em {espera} s")
```

A classe filha só precisa escrever o trabalho que é próprio dela:

```python
# arquivo: recalculateur.py
# importa a classe Trabalhador do arquivo worker.py
from worker import Trabalhador


class Recalculador(Trabalhador):
    """
    @brief Trabalhador concreto: escreve apenas processar().
    """

    def __init__(self, nome, fila, trava, relogio, durante=None):
        # super() chama o construtor de Trabalhador; durante simula um trabalho longo
        super().__init__(nome, fila, trava, relogio)
        self.durante = durante

    def processar(self, tarefa):
        # uma ação « corrompida » simula um dado que sempre faz falhar
        if tarefa["acao"] == "corrompida":
            raise ValueError("dados ilegíveis")
        self.dizer(f"processa {tarefa['acao']} em {tarefa['chave']}")
        # momento em que outro trabalhador pode passar (usado na demonstração)
        if self.durante:
            self.durante()
        # INSERT OR REPLACE: refazer a tarefa sobrescreve a mesma linha (idempotência)
        self.fila.base.execute(
            "INSERT OR REPLACE INTO resultados (tarefa, texto) VALUES (?, ?)",
            (tarefa["id"], f"{tarefa['acao']} feito em {tarefa['chave']}"),
        )
```

O que importa em `um_turno()`: o `finally` **libera sempre a trava**, quer o processamento dê certo quer falhe.

| Fixado pela classe base | Fornecido pela classe filha |
|---|---|
| Leitura da fila | O trabalho (`processar`) |
| Colocação e liberação da trava | Nada mais |
| Confirmação, número de tentativas, espera entre tentativas, abandono | |
| Registro dos eventos | |

O princípio tem um nome geral: a **inversão de controle**. Não é mais o seu código que dirige a sequência de etapas: é o esqueleto que chama o seu código no momento certo (ver [a inversão de controle e os pontos de extensão](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)). Quando o framework encontra sozinho as classes filhas disponíveis, temos uma [arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins).

## A trava na aplicação sobre uma entidade

Uma **entidade** é um dado que tem identidade própria e que se pode designar: aqui uma **ficha** (uma linha de banco de dados com seu número). Duas tarefas diferentes podem visar a mesma ficha (« recalcular a ficha 7 » e « enviar um e-mail sobre a ficha 7 »); se dois trabalhadores as processam ao mesmo tempo, um pode sobrescrever o trabalho do outro. O script a seguir reproduz a cena: dois trabalhadores leem um contador de visualizações, e cada um soma 1.

```python
# arquivo: compteur.py
# os.path.join monta um caminho; sqlite3 controla o SQLite; tempfile cria uma pasta
import os
import sqlite3
import tempfile

# duas conexões com o mesmo banco: dois trabalhadores que trabalham ao mesmo tempo
# (isolation_level=None: cada requisição é confirmada na hora)
caminho = os.path.join(tempfile.mkdtemp(), "contador.db")
a = sqlite3.connect(caminho, isolation_level=None)
b = sqlite3.connect(caminho, isolation_level=None)
# uma ficha número 7 cujo contador de visualizações vale 0
a.execute("CREATE TABLE ficha (id INTEGER PRIMARY KEY, visualizacoes INTEGER)")
a.execute("INSERT INTO ficha VALUES (7, 0)")

# A lê o contador (0), depois B também lê (0) antes que A tenha gravado
# fetchone() lê uma linha do resultado; [0] pega a primeira coluna
lido_por_a = a.execute("SELECT visualizacoes FROM ficha WHERE id = 7").fetchone()[0]
lido_por_b = b.execute("SELECT visualizacoes FROM ficha WHERE id = 7").fetchone()[0]
# cada um grava « o que leu + 1 »: B sobrescreve o trabalho de A
a.execute("UPDATE ficha SET visualizacoes = ? WHERE id = 7", (lido_por_a + 1,))
b.execute("UPDATE ficha SET visualizacoes = ? WHERE id = 7", (lido_por_b + 1,))
# duas somas aconteceram, o contador deveria valer 2
final = a.execute("SELECT visualizacoes FROM ficha WHERE id = 7").fetchone()[0]
print(f"valor final: {final} (esperado: 2)")

# SELECT ... FOR UPDATE (trava de linha de outros bancos) não existe no SQLite
try:
    a.execute("SELECT visualizacoes FROM ficha WHERE id = 7 FOR UPDATE")
except sqlite3.OperationalError as erro:
    print(f"SQLite recusa: {erro}")
```

Saída obtida:

```text
valor final: 1 (esperado: 2)
SQLite recusa: near "FOR": syntax error
```

Duas somas, uma só contagem: é a **atualização perdida** (*lost update*). A segunda linha mostra que a trava de linha `SELECT ... FOR UPDATE`, que outros bancos oferecem, não existe no SQLite. Construímos então uma **trava na aplicação**: uma reserva gerida pelo nosso próprio código, aqui numa tabela `travas`.

Uma **trava** (ou *mutex*, de *mutual exclusion*, « exclusão mútua ») garante que um único ator por vez detenha um recurso; a mesma palavra existe entre [threads](/?c=langages&s=c&p=threads) dentro de um programa. Aqui o recurso é uma **chave** (`"ficha:7"`) e os atores são trabalhadores, portanto processos separados. Nossa trava tem uma **expiração**: a reserva se apaga sozinha após `duracao` segundos.

```python
# arquivo: verrou.py
class Trava:
    """
    @brief Trava no banco, com uma data de expiração.
    """

    def __init__(self, base, relogio):
        # base: a conexão SQLite; relogio: a fonte do tempo
        self.base = base
        self.relogio = relogio

    def pegar(self, chave, dono, duracao):
        """
        @brief Põe a trava se a chave estiver livre ou se a trava antiga expirou.

        @param chave: texto, o que se trava ("ficha:7")
        @param dono: texto, nome do trabalhador
        @param duracao: inteiro, segundos até a expiração

        @returns: True se a trava é nossa, False se ela está presa com outro
        """
        agora = self.relogio.agora()
        cursor = self.base.execute(
            # tentamos inserir a linha: dá certo só se a chave não existir
            "INSERT INTO travas (chave, dono, expira_em)"
            # chave já presente (ON CONFLICT): pegamos a linha (excluded = a linha
            # que tentávamos inserir), mas...
            " VALUES (?, ?, ?) ON CONFLICT(chave) DO UPDATE SET"
            " dono = excluded.dono,"
            # ... só se a trava antiga tiver expirado; senão nada muda
            " expira_em = excluded.expira_em WHERE travas.expira_em <= ?",
            (chave, dono, agora + duracao, agora),
        )
        # rowcount: número de linhas tocadas; 1 = trava obtida, 0 = recusada
        return cursor.rowcount == 1

    def liberar(self, chave, dono):
        # só apagamos a NOSSA trava: se outro a tiver pego, não mexemos nela
        self.base.execute(
            "DELETE FROM travas WHERE chave = ? AND dono = ?",
            (chave, dono),
        )
```

| Mecanismo de travamento | Alcance | Limite |
|---|---|---|
| `flock` num arquivo (ver [cron e `flock`](/?c=langages&s=bash&p=automatisation-cron#evitar-execucoes-concorrentes-com-flock)) | Uma única máquina | Inútil assim que os trabalhadores estiverem em várias máquinas |
| Trava de linha do banco (`SELECT ... FOR UPDATE` nos bancos que a oferecem) | A linha, durante uma transação (um grupo de operações confirmado de uma vez) | Presa a uma transação: mal adaptada a um trabalho longo |
| **Trava na aplicação numa tabela, com expiração** (nosso caso) | Todas as máquinas que enxergam o banco | É preciso gerenciar a expiração por conta própria |
| Serviço externo de travas | Todas as máquinas | Uma peça a mais para manter funcionando |

### O risco de uma trava nunca liberada

Se o trabalhador parar enquanto segura a trava, ninguém a libera. Sem expiração, a ficha fica bloqueada **para sempre**. É essa a razão de ser de `expira_em`. Mas a duração se escolhe com cuidado:

| Duração da trava | Perigo |
|---|---|
| **Curta demais** (menos que o trabalho) | A trava expira enquanto o trabalhador ainda trabalha: um segundo trabalhador entra, os dois alteram a ficha |
| **Longa demais** | Depois de uma pane, a ficha fica intocável por muito tempo |
| **Justa** (um pouco mais que o pior caso do trabalho) | O compromisso; completamos com uma tarefa **idempotente** (ver mais abaixo) para que até uma sobreposição excepcional não cause dano |

Para um trabalho cuja duração varia muito, pode-se **renovar** a trava (adiar `expira_em`) durante o trabalho; pode-se também dar a cada captura um número crescente (um **token de controle**, *fencing token*) que o banco verifica na gravação para recusar um trabalhador que ficou lento demais. Nosso teste não faz nem uma coisa nem outra.

## O agendador da aplicação: um único cron que decide

[`cron`](/?c=langages&s=bash&p=automatisation-cron) é o programa do sistema que executa um comando em horários fixos. Escrever uma linha no **crontab** (o arquivo onde se listam os comandos de `cron`) por tarefa recorrente da aplicação tem defeitos: o sistema ignora os dados da aplicação, cada nova tarefa exige acesso ao servidor, e nada impede que dois lançamentos se sobreponham. O **agendador da aplicação** inverte a abordagem: o sistema executa apenas **um** script, a cada minuto, e é a aplicação que decide, a partir de uma tabela `agenda`, quais tarefas estão **devidas** (chegaram ao vencimento).

```text
 crontab:  * * * * *  /usr/bin/python3 /srv/app/tick.py      (UMA linha)
                  |
                  v
          tick(): lê a tabela agenda
                  |   "purga: a cada 60 s, próximo vencimento = t"
                  v
          para cada linha devida: avançar o vencimento, depositar uma tarefa
                  |
                  v
               FILA  ->  trabalhadores
```

| Abordagem | Quem conhece o calendário | Acrescentar uma tarefa recorrente |
|---|---|---|
| Uma linha `crontab` por tarefa | O sistema | Alterar o crontab em cada servidor |
| **Agendador da aplicação** | A aplicação (tabela `agenda`) | Inserir uma linha no banco |

No código a seguir, o laço `for` (ver [os laços em Python](/?c=langages&s=python&p=boucles)) repete seu bloco uma vez para cada elemento de uma lista.

```python
# arquivo: planificateur.py
class Agendador:
    """
    @brief Lançado pelo cron: deposita na fila as tarefas que chegaram ao vencimento.
    """

    def __init__(self, base, fila, relogio):
        # base: a conexão SQLite; fila: onde depositar; relogio: a fonte do tempo
        self.base = base
        self.fila = fila
        self.relogio = relogio

    def tick(self):
        """
        @brief Uma passagem: localiza as tarefas devidas e as põe na fila uma vez.
        """
        agora = self.relogio.agora()
        # as tarefas recorrentes cujo vencimento chegou
        devidas = self.base.execute(
            "SELECT acao, a_cada FROM agenda WHERE proxima <= ?",
            (agora,),
        ).fetchall()
        # for: uma volta de laço por tarefa devida, « linha » sendo a tarefa da volta
        for linha in devidas:
            # avançamos o vencimento ANTES: se dois agendadores passarem, só um ganha
            cursor = self.base.execute(
                "UPDATE agenda SET proxima = ? WHERE acao = ?"
                " AND proxima <= ?",
                (agora + linha["a_cada"], linha["acao"], agora),
            )
            # uma linha alterada = fomos nós que avançamos o vencimento: depositamos
            if cursor.rowcount == 1:
                self.fila.depositar(linha["acao"], linha["acao"])
                print(f"[t={agora:>3}] agendador: deposita {linha['acao']}")
```

Três detalhes importam. Primeiro, o agendador **apenas deposita**; ele não faz o trabalho, então termina num instante e não corre o risco de invadir a passagem seguinte. Depois, o vencimento é avançado **antes** de depositar, por um `UPDATE ... WHERE proxima <= ?` cujo `rowcount` é verificado: se duas passagens se sobrepõem, só uma altera a linha e deposita; a outra vê `0` e não faz nada. Por fim, `proxima = agora + intervalo` significa que, após uma pane da máquina, a tarefa perdida é depositada **uma vez**, e não dez vezes.

## O teste completo, cena por cena

`demo.py` encadeia seis cenas, cada uma sobre um banco novo. Eis o arquivo (os `import` são explicados em [os módulos Python](/?c=langages&s=python&p=modules-et-environnements)):

```python
# arquivo: demo.py
# os.path.join monta um caminho; tempfile cria pastas temporárias
import os
import tempfile

# « from X import Y »: importa Y do arquivo X.py do teste
from file_attente import Fila
from fileq import Relogio, abrir
from planificateur import Agendador
from recalculateur import Recalculador
from verrou import Trava


def mundo():
    """
    @brief Cria um banco novo, um relógio, uma fila e uma trava.

    @returns: a quádrupla (base, relogio, fila, trava)
    """
    # mkdtemp() cria uma pasta temporária nova; o banco mora nela durante o teste
    base = abrir(os.path.join(tempfile.mkdtemp(), "teste.db"))
    relogio = Relogio()
    return base, relogio, Fila(base, relogio), Trava(base, relogio)


def mostrar_tarefas(base):
    # uma linha por tarefa (* = todas as colunas); :<8 alinha à esquerda em 8
    for t in base.execute("SELECT * FROM tarefas ORDER BY id"):
        print(f"  tarefa {t['id']} {t['chave']:<8} {t['acao']:<13} {t['estado']:<11}"
              f" tentativas={t['tentativas']}")


print("--- Cena 1: o agendador ---")
base, relogio, fila, trava = mundo()
# uma tarefa recorrente: « purga », a cada 60 s, devida desde o instante 0
base.execute("INSERT INTO agenda VALUES ('purga', 60, 0)")
agendador = Agendador(base, fila, relogio)
# três passagens do cron, espaçadas de 30 s: nos instantes 0, 30 e 60
# range(3) fornece 0, 1, 2: três voltas; « _ »: o número da volta, que não nos interessa
for _ in range(3):
    agendador.tick()
    relogio.avancar(30)

print("--- Cena 2: dois trabalhadores, uma mesma ficha ---")
base, relogio, fila, trava = mundo()
# três tarefas: duas na ficha 7, uma na ficha 8
fila.depositar("ficha:7", "recalcular")
fila.depositar("ficha:7", "enviar_email")
fila.depositar("ficha:8", "recalcular")
b = Recalculador("B", fila, trava, relogio)
# lambda: mini-função sem nome; enquanto A trabalha, B dá duas voltas
a = Recalculador("A", fila, trava, relogio, durante=lambda: (b.um_turno(), b.um_turno()))
# A pega a tarefa 1 (ficha 7); B passa nesse meio tempo
a.um_turno()
# 6 s depois, a tarefa adiada por B está disponível de novo
relogio.avancar(6)
b.um_turno()
mostrar_tarefas(base)

print("--- Cena 3: um trabalhador para segurando a trava ---")
base, relogio, fila, trava = mundo()
fila.depositar("ficha:9", "recalcular")
# o trabalhador C reserva ficha:9 por 20 s, depois para sem liberar nada
trava.pegar("ficha:9", "C", 20)
b = Recalculador("B", fila, trava, relogio)
# B bate na trava de C e adia a tarefa
b.um_turno()
# 21 s depois, a trava de C expirou: B pode trabalhar
relogio.avancar(21)
b.um_turno()

print("--- Cena 4: um trabalhador para antes de confirmar ---")
base, relogio, fila, trava = mundo()
fila.depositar("ficha:5", "recalcular")
# C pega a tarefa, depois para sem confirmá-la nem adiá-la
tarefa = fila.pegar()
print(f"[t=  0] C: pega a tarefa {tarefa['id']} e para de repente")
# passados os 30 s do prazo de visibilidade, a tarefa reaparece para B
relogio.avancar(31)
Recalculador("B", fila, trava, relogio).um_turno()
mostrar_tarefas(base)

print("--- Cena 5: uma tarefa envenenada ---")
base, relogio, fila, trava = mundo()
fila.depositar("ficha:3", "corrompida")
b = Recalculador("B", fila, trava, relogio)
# três voltas, nos instantes 0, 10 e 30: as esperas de 10 s e 20 s se escoam
# for passo in (0, 10, 20): uma volta por valor da tupla, « passo » valendo 0, 10, 20
for passo in (0, 10, 20):
    relogio.avancar(passo)
    b.um_turno()
mostrar_tarefas(base)

print("--- Cena 6: refazer uma tarefa ---")
base, relogio, fila, trava = mundo()
fila.depositar("ficha:2", "recalcular")
b = Recalculador("B", fila, trava, relogio)
b.um_turno()
# lemos de novo a tarefa 1 e a mandamos processar uma segunda vez, à mão
linha = base.execute("SELECT * FROM tarefas WHERE id = 1").fetchone()
b.processar(linha)
# COUNT(*) conta as linhas da tabela resultados
n = base.execute("SELECT COUNT(*) FROM resultados").fetchone()[0]
print(f"linhas em resultados após dois processamentos: {n}")
```

Executado com `python3 demo.py`, ele escreve (saída copiada tal qual):

```text
--- Cena 1: o agendador ---
[t=  0] agendador: deposita purga
[t= 60] agendador: deposita purga
--- Cena 2: dois trabalhadores, uma mesma ficha ---
[t=  0] A: processa recalcular em ficha:7
[t=  0] B: tarefa 2, ficha:7 está travada, adiamos
[t=  0] B: processa recalcular em ficha:8
[t=  0] B: tarefa 3 (recalcular) concluída
[t=  0] A: tarefa 1 (recalcular) concluída
[t=  6] B: processa enviar_email em ficha:7
[t=  6] B: tarefa 2 (enviar_email) concluída
  tarefa 1 ficha:7  recalcular    concluida   tentativas=1
  tarefa 2 ficha:7  enviar_email  concluida   tentativas=1
  tarefa 3 ficha:8  recalcular    concluida   tentativas=1
--- Cena 3: um trabalhador para segurando a trava ---
[t=  0] B: tarefa 1, ficha:9 está travada, adiamos
[t= 21] B: processa recalcular em ficha:9
[t= 21] B: tarefa 1 (recalcular) concluída
--- Cena 4: um trabalhador para antes de confirmar ---
[t=  0] C: pega a tarefa 1 e para de repente
[t= 31] B: processa recalcular em ficha:5
[t= 31] B: tarefa 1 (recalcular) concluída
  tarefa 1 ficha:5  recalcular    concluida   tentativas=2
--- Cena 5: uma tarefa envenenada ---
[t=  0] B: tarefa 1 falha (tentativa 1), nova em 10 s
[t= 10] B: tarefa 1 falha (tentativa 2), nova em 20 s
[t= 30] B: tarefa 1 abandonada após 3 tentativas: dados ilegíveis
  tarefa 1 ficha:3  corrompida    morta       tentativas=3
--- Cena 6: refazer uma tarefa ---
[t=  0] B: processa recalcular em ficha:2
[t=  0] B: tarefa 1 (recalcular) concluída
[t=  0] B: processa recalcular em ficha:2
linhas em resultados após dois processamentos: 1
```

| Cena | O que se observa | O que isso mostra |
|---|---|---|
| **1** | A purga é depositada em `t=0` e `t=60`, não em `t=30` | O agendador só deposita o que está devido |
| **2** | Enquanto A trabalha na ficha 7, B recebe a tarefa 2 (mesma ficha), bate na trava e a adia; B processa então a ficha 8, que não está travada; em `t=6`, B conclui a tarefa 2 | Duas fichas diferentes se processam em paralelo; uma mesma ficha se processa em sequência |
| **3** | C para segurando `ficha:9`; B é recusado em `t=0`, depois consegue em `t=21` | A trava expira sozinha |
| **4** | C pega a tarefa e desaparece sem confirmar; em `t=31`, B a retoma (`tentativas=2`) | O prazo de visibilidade devolve a tarefa à fila |
| **5** | A tarefa `corrompida` falha em `t=0` (espera de 10 s), depois em `t=10` (espera de 20 s), e é abandonada em `t=30`: estado `morta` | Novas tentativas espaçadas, depois abandono |
| **6** | A tarefa processada duas vezes deixa só uma linha em `resultados` | A gravação é idempotente |

O cenário da cena 2 é **simulado**: o parâmetro `durante` chama B no meio do trabalho de A, o que torna a ordem das linhas idêntica a cada execução. Com trabalhadores **reais** simultâneos, a ordem das linhas variaria de uma execução para outra; a simulação a fixa para que se possa lê-la.

## Novas tentativas, tarefa envenenada e idempotência

Um processamento falha por razões passageiras (rede caída, serviço de terceiros ocupado) ou duradouras (dado ilegível). A fila precisa distinguir as duas sem intervenção.

| Estratégia de nova tentativa | Princípio | Efeito / limite |
|---|---|---|
| Tentar de novo na hora | Volta imediata para a fila | Martela um serviço já em dificuldade |
| Prazo fixo | Sempre a mesma espera | Todas as falhas de uma pane voltam no mesmo instante |
| **Espera exponencial** (*exponential backoff*) | 10 s, 20 s, 40 s...: a espera dobra a cada falha (com `MAX_TENTATIVAS = 3`, nosso teste para antes dos 40 s) | As tarefas duradouramente defeituosas esperam cada vez mais (é a nossa escolha) |
| Espera exponencial com **variação aleatória** (*jitter*) | A mesma, mais uma pequena parte de sorte | Evita que tarefas que falharam juntas voltem juntas |

Uma **tarefa envenenada** (*poison message*) é uma tarefa que falha **a cada tentativa**, faça-se o que se fizer (dado corrompido, bug). Sem limite, ela rodaria em laço e ocuparia um trabalhador indefinidamente. Daí `MAX_TENTATIVAS`: após a última tentativa, ela passa ao estado `morta` (uma **fila das mortas**, *dead-letter queue*, no vocabulário das filas), e a linha é guardada para que uma pessoa a leia e decida. Uma fila que acumula tarefas mortas sem alerta esconde um problema: é preciso vigiar o número delas.

Terceira noção, a mais importante. A fila garante que uma tarefa seja executada **pelo menos uma vez**: se um trabalhador para depois de fazer o trabalho mas antes de confirmar (cena 4), a tarefa volta e o trabalho é refeito. Para que essa segunda passagem seja inofensiva, o processamento deve ser **idempotente**: refazê-lo dá o mesmo resultado que fazê-lo uma vez (ver [a idempotência na robustez de um processamento em lotes](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)).

| Operação | Idempotente? | Por quê |
|---|---|---|
| `INSERT OR REPLACE` sobre a chave da tarefa (cena 6) | Sim | A segunda gravação substitui a primeira |
| `UPDATE ficha SET situacao = 'validada'` | Sim | O resultado é o mesmo após uma ou duas vezes |
| `UPDATE conta SET saldo = saldo + 10` | **Não** | Cada execução soma 10 |
| Enviar um e-mail | **Não** | Impossível « desenviar »; envia-se, depois registra-se o envio. Uma pane entre as duas etapas deixa uma duplicata possível: para evitá-la, anexa-se um identificador próprio da tarefa que o serviço de envio, se o permitir, usa para ignorar um segundo pedido idêntico |

| Garantia de entrega | Significado | Custo |
|---|---|---|
| **No máximo uma vez** | Uma tarefa é tentada uma única vez, nunca repetida | Uma pane a perde |
| **Pelo menos uma vez** (nosso caso) | Repetida enquanto não for confirmada | Pode executar duas vezes: exige idempotência |

## Manter um trabalhador vivo: o supervisor

Um trabalhador é um processo que pode parar: erro imprevisto, falta de memória, reinicialização da máquina. É preciso um **supervisor**, um programa cujo único ofício é iniciar o trabalhador na inicialização e relançá-lo quando ele parar. Eis o laço de um trabalhador de verdade. Ele reage aos **sinais**: mensagens curtas que o sistema envia a um processo (ver [os sinais Unix](/?c=langages&s=c&p=signaux-unix)).

```python
# arquivo: lancer_worker.py
# signal: módulo do Python que permite reagir aos sinais enviados pelo sistema
import signal
# sys: dá acesso aos argumentos da linha de comando (sys.argv)
import sys
# time: fornece sleep(), uma pausa
import time

# cada import traz uma classe ou uma função de um arquivo do teste
# a fila de espera (file_attente.py)
from file_attente import Fila
# o relógio do sistema e a abertura do banco (fileq.py)
from fileq import RelogioReal, abrir
# o trabalhador concreto (recalculateur.py)
from recalculateur import Recalculador
# a trava com expiração (verrou.py)
from verrou import Trava

# interruptor global (variável visível em todo o arquivo): passa a True
# quando o sistema pede a parada
parada_pedida = False


# função chamada pelo Python ao receber um sinal, com dois argumentos
def pedir_parada(numero, quadro):
    """
    @brief Anota que recebemos SIGTERM ou SIGINT: o laço terminará o turno.

    @param numero: inteiro, número do sinal
    @param quadro: objeto, estado de execução (não usado)
    """
    # global: alteramos a variável do arquivo, não uma cópia local
    global parada_pedida
    parada_pedida = True


# SIGTERM: « pare » enviado por um supervisor; SIGINT: Ctrl+C no teclado
signal.signal(signal.SIGTERM, pedir_parada)
signal.signal(signal.SIGINT, pedir_parada)

# o trabalhador real: relógio verdadeiro; sys.argv é a lista das palavras do comando
# (sys.argv[0]: lancer_worker.py, sys.argv[1]: w.db), daí o caminho do banco
relogio = RelogioReal()
base = abrir(sys.argv[1])
trabalhador = Recalculador("W1", Fila(base, relogio), Trava(base, relogio), relogio)
# o laço continua enquanto nenhuma parada for pedida; o turno em curso sempre vai até o fim
while not parada_pedida:
    # fila vazia: dormimos 1 s em vez de consultar o banco sem parar
    if not trabalhador.um_turno():
        time.sleep(1)
print("parada pedida: tarefa em curso concluída, saída limpa")
```

`SIGTERM` quer dizer « pare com segurança »: o supervisor o envia antes de uma parada ou de um reinício. `SIGINT` é o que o teclado envia quando se digita Ctrl+C. O trabalhador não se interrompe no meio de uma tarefa: ele anota o pedido e sai do laço **depois** do turno em curso.

Para ver este trabalhador em ação, é preciso um banco que contenha tarefas. O script `deposer_taches.py` abaixo cria-o e deposita nele três tarefas, depois termina. Ele fica na mesma pasta que os outros arquivos do teste.

```python
# arquivo: deposer_taches.py
# importa o relógio do sistema e abrir(), que cria o banco, de fileq.py
from fileq import RelogioReal, abrir
# importa a classe Fila (a fila de espera) de file_attente.py
from file_attente import Fila

# abrir() cria o arquivo w.db se ele não existir, com as suas quatro tabelas vazias
base = abrir("w.db")
# a fila lerá a hora no relógio do sistema, como fará o trabalhador de verdade
fila = Fila(base, RelogioReal())
# um laço « for » repete o seu bloco uma vez por valor: aqui, três fichas
for chave in ("ficha:1", "ficha:2", "ficha:3"):
    # depositar() acrescenta uma linha na tabela tarefas, no estado aguardando
    fila.depositar(chave, "recalcular")
# COUNT(*) conta as linhas da tabela tarefas; [0] pega a primeira coluna
n = base.execute("SELECT COUNT(*) FROM tarefas").fetchone()[0]
# mostra o total para verificar que o depósito aconteceu
print(f"{n} tarefas depositadas em w.db")
```

Lançado com `python3 deposer_taches.py`, ele escreve `3 tarefas depositadas em w.db` (relançado, deposita mais três no mesmo banco). Depois, na mesma pasta, inicia-se o trabalhador como [tarefa em segundo plano](/?c=langages&s=bash&p=gestion-des-processus), deixa-se passar alguns segundos e envia-se a ele `SIGTERM`:

```bash
# o « & » final lança o trabalhador em segundo plano: o terminal continua utilizável
python3 lancer_worker.py w.db &
# sleep 3: pausa de 3 segundos, o tempo para o trabalhador tratar as três tarefas
sleep 3
# $! contém o número (PID) do último processo lançado em segundo plano
# kill -TERM envia SIGTERM ao processo desse número (ou kill -TERM <PID>, PID conhecido)
kill -TERM $!
```

No primeiro plano (sem o `&`), o trabalhador fica com o terminal: Ctrl+C o para do mesmo modo, por `SIGINT`. Saída medida, com a hora substituída por `...` (é o número de segundos decorridos desde 1970, que muda a cada lançamento):

```text
[t=...] W1: processa recalcular em ficha:1
[t=...] W1: tarefa 1 (recalcular) concluída
[t=...] W1: processa recalcular em ficha:2
[t=...] W1: tarefa 2 (recalcular) concluída
[t=...] W1: processa recalcular em ficha:3
[t=...] W1: tarefa 3 (recalcular) concluída
parada pedida: tarefa em curso concluída, saída limpa
```

As três tarefas são tratadas na ordem de depósito; depois, a fila estando vazia, o trabalhador dorme em pausas de um segundo até o sinal. A mensagem final aparece quando o laço termina: o programa sai então com o código 0, ou seja, sem erro (ver [os códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)). O comando `timeout -s TERM 3 python3 lancer_worker.py w.db` dá o mesmo resultado: [`timeout`](/?c=langages&s=bash&p=gestion-des-processus#limitar-a-duracao-de-um-comando-timeout-e-ctrl-c) executa um programa e lhe envia aqui `SIGTERM` após 3 segundos. O trabalhador sai bem com 0, mas o próprio `timeout` devolve 124 para indicar que o prazo foi atingido.

Dois supervisores comuns. [systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) é o programa que inicia e vigia tudo o que roda numa máquina Linux moderna (ver também [os limites de recursos com `systemd-run`](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). [supervisord](https://supervisord.org/) é um programa independente, mais simples, que apenas vigia processos; sua ferramenta de linha de comando, `supervisorctl`, serve para iniciar, parar e listar os processos que ele vigia.

```ini
# worker-file.service: arquivo de unidade systemd (em /etc/systemd/system/)
[Unit]
# texto exibido nas listas de serviços
Description=Trabalhador da fila de espera

[Service]
# conta de sistema sob a qual o trabalhador roda (nunca root sem necessidade)
User=app
# pasta atual do processo
WorkingDirectory=/srv/app
# o comando a executar: caminhos absolutos, como no cron
ExecStart=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/teste.db
# relançar o trabalhador se ele parar, qualquer que seja o motivo
Restart=always
# esperar 5 s antes de relançar, para não entrar em laço veloz numa pane
RestartSec=5
# dar 30 s ao trabalhador para terminar a tarefa após SIGTERM, depois matá-lo
TimeoutStopSec=30

[Install]
# iniciar este serviço na inicialização normal da máquina
WantedBy=multi-user.target
```

```ini
; worker_file.conf: seção de um arquivo de configuração do supervisord (muitas vezes
; colocado em /etc/supervisor/conf.d/; ver a documentação do supervisord)
; um « programa » supervisionado; o nome serve aos comandos de supervisorctl
[program:trabalhador_fila]
; o comando a executar
command=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/teste.db
; pasta atual e conta de sistema
directory=/srv/app
user=app
; iniciar com o supervisord e relançar em caso de parada
autostart=true
autorestart=true
; dois trabalhadores em paralelo, chamados trabalhador_fila_00 e trabalhador_fila_01
numprocs=2
process_name=%(program_name)s_%(process_num)02d
; segundos deixados após o sinal de parada antes de matar o processo
stopwaitsecs=30
; os erros vão para o mesmo registro que a saída normal
redirect_stderr=true
stdout_logfile=/var/log/trabalhador_fila.log
```

| Supervisor | Ponto forte | Ponto de atenção |
|---|---|---|
| **systemd** | Já presente na maioria das distribuições Linux; inicialização com o boot, registro integrado | Arquivos de unidade a escrever; próprio do Linux |
| **supervisord** | Simples; vários processos idênticos com uma linha (`numprocs`); funciona sem systemd | A instalar e a vigiar por conta própria |
| Um `cron` que relança o trabalhador a cada minuto, protegido por `flock` | Nenhuma ferramenta a mais | Até 1 minuto sem trabalhador após uma parada |

Com `numprocs=2`, dois trabalhadores leem a mesma fila: é justamente o caso em que a trava sobre a chave se torna indispensável. Um trabalhador que roda por dias pode crescer em memória; alguns projetos o fazem sair de propósito após um número fixo de tarefas, e o supervisor o relança limpo.

## O mesmo esquema no Drupal (exemplo)

O Drupal é um sistema de gerenciamento de conteúdo escrito em PHP. Ele já oferece cada peça deste capítulo, sob outros nomes. **Esta seção é um exemplo.** Os nomes de API abaixo são verificados no código-fonte do Drupal 11.x (o atributo `#[QueueWorker]` existe desde o Drupal 10.3); para outra versão, consulte a documentação (ver o grupo [Queue](https://api.drupal.org/api/drupal/core!core.api.php/group/queue/11.x) da API e a interface [LockBackendInterface](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Lock!LockBackendInterface.php/interface/LockBackendInterface/11.x)).

| Noção do capítulo | Equivalente Drupal |
|---|---|
| Produtor + fila | `\Drupal::queue('nome')->createItem($dados)` deposita; `claimItem()`, `deleteItem()`, `releaseItem()` pegam, confirmam, devolvem |
| Trabalhador, classe base, vazio a preencher | Um **plugin** `QueueWorker` que estende `QueueWorkerBase` e escreve `processItem($dados)` |
| Agendador da aplicação | `hook_cron()`, chamado a cada passagem do cron do Drupal (um único `crontab` lança esse cron) |
| Laço do trabalhador | O cron do Drupal esvazia as filas cujo plugin declara uma chave `cron` (duração máxima por passagem); ou `drush queue:run nome` ([`drush`](https://www.drush.org/) é a ferramenta de linha de comando do Drupal) executado sob systemd/supervisord |
| Trava na aplicação com expiração | `\Drupal::lock()`, do tipo `LockBackendInterface`: `acquire($nome, $prazo)` devolve `true` ou `false`, `release($nome)` libera |
| Nova tentativa | Lançar `RequeueException` solta o item de imediato: o cron pode pegá-lo de novo na mesma passagem (para esperar antes de uma nova tentativa, lança-se `DelayedRequeueException`); lançar `SuspendQueueException` interrompe o processamento da fila, mas só para a passagem de cron em curso, e o item é solto |

Notação PHP dos dois blocos (ver [a sintaxe](/?c=langages&s=php&p=syntaxe), [a programação orientada a objetos](/?c=langages&s=php&p=poo) e [as exceções](/?c=langages&s=php&p=exceptions)):

| Notação | Sentido |
|---|---|
| `$nome` | Uma variável: o `$` a marca |
| `A::b()` | Chamada de uma função ligada à classe `A`, sem criar objeto |
| `$objeto->b()` | Chamada de um método do objeto `$objeto`; `\Drupal::queue('x')->createItem(...)` encadeia as duas |
| `['a' => 7]` | Um array em que a chave `'a'` vale 7 |
| `foreach ([...] as $id)` | Uma volta de laço por elemento do array |
| `throw new E()` | Dispara o erro `E`, como `raise` em Python |
| `!` | Negação: `!$x` significa « não $x » |

O trabalhador (um plugin cujo identificador é declarado por um atributo PHP, no modelo descrito em [a arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)):

```php
<?php

// namespace: o « endereço » da classe, que corresponde à sua pasta no módulo
namespace Drupal\exemplo\Plugin\QueueWorker;

// use: anuncia as classes do Drupal que este arquivo usa
use Drupal\Core\Queue\Attribute\QueueWorker;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Queue\RequeueException;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// o atributo #[...] rotula a classe como trabalhador: identificador, título exibido,
// e duração máxima (60 s) que o cron pode dedicar a esta fila por passagem
#[QueueWorker(
  id: 'exemplo_recalculo',
  title: new TranslatableMarkup('Recálculo das fichas'),
  cron: ['time' => 60],
)]
// extends: herda o esqueleto de QueueWorkerBase, a « classe base » do capítulo
class RecalculoFicha extends QueueWorkerBase {

  /**
   * @brief Processa um item da fila « exemplo_recalculo ».
   *
   * @param mixed $dados: o que foi depositado, aqui ['ficha_id' => 7]
   */
  // public: chamável de fora; mixed: o tipo de $dados não é restrito
  public function processItem($dados) {
    // a chave da trava, montada a partir da ficha visada
    $chave = 'exemplo_ficha:' . $dados['ficha_id'];
    // o serviço de travas do Drupal
    $trava = \Drupal::lock();
    // acquire() devolve false se a chave estiver presa; 30.0: expiração em segundos
    if (!$trava->acquire($chave, 30.0)) {
      // soltamos o item: ele volta a ficar disponível imediatamente
      throw new RequeueException();
    }
    try {
      // ... o trabalho real na ficha, a escrever de forma idempotente ...
    }
    finally {
      // aconteça o que acontecer, liberamos a trava
      $trava->release($chave);
    }
  }

}
```

O produtor, sob a forma de um `hook_cron` : uma função que o cron do Drupal chama por convenção de nome, segundo o mecanismo dos [hooks](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) :

```php
<?php

/**
 * @brief Chamado a cada passagem do cron do Drupal: deposita os trabalhos devidos.
 */
function exemplo_cron() {
  // \Drupal::queue(...) devolve o objeto fila chamado « exemplo_recalculo »
  $fila = \Drupal::queue('exemplo_recalculo');
  // três fichas a recalcular (lista inventada para o exemplo)
  foreach ([7, 8, 9] as $id) {
    // createItem() deposita os dados; o trabalhador os receberá em $dados
    $fila->createItem(['ficha_id' => $id]);
  }
}
```

Encontramos as três ideias do capítulo: um esqueleto fornecido (`QueueWorkerBase` faz o papel da nossa classe `Trabalhador`, o método chamado pelo esqueleto sendo `processItem`), uma trava com expiração (o `30.0` de `acquire` é uma duração em segundos) e uma nova tentativa por exceção. A diferença está na infraestrutura: o Drupal decide, por seus plugins e seu cron, **quem** chama o trabalhador, enquanto nosso teste decidia isso em `lancer_worker.py`.

## Perguntas frequentes

| Pergunta | Resposta |
|---|---|
| Por que não um simples `cron` que lança o trabalho? | `cron` lança um programa em horários fixos, mas não retoma uma falha, não reparte um pico entre vários trabalhadores e não sabe reagir a uma requisição do visitante |
| Quando passar a um verdadeiro gerenciador de filas? | Quando os trabalhadores estiverem em várias máquinas, quando a vazão ultrapassar o que um único banco aguenta em gravação, ou quando forem necessárias funções prontas (prioridades, prazos, vigilância): ver a tabela de ferramentas no início do capítulo |
| Como vigiar a fila? | Contar as tarefas `aguardando` e `morta`, e medir a idade da tarefa mais antiga em espera: se ela cresce, os trabalhadores estão parados ou lentos |
| O que fazer com uma tarefa morta? | Lê-la, corrigir a causa (dado ou bug) e depois devolvê-la à fila: `UPDATE tarefas SET estado = 'aguardando', tentativas = 0 WHERE id = 1`; ou apagá-la se não tiver mais utilidade |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Ler uma tarefa e marcá-la em duas consultas | Dois trabalhadores pegam a mesma tarefa | Uma única consulta atômica que escolhe e marca |
| Esquecer de confirmar | A tarefa volta e é refeita sem parar | Confirmar após o sucesso, no esqueleto |
| Confirmar **antes** de processar | Uma pane perde a tarefa | Confirmar após o trabalho, e tornar o trabalho idempotente |
| Processamento não idempotente | Uma segunda passagem dobra o efeito (dois e-mails, dois débitos) | Escrever em modo « substitui » em vez de « acrescenta », anotar o que já foi feito |
| Trava sem expiração | Uma pane bloqueia a ficha para sempre | `expira_em` em cada trava |
| Expiração mais curta que o trabalho | Dois trabalhadores entram juntos | Duração superior ao pior caso, ou renovação |
| Liberar uma trava que não se possui mais | Apaga-se a trava de outro trabalhador | Apagar só se `dono` for o próprio |
| Trava colocada fora do esqueleto | Um trabalhador esquece de colocá-la | Pô-la na classe base, com `finally` |
| Tentar de novo sem limite | Uma tarefa envenenada roda em laço | `MAX_TENTATIVAS` e estado `morta` |
| Tentar de novo sem espera | Martela-se o serviço já em pane | Espera exponencial, com variação aleatória |
| Tarefas mortas nunca examinadas | Um defeito duradouro passa despercebido | Contar as mortas, alertar |
| Agendador que faz o trabalho ele mesmo | Ele invade a passagem seguinte | Ele apenas deposita; avançar o vencimento antes de depositar |
| Duas passagens simultâneas do agendador | Tarefa depositada em duplicata | `UPDATE` condicional e teste de `rowcount` |
| Trabalhador sem tratamento de `SIGTERM` | Uma parada corta uma tarefa no meio do trabalho | Terminar o turno em curso, depois sair |
| Nenhum supervisor | Um trabalhador parado, a fila cresce em silêncio | `systemd` ou `supervisord`, mais um alerta sobre o tamanho da fila |
| Colocar tudo na fila | Complexidade inútil para um trabalho de alguns milissegundos | Reservar a fila para trabalhos lentos, frágeis ou de pico |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Uma operação atômica para pegar uma tarefa | Nenhuma duplicata entre trabalhadores |
| Confirmar somente após o sucesso | Nenhuma tarefa perdida; a idempotência absorve os reenvios |
| Projetar cada processamento como idempotente | A entrega « pelo menos uma vez » se torna segura |
| Esqueleto numa classe base, trabalho na classe filha | A lógica de fila, trava e nova tentativa existe em um só lugar |
| Trava com expiração, liberada num `finally`, sobre a chave mais fina possível (a ficha, não a tabela inteira) | Nenhum bloqueio duradouro, o máximo de paralelismo |
| Espera exponencial, número de tentativas limitado, fila das mortas vigiada | As pânes passageiras se resolvem, os defeitos duradouros aparecem |
| Um único `cron` que lança o agendador, com o calendário no banco | Acrescentar uma tarefa recorrente não exige acesso ao servidor |
| Trabalhador que para com segurança em `SIGTERM`, supervisor que o relança | Implantações e reinícios sem tarefa cortada |
| Vigiar o tamanho da fila e a idade da sua tarefa mais antiga | Um trabalhador parado aparece antes dos usuários |

## O que reter

| | |
|---|---|
| **Para lembrar** | Uma **fila de espera** separa quem **deposita** uma tarefa (produtor) de quem a **executa** (trabalhador): a requisição responde rápido, os picos se escoam, uma falha se repete. Pegar uma tarefa deve ser **atômico** (uma requisição que escolhe e marca), e a **confirmação** só ocorre após o sucesso: a fila garante « pelo menos uma vez », portanto o processamento deve ser **idempotente**. O **agendador da aplicação** é um `cron` único que lê uma tabela e deposita as tarefas devidas, avançando antes o vencimento. O **método modelo** coloca o laço (pegar, travar, processar, confirmar ou tentar de novo, liberar) numa classe base; a classe filha escreve apenas `processar`. Uma **trava na aplicação** em tabela, sobre uma chave como `ficha:7`, impede que dois trabalhadores toquem na mesma entidade; sua **expiração** evita o bloqueio após uma pane, mas deve superar a duração do trabalho. Uma tarefa que falha volta com **espera exponencial**; após `MAX_TENTATIVAS`, ela se torna **morta**. Um **supervisor** (`systemd`, `supervisord`) relança os trabalhadores, que param com segurança em `SIGTERM`. |
| **Armadilhas a evitar** | Ler e marcar em duas consultas; esquecer de confirmar, ou confirmar antes de processar; processamento não idempotente; trava sem expiração, ou mais curta que o trabalho; liberar a trava de outro; trava colocada fora do esqueleto; novas tentativas sem limite nem espera; tarefas mortas ignoradas; agendador que trabalha em vez de depositar; duas passagens do agendador sem guarda; trabalhador que ignora `SIGTERM`; nenhum supervisor; colocar um trabalho trivial na fila. |
| **Boas práticas** | Pegar tarefa de forma atômica; confirmação após sucesso; idempotência sistemática; esqueleto em classe base; trava com expiração liberada num `finally`, sobre a chave mais fina; espera exponencial, tentativas limitadas, mortas vigiadas; um único `cron` e um calendário no banco; parada limpa em `SIGTERM` e supervisor; vigiar o tamanho e a idade da fila. |
