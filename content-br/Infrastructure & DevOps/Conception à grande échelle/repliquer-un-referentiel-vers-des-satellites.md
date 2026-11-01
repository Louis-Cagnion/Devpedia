---
order: 7
---

# Replicar um referencial para satélites

Imagine uma rede de lojas: um catálogo central descreve cada artigo (título, preço), e cada loja mantém a sua própria cópia para responder rápido aos clientes, mesmo quando a matriz está fechada. Sempre que um preço muda na matriz, as lojas precisam saber disso. Este capítulo explica como uma aplicação faz para **copiar dados de um lugar central para vários outros**, e sobretudo o que acontece quando uma cópia está inacessível. Ele supõe apenas a noção de [requisição HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (uma mensagem que um programa envia a outro pela rede, e que responde com um código de status) e a de [banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) (o software que guarda os dados em tabelas). O caso de vários sites construídos sobre um mesmo código é descrito em [Um código, vários sites: o padrão multisite](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=un-code-plusieurs-sites).

Três palavras aparecem em toda parte:

| Palavra | Definição | Na rede de lojas |
|---|---|---|
| **Referencial** | O lugar de referência: a fonte da verdade. Um dado é criado e modificado ali; em outros lugares, apenas se copia. | O catálogo da matriz |
| **Satélite** | Uma cópia local do referencial, mantida por outro programa ou outro site, que a lê sem jamais contradizê-la. | O catálogo de cada loja |
| **Replicação pela aplicação** | Copiar os dados **pelo código da aplicação** (ela mesma envia as mudanças), em oposição à replicação do banco de dados, em que é o software de banco que recopia as suas tabelas. | Um funcionário que telefona para as lojas, em vez de uma fotocopiadora automática |

Um exemplo comum: vários sites construídos sobre o mesmo sistema de gestão de conteúdo (uma ferramenta para criar e atualizar um site sem programar, como o [Drupal](https://www.drupal.org/docs), um software livre para publicar sites) recebem, cada um, as fichas de um site central. Nada neste capítulo depende disso: os exemplos são inventados e neutros.

## Por que não a replicação do banco de dados?

A [replicação de banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#replicas-de-leitura) (as réplicas de leitura) copia **todo** o banco, de forma idêntica, para uma máquina que serve para leitura. Ela é excelente quando a cópia é apenas um reforço de leitura. Não serve nos casos abaixo, em que se escolhe a replicação pela aplicação:

| Situação | Replicação do banco | Replicação pela aplicação |
|---|---|---|
| O satélite quer apenas uma parte dos dados (os artigos, não as contas dos clientes) | Em geral tudo ou nada (alguns motores filtram por tabela, ao preço de uma configuração pesada) | O código envia só o que é útil |
| O satélite tem estrutura própria (outras tabelas, outras colunas, outras chaves) | Impossível: as tabelas são copiadas de forma idêntica | O código traduz cada ficha para a estrutura do satélite |
| O satélite acrescenta dados próprios ao lado da cópia | A cópia fica somente leitura | Os dados locais e a cópia convivem |
| Os sistemas não usam o mesmo software de banco | Impossível | Uma mensagem HTTP passa em qualquer lugar |
| Queremos aplicar uma regra de negócio na chegada (uma regra própria da atividade, por exemplo recusar um preço negativo) | Nenhum controle sobre a cópia | O satélite executa o próprio código |

O preço a pagar: tudo o que o banco fazia sozinho (ordem das mudanças, retomada após uma falha) passa a ser **o seu** trabalho. O resto do capítulo é a lista desse trabalho.

## O esquema geral

```text
                 +--------------------------+
                 |       REFERENCIAL        |
                 |  (fonte da verdade)      |
                 |  ART-1  Lâmpada LED  v2  |
                 |  ART-2  Cadeira    v2    |
                 +------------+-------------+
                              |
        uma mensagem por mudança: identificador externo + versão + dados
              +---------------+---------------+
              |               |               |
              v               v               v
       +-------------+ +-------------+ +-------------+
       | SATÉLITE A  | | SATÉLITE B  | | SATÉLITE C  |
       | chave local | | chave local | | chave local |
       | ART-1 -> 1  | | ART-1 -> 100| | ART-1 -> 500|
       +-------------+ +-------------+ +-------------+
```

O sentido é único: o referencial envia, os satélites recebem. As três cópias trazem a **mesma ficha** (`ART-1`) sob três **chaves locais** diferentes (1, 100, 500): é o assunto da seção sobre o identificador externo.

## Três formas de propagar uma mudança

Quando uma ficha muda no referencial, três estratégias permitem avisar os satélites. Algumas palavras primeiro:

- A **coerência** descreve o quanto as cópias mostram a mesma coisa no mesmo instante. Ela é **imediata** se, assim que a mudança é confirmada, todos os satélites já a receberam; é **eventual** (*eventual consistency*) se as cópias acabam ficando idênticas depois de um prazo.
- A **latência** é o tempo que espera quem dispara a operação (aqui, o usuário que salva uma ficha) antes de receber a resposta.
- Uma [fila de espera](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#filas-e-processamento-assincrono) é uma lista de tarefas a fazer, deixada por um programa e tratada mais tarde por outro (o *worker*).

```text
1. SÍNCRONA            2. FILA DE ESPERA          3. CONSULTA PERIÓDICA
   (o referencial         (o referencial deixa       (cada satélite pede
    chama e espera)        uma mensagem e segue)      por conta própria)

 usuário                   usuário                     usuário
     |                         |                           |
     v                         v                           v
 referencial               referencial                 referencial
   |   |   |                   |                           ^
   v   v   v                   v                           | “há novidades
   A   B   C                 [ fila ]                      |  desde a v. 41?”
 (um por um,                   |  |  |                   A   B   C
  resposta esperada)           v  v  v                 (em intervalos regulares)
                               A  B  C
                           (worker, depois)
```

| | Propagação síncrona | Fila de espera | Consulta periódica (*pull*) |
|---|---|---|---|
| **Quem toma a iniciativa** | O referencial, durante a requisição | O referencial deixa, um worker entrega | Cada satélite, no seu ritmo |
| **Coerência** | Imediata se todos respondem; uma divergência assim que um envio falha | Eventual: alguns segundos | Eventual: o intervalo entre duas consultas (minutos, horas) |
| **Latência para o usuário** | A **soma** das trocas com os N satélites | Uma única escrita na fila | Nenhuma (o satélite trabalha por conta própria) |
| **Falha de um satélite** | A requisição espera o prazo máximo (*timeout*: o tempo que se aceita esperar uma resposta antes de desistir) ou falha; uma divergência aparece | A mensagem fica na fila até o satélite voltar | Nada se perde: na volta, o satélite pede tudo o que perdeu |
| **O que acrescentar** | Um caderno dos envios falhados (ver abaixo) | Uma infraestrutura de fila e um worker | Do lado do referencial, um meio de dizer “o que mudou desde tal versão” |
| **Convém quando** | Poucos satélites, confiáveis, e queremos ver a mudança já | Muitos satélites, ou falhas frequentes | Satélites muito numerosos ou com frequência desligados (um satélite que acorda se recupera) |

A consulta periódica exige que cada mudança traga um número que só cresce (uma **versão**, ou um **cursor**: o último número já visto pelo satélite). O satélite pergunta “dê-me tudo o que tem um número superior a 41” e não precisa mais que o referencial se lembre dele.

Este capítulo toma a **propagação síncrona** como fio condutor: é a mais simples de escrever, portanto a mais comum nas primeiras versões de uma aplicação, e a que mostra mais armadilhas. As outras duas se obtêm deslocando a etapa “enviar ao satélite” para outro lugar: para um worker, no caso da fila, e para o próprio satélite, no caso da consulta. Todo o resto (identificador externo, idempotência, reenvio, reconciliação) se aplica igualmente às três.

A escolha entre empurrar cedo (escrita) e montar tarde (leitura) aparece em [o feed de notícias](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out), que responde a um desafio vizinho: uma mudança a dar a conhecer a muitos destinatários. A visão de conjunto da seção está em [Conception à grande échelle](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=conception-a-grande-echelle).

## O identificador externo: encontrar a mesma ficha

Cada banco de dados dá às suas linhas uma **chave local** (também se fala em chave primária): um número (ou um texto) único que designa uma única linha, distribuído pelo próprio banco quando a linha é criada. O satélite A numera os seus artigos 1, 2, 3; o satélite B, que já tem outros dados, começa em 100. A chave local, portanto, não tem sentido fora do seu banco.

Para que o satélite saiba “esta ficha que recebo é a que eu já tenho”, envia-se com cada ficha a chave que o **referencial** lhe deu: o **identificador externo**. O satélite o guarda em uma coluna à parte e o usa para encontrar a sua linha.

| | Chave local | Identificador externo |
|---|---|---|
| **Quem a escolhe** | O satélite (o seu banco) | O referencial |
| **Valor para uma mesma ficha** | Diferente em cada satélite (1, 100, 500) | Idêntico em todos (`ART-1`) |
| **Serve para** | Ligar as tabelas do satélite entre si | Encontrar, no satélite, a ficha vinda do referencial |
| **Pode ser mudada?** | Sim, desde que o satélite continue coerente | Não: é o fio que liga as cópias |
| **Quando usar** | No código e nas consultas do satélite | Nas mensagens entre referencial e satélites |

Sem identificador externo, o satélite só pode **criar** uma nova linha a cada mensagem recebida. Eis o que acontece quando uma resposta se perde. O código abaixo simula um satélite ingênuo (escrito em [Python](/?c=langages&s=python&p=python), cujos termos são explicados linha por linha: uma **classe** reúne dados e funções, ver [a programação orientada a objetos em Python](/?c=langages&s=python&p=poo); uma **exceção** é um erro que se pode interceptar, ver [o tratamento de erros](/?c=langages&s=python&p=gestion-des-erreurs), que cobre também `try` / `except`). As construções básicas estão nos capítulos sobre as [funções](/?c=langages&s=python&p=fonctions) (`def`, `return`), as [condições](/?c=langages&s=python&p=conditions) (`if`, `elif`, `else`), os [laços](/?c=langages&s=python&p=boucles) (`for`) e os [módulos](/?c=langages&s=python&p=modules-et-environnements) (`import`).

```python
# classe que faz o papel de um satélite SEM identificador externo: ele numera sozinho
class SateliteIngenuo:
    # __init__ prepara um objeto novo (self designa o objeto em criação)
    def __init__(self):
        # lista das fichas recebidas, na ordem de chegada
        self.fichas = []
        # se True, a resposta "recebido" se perde no caminho: quem chama não a vê
        self.resposta_perdida = False

    # receber simula a recepção de uma requisição de envio
    def receber(self, titulo):
        # cada recepção acrescenta uma ficha nova, sem verificar se ela já existe
        self.fichas.append(titulo)
        # a ficha é gravada, mas quem chama só recebe o erro
        if self.resposta_perdida:
            # raise dispara a exceção: quem chama a recebe no lugar de um resultado
            raise TimeoutError("sem resposta antes do prazo máximo")


# cria um satélite sem identificador externo
satelite = SateliteIngenuo()
# a resposta vai se perder: o envio parecerá ter falhado
satelite.resposta_perdida = True
# tentativa 1: o referencial envia a ficha
try:
    satelite.receber("Lâmpada de mesa")
# TimeoutError é lançada quando a resposta não chega a tempo
except TimeoutError as erro:
    # o referencial não sabe se a ficha chegou: ele tenta de novo
    print("tentativa 1:", erro)
# a resposta se perderá de novo, para mostrar o segundo envio
try:
    # tentativa 2: mesma ficha, reenviada por precaução
    satelite.receber("Lâmpada de mesa")
# mesmo erro que a tentativa 1
except TimeoutError as erro:
    # mostra a segunda falha aparente
    print("tentativa 2:", erro)
# número de fichas realmente presentes no satélite
print("fichas no satélite:", len(satelite.fichas))
```

Saída obtida:

```text
tentativa 1: sem resposta antes do prazo máximo
tentativa 2: sem resposta antes do prazo máximo
fichas no satélite: 2
```

O referencial recebeu **duas** vezes um erro, então reenviou a ficha. Mas a primeira recepção tinha dado certo, só a resposta se perdera: o satélite agora contém duas vezes “Lâmpada de mesa”. Um envio que falha **não diz** se o satélite o aplicou: um prazo estourado (*timeout*) é ambíguo.

## A idempotência: tornar o envio reenviável sem perigo

Uma operação é **idempotente** quando fazê-la várias vezes dá o mesmo resultado que fazê-la uma vez. Ligar o interruptor para “ligado” é idempotente (repetir não muda nada); “inverter o interruptor” não é. O mesmo princípio, com outros exemplos, é descrito em [a robustez de um processamento em lote](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots), em [as migrações de dados seguras](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) e, para um identificador de evento já tratado, em [a segurança dos webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks).

Para tornar o envio idempotente, o satélite precisa de **duas** coisas na mensagem:

| Elemento da mensagem | Papel | Sem ele |
|---|---|---|
| O identificador externo | Dizer **qual** ficha | Uma duplicata a cada reenvio |
| A versão (ou a data de modificação) | Dizer **qual estado** da ficha | Uma mensagem antiga, chegada atrasada, sobrescreve um estado mais recente |

A regra do satélite cabe em três linhas:

| Caso na recepção | Ação |
|---|---|
| Identificador externo desconhecido | Criar a ficha (nova chave local) |
| Identificador conhecido, versão recebida **mais recente** | Substituir a ficha |
| Identificador conhecido, versão recebida **igual ou mais antiga** | Não fazer nada, mas **responder “sucesso”** |

A última linha é essencial: uma mensagem ignorada não é um erro. Se o satélite respondesse “erro” a uma duplicata, o referencial a reenviaria sem fim.

Em HTTP, a forma natural é uma requisição `PUT` (“substitui o recurso que está neste endereço”), cujo sentido é idempotente por natureza, enquanto um `POST` (“acrescenta um recurso”) cria uma duplicata a cada repetição (ver [os métodos HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). O identificador externo vai no endereço, e a versão no corpo da requisição (os dados anexados a ela), em formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (um texto estruturado em pares nome-valor):

```text
PUT /api/fichas/ART-1 HTTP/1.1
Host: satelite-b.exemplo.test
Content-Type: application/json

{"id_externo": "ART-1", "titulo": "Lâmpada LED", "preco": 12, "versao": 2}
```

A primeira linha dá o método, o endereço e o protocolo (`HTTP/1.1`: a versão das regras de troca); `Host` nomeia a máquina visada e `Content-Type` anuncia o formato do corpo. Respostas possíveis do satélite:

| Resposta | Significado para o referencial |
|---|---|
| `200` ou `201` | Recebido e tratado (ou ignorado como duplicata): retirar o envio do caderno |
| `4xx` (por exemplo `422`, família dos erros imputados a quem envia), exceto `408` (prazo estourado) e `429` (excesso de requisições), para tentar de novo mais tarde como um `5xx` | A mensagem é recusada por ser inválida: reenviá-la tal qual não adianta, é preciso corrigi-la ou emitir um alerta |
| `5xx` (família dos erros do servidor), ou nenhuma resposta antes do prazo | O satélite está com dificuldades: tentar de novo mais tarde |

## Quando um satélite está inacessível

Um satélite pode estar desligado, sobrecarregado, em manutenção, ou simplesmente atrás de uma rede que cai. Três palavras descrevem o que vem a seguir:

| Palavra | Significado | Como se resolve |
|---|---|---|
| **Divergência** | A diferença entre o que o referencial possui e o que o satélite possui | Registra-se: o referencial anota, em um **caderno**, quais identificadores o satélite não recebeu |
| **Reenvio** | Reenviar o que o caderno contém, quando o satélite volta a responder | Uma tarefa agendada (ver [cron](/?c=langages&s=bash&p=automatisation-cron)) ou um worker tenta de novo em intervalos regulares |
| **Reconciliação** | Comparar **todo** o conteúdo do satélite com o do referencial, sem confiar no caderno, e corrigir o que difere | Uma verificação completa, feita à mão ou periodicamente |

Dois detalhes importam muito:

- O reenvio envia a ficha **no seu estado atual**, não a mensagem original. Se uma ficha mudou três vezes durante a falha, o satélite recebe uma única vez a última versão: não adianta fazê-lo reproduzir o histórico.
- O caderno pode se perder (reinício de um programa que o guardava na memória, bug, restauração de um backup antigo). Um satélite cujo caderno se perdeu nunca será reenviado. A reconciliação existe para esse caso: é a rede de segurança que não depende de nada além da comparação dos dados.

| Mecanismo | Custo | Pega | Deixa passar |
|---|---|---|---|
| Reenvio do caderno | Baixo (só as divergências anotadas) | Um satélite que volta após uma falha | Um envio cuja falha o referencial não anotou |
| Reconciliação | Alto (lê tudo, ou todas as versões) | Qualquer divergência, qualquer que seja a origem | Nada, mas roda só em intervalos |

Combinam-se os dois: o reenvio recupera rápido o caso comum, e a reconciliação (por exemplo, toda noite) recupera o resto.

## Detectar a dessincronização

Uma dessincronização silenciosa é a pior: tudo funciona, mas uma loja exibe um preço vencido. São necessárias medidas simples, comparadas com regularidade.

| Medida | Como | Detecta | Não detecta |
|---|---|---|---|
| **Contador** | Número de fichas do referencial contra o número de fichas do satélite | Uma ficha faltando ou sobrando | Uma ficha modificada mas presente nos dois lados (mesmo número, versões diferentes) |
| **Impressão digital** | Um resumo calculado sobre as versões de todas as fichas; duas impressões diferentes significam que o conteúdo difere | Qualquer diferença de versão, mesmo com o mesmo número de fichas | **Qual** difere (é preciso então comparar ficha a ficha) |
| **Data da última atualização** | Cada satélite anota a data da última mensagem recebida; alerta-se se ela estiver antiga demais em relação ao referencial | Um satélite que não recebe mais nada | Um satélite que recebe, mas erra |
| **Comparação ficha a ficha** | Para cada identificador, comparar a versão dos dois lados | A lista exata das divergências | Nada, mas é o mais caro |

Uma **impressão digital** (em inglês *hash*) é o resultado de uma função de hash: um cálculo que transforma qualquer texto em um resumo curto de tamanho fixo, de modo que dois textos diferentes dão, na prática, dois resumos diferentes (ver [hashing e criptografia](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-versus-criptografia-uma-confusao-frequente)). Uma dessas funções, o SHA-256, é usada na simulação mais abaixo. Aqui, resume-se a lista dos pares (identificador, versão). A impressão digital do referencial e a do satélite se comparam num relance, sem transferir os dados.

Um detalhe a ter em mente: uma impressão digital calculada sobre as **versões** percebe que um satélite tem uma versão antiga, mas não percebe que uma ficha foi corrompida com a versão igual. Para esse segundo risco, calcula-se a impressão digital sobre o **conteúdo** (título, preço...) além da versão.

A estratégia que funciona: comparar contadores e impressões digitais com frequência (é pouco custoso), e só lançar a comparação ficha a ficha quando a impressão digital difere.

## Os limites do envio síncrono

Com a propagação síncrona, a requisição do usuário **depende de N satélites**: ela só termina quando os N responderam (ou quando se desistiu). Isso custa de três formas.

**1. A latência se soma.** Os envios são feitos um a um. Com três satélites que respondem em 40, 90 e 60 ms, o usuário espera 190 ms. Com dez satélites a 100 ms cada, ele espera um segundo, só para salvar uma ficha.

**2. Uma falha custa o prazo máximo inteiro.** Um satélite desligado não responde “não” logo de cara: ele se cala, e o referencial espera o fim do prazo máximo (aqui, 3 segundos) antes de desistir. Cada gravação durante a falha custa, portanto, 3 segundos a mais para o usuário.

**3. A disponibilidade se multiplica.** A **disponibilidade** é a parte do tempo em que um sistema responde. Se a gravação exige que todos os satélites respondam, a probabilidade de dar certo é o **produto** das disponibilidades. Por exemplo, com satélites disponíveis 99 % do tempo cada um (ou seja, 0,99) e falhando independentemente uns dos outros:

| Número de satélites | Cálculo | Probabilidade de que todos respondam |
|---|---|---|
| 1 | 0,99 | 99 % |
| 3 | 0,99 × 0,99 × 0,99 | cerca de 97 % |
| 10 | 0,99 elevado a 10 | cerca de 90 % |
| 20 | 0,99 elevado a 20 | cerca de 82 % |

Com vinte satélites, quase uma escrita em cada cinco cairia em pelo menos uma falha. Dois remédios, muitas vezes combinados:

| Remédio | Princípio | Efeito |
|---|---|---|
| **Não** fazer a requisição falhar quando um satélite fica mudo | A gravação dá certo no referencial; a falha vai para o caderno | A disponibilidade da aplicação deixa de depender dos satélites |
| Tirar o envio da requisição (fila de espera) | A requisição deixa uma mensagem, e um worker envia em segundo plano | A latência deixa de depender do número de satélites |

A simulação abaixo aplica o primeiro remédio (a divergência é anotada, a requisição dá certo) e mostra o custo (3 segundos de espera); o segundo é o assunto da [fila de espera](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#filas-e-processamento-assincrono).

> **Armadilha:** achar que uma propagação que funciona com três satélites em teste vai aguentar com trinta em condições reais, diante dos usuários. A latência e a probabilidade de falha crescem com o número de satélites.

## Uma simulação completa

O programa abaixo junta tudo: um referencial e três satélites, dos quais um cai. Ele está em Python (ver [os dicionários e os conjuntos](/?c=langages&s=python&p=dictionnaires-et-ensembles) para `{}` e `set()`). A “rede” é substituída por uma simples chamada de função que pode lançar `ConnectionError`; as durações são **simuladas** (números somados, nunca uma espera real), o que torna o resultado idêntico a cada execução.

### O satélite

```python
# hashlib (biblioteca padrão: fornecida com o Python, nada a instalar)
# calcula impressões digitais
import hashlib
# json transforma uma estrutura Python em texto, para calcular a impressão digital
import json

# tempo perdido esperando um satélite mudo antes de desistir (em ms, simulado)
PRAZO_MAX_MS = 3000


# uma impressão digital resume uma tabela {identificador: versão} em 8 caracteres
def impressao(versoes):
    # items() dá os pares (identificador, versão); sorted os ordena: mesmo texto
    # json.dumps transforma essa lista em texto
    texto = json.dumps(sorted(versoes.items()))
    # encode() converte o texto em bytes (números de 0 a 255, a forma armazenada);
    # sha256 faz dele um resumo de 64 caracteres hexadecimais (algarismos e letras a-f);
    # [:8] guarda os 8 primeiros
    return hashlib.sha256(texto.encode()).hexdigest()[:8]


# um satélite: uma cópia local que tem as suas próprias chaves
class Satelite:
    # primeira_chave: primeira chave local livre (cada satélite tem o seu histórico)
    def __init__(self, nome, primeira_chave, latencia_ms):
        # nome legível, para as mensagens
        self.nome = nome
        # duração simulada de uma troca bem-sucedida
        self.latencia_ms = latencia_ms
        # True: o satélite não responde mais
        self.fora_do_ar = False
        # chave local -> ficha (é a tabela do satélite)
        self.fichas = {}
        # identificador externo -> chave local (para encontrar “a mesma ficha”)
        self.chave_por_id_externo = {}
        # próxima chave local a distribuir
        self.proxima_chave = primeira_chave

    # recebe uma mensagem do referencial; recebê-la duas vezes muda o resultado uma vez só
    def receber(self, mensagem):
        # um satélite fora do ar não responde: quem chama recebe uma exceção
        if self.fora_do_ar:
            # f"..." insere o valor de self.nome no lugar de {self.nome}
            raise ConnectionError(f"{self.nome} inacessível")
        # o identificador externo é a chave do referencial, nunca a chave local
        id_externo = mensagem["id_externo"]
        # get() devolve o valor da chave, ou None (o valor “nada”) se ela estiver ausente;
        # aqui: a chave local da ficha, se ela já for conhecida
        chave = self.chave_por_id_externo.get(id_externo)
        # ficha desconhecida: cria-a sob uma nova chave local
        if chave is None:
            # pega a próxima chave local livre
            chave = self.proxima_chave
            # a chave seguinte será a seguinte
            self.proxima_chave += 1
            # memoriza a correspondência identificador externo -> chave local
            self.chave_por_id_externo[id_externo] = chave
        # ficha conhecida, em versão igual ou mais recente: nada a fazer (idempotência)
        elif self.fichas[chave]["versao"] >= mensagem["versao"]:
            # responde “ignorado”: o envio é um sucesso, mas não muda nada
            return "ignorado"
        # dict(mensagem) faz uma cópia da mensagem, guardada sob a chave local
        self.fichas[chave] = dict(mensagem)
        # responde que a mensagem modificou o satélite
        return "aplicado"

    # identificador externo -> versão, visão geral do que o satélite possui
    def versoes(self):
        # compreensão de dicionário: constrói um dicionário em uma linha percorrendo
        # uma coleção, aqui uma entrada por ficha (values() lista as fichas)
        return {f["id_externo"]: f["versao"] for f in self.fichas.values()}
```

### O referencial

```python
# o referencial: a fonte da verdade, que propaga cada mudança
class Referencial:
    # satelites: a lista das cópias a manter atualizadas
    def __init__(self, satelites):
        # identificador -> ficha (título, preço, versão)
        self.fichas = {}
        # os satélites a alimentar
        self.satelites = satelites
        # o caderno: por satélite, um set (conjunto) de identificadores pendentes
        self.a_reenviar = {s.nome: set() for s in satelites}

    # cria ou modifica uma ficha, depois a propaga; devolve a duração total simulada
    def registrar(self, id_externo, titulo, preco):
        # versão anterior da ficha (None se ela for nova)
        anterior = self.fichas.get(id_externo)
        # a versão aumenta 1 a cada modificação (1 para uma ficha nova)
        versao = 1 if anterior is None else anterior["versao"] + 1
        # grava a ficha no referencial, com o seu identificador e a sua versão
        self.fichas[id_externo] = {
            # o identificador externo viaja com a ficha
            "id_externo": id_externo,
            # os dados da ficha: um título e um preço
            "titulo": titulo,
            "preco": preco,
            # a versão permite comparar dois estados da mesma ficha
            "versao": versao,
        }
        # propaga de forma síncrona: um satélite após o outro, resposta esperada;
        # sum soma as durações devolvidas (uma por satélite, calculada sob demanda)
        return sum(self.enviar(s, id_externo) for s in self.satelites)

    # envia a versão ATUAL de uma ficha a um satélite; devolve a duração simulada
    def enviar(self, satelite, id_externo):
        # try / except: tenta o envio e intercepta o erro de conexão
        try:
            satelite.receber(self.fichas[id_externo])
        # satélite mudo: anotamos a divergência no caderno
        except ConnectionError:
            self.a_reenviar[satelite.nome].add(id_externo)
            # e perdemos todo o prazo de espera
            return PRAZO_MAX_MS
        # envio bem-sucedido: discard retira o identificador do caderno (sem erro se ausente)
        self.a_reenviar[satelite.nome].discard(id_externo)
        # duração da troca bem-sucedida
        return satelite.latencia_ms

    # reenvio: manda de novo tudo o que está anotado no caderno
    def reenviar(self):
        # para cada satélite...
        for satelite in self.satelites:
            # sorted cria uma cópia congelada, pois enviar() modifica o conjunto durante o laço
            for id_externo in sorted(self.a_reenviar[satelite.nome]):
                # ...reenvia cada ficha anotada
                self.enviar(satelite, id_externo)

    # reconciliação: compara tudo, sem confiar no caderno
    def reconciliar(self, satelite):
        # versões que o satélite realmente possui
        possuidas = satelite.versoes()
        # fichas ausentes ou vencidas do lado do satélite (compreensão de lista:
        # constrói uma lista em uma linha); items() dá os pares (identificador, ficha),
        # get() a versão possuída (None se ausente)
        divergencias = [
            id_externo for id_externo, ficha in self.fichas.items()
            if possuidas.get(id_externo) != ficha["versao"]
        ]
        # reenvia cada uma dessas fichas
        for id_externo in divergencias:
            self.enviar(satelite, id_externo)
        # lista das fichas corrigidas
        return divergencias

    # impressão digital do que o referencial possui
    def impressao(self):
        # mesmo cálculo que para um satélite, sobre as versões do referencial
        return impressao({i: f["versao"] for i, f in self.fichas.items()})


# mostra o contador e a impressão digital do referencial, depois de cada satélite
def estado(referencial):
    # impressão digital de referência, calculada uma única vez
    referencia = referencial.impressao()
    # linha do referencial
    print(f"  referencial: {len(referencial.fichas)} fichas, impressão digital {referencia}")
    # uma linha por satélite, com o veredito da comparação
    for s in referencial.satelites:
        # impressão digital do que este satélite possui
        e = impressao(s.versoes())
        # “ok” se for idêntica à referência, “DIVERGÊNCIA” caso contrário
        veredito = "ok" if e == referencia else "DIVERGÊNCIA"
        # {s.nome:<10} completa o nome com espaços até 10 caracteres
        print(f"  {s.nome:<10}: {len(s.fichas)} fichas, impressão digital {e}  {veredito}")
```

### O cenário

```python
# três satélites, com históricos locais diferentes (chaves de partida 1, 100, 500)
sat_a = Satelite("A", 1, 40)
# B responde em 90 ms e numera a partir de 100
sat_b = Satelite("B", 100, 90)
# C responde em 60 ms e numera a partir de 500
sat_c = Satelite("C", 500, 60)
# o referencial que os alimenta
ref = Referencial([sat_a, sat_b, sat_c])

# --- 1. funcionamento normal ---
print("1. três fichas criadas, todos respondem")
# enumerate numera os títulos a partir de 1: (1, "Lâmpada"), (2, "Cadeira"), ...
for i, titulo in enumerate(["Lâmpada", "Cadeira", "Escrivaninha"], start=1):
    # cria as fichas ART-1, ART-2, ART-3; duracao guarda a última duração
    duracao = ref.registrar(f"ART-{i}", titulo, 10 * i)
print(f"  duração da requisição do usuário: {duracao} ms (40 + 90 + 60)")
# mostra os contadores e as impressões digitais
estado(ref)
# a mesma ficha tem três chaves locais diferentes
print("  chave local de ART-1:",
      {s.nome: s.chave_por_id_externo["ART-1"] for s in ref.satelites})

# --- 2. idempotência: a mesma mensagem enviada duas vezes ---
print("2. mesma mensagem enviada duas vezes a um satélite de ensaio, fora do referencial")
# satélite de ensaio, vazio
ensaio = Satelite("ensaio", 900, 10)
# primeiro envio da versão 1 de ART-1
primeiro = ensaio.receber(ref.fichas["ART-1"])
# segundo envio, idêntico, como depois de uma resposta perdida
segundo = ensaio.receber(ref.fichas["ART-1"])
print(" ", primeiro, "depois", segundo, "; fichas no ensaio:", len(ensaio.fichas))

# --- 3. B cai durante duas mudanças ---
print("3. B fora do ar; ART-2 modificado, ART-4 criado")
# B não responde mais
sat_b.fora_do_ar = True
# modificação de uma ficha existente
d1 = ref.registrar("ART-2", "Cadeira", 25)
# criação de uma nova ficha
d2 = ref.registrar("ART-4", "Prateleira", 40)
print(f"  durações: {d1} ms e {d2} ms (40 + 3000 + 60 para cada uma)")
print("  a reenviar:", {nome: sorted(ids) for nome, ids in ref.a_reenviar.items() if ids})
# mostra os contadores e as impressões digitais
estado(ref)

# --- 4. B volta: reenvio ---
print("4. B volta, reenvio do caderno")
# B responde de novo
sat_b.fora_do_ar = False
# reenvia o que o caderno contém
ref.reenviar()
# mostra os contadores e as impressões digitais
estado(ref)

# --- 5. C cai, depois o caderno se perde: reconciliação ---
print("5. C fora do ar durante uma mudança, depois o referencial perde o caderno")
# C não responde durante a modificação de ART-1
sat_c.fora_do_ar = True
ref.registrar("ART-1", "Lâmpada LED", 12)
# reinício do referencial: o caderno, guardado na memória, é esvaziado
ref.a_reenviar = {s.nome: set() for s in ref.satelites}
# C volta
sat_c.fora_do_ar = False
# o reenvio não encontra nada para enviar
ref.reenviar()
print("  depois do reenvio (caderno vazio):")
# mostra os contadores e as impressões digitais
estado(ref)
# a reconciliação compara as versões ficha a ficha e devolve as divergências
print("  reconciliação de C:", ref.reconciliar(sat_c))
# mostra os contadores e as impressões digitais
estado(ref)
```

Saída obtida ao executar este programa (Python 3 deve estar instalado, ver [Python](/?c=langages&s=python&p=python); os três blocos acima, do satélite ao cenário, se colam na ordem em um único arquivo `simulation.py`, depois `python3 simulation.py` em um terminal):

```text
1. três fichas criadas, todos respondem
  duração da requisição do usuário: 190 ms (40 + 90 + 60)
  referencial: 3 fichas, impressão digital 20791267
  A         : 3 fichas, impressão digital 20791267  ok
  B         : 3 fichas, impressão digital 20791267  ok
  C         : 3 fichas, impressão digital 20791267  ok
  chave local de ART-1: {'A': 1, 'B': 100, 'C': 500}
2. mesma mensagem enviada duas vezes a um satélite de ensaio, fora do referencial
  aplicado depois ignorado ; fichas no ensaio: 1
3. B fora do ar; ART-2 modificado, ART-4 criado
  durações: 3100 ms e 3100 ms (40 + 3000 + 60 para cada uma)
  a reenviar: {'B': ['ART-2', 'ART-4']}
  referencial: 4 fichas, impressão digital 90b23cec
  A         : 4 fichas, impressão digital 90b23cec  ok
  B         : 3 fichas, impressão digital 20791267  DIVERGÊNCIA
  C         : 4 fichas, impressão digital 90b23cec  ok
4. B volta, reenvio do caderno
  referencial: 4 fichas, impressão digital 90b23cec
  A         : 4 fichas, impressão digital 90b23cec  ok
  B         : 4 fichas, impressão digital 90b23cec  ok
  C         : 4 fichas, impressão digital 90b23cec  ok
5. C fora do ar durante uma mudança, depois o referencial perde o caderno
  depois do reenvio (caderno vazio):
  referencial: 4 fichas, impressão digital 8b61e9c0
  A         : 4 fichas, impressão digital 8b61e9c0  ok
  B         : 4 fichas, impressão digital 8b61e9c0  ok
  C         : 4 fichas, impressão digital 90b23cec  DIVERGÊNCIA
  reconciliação de C: ['ART-1']
  referencial: 4 fichas, impressão digital 8b61e9c0
  A         : 4 fichas, impressão digital 8b61e9c0  ok
  B         : 4 fichas, impressão digital 8b61e9c0  ok
  C         : 4 fichas, impressão digital 8b61e9c0  ok
```

### Ler a saída

| Etapa | O que se observa | O que entender |
|---|---|---|
| 1 | A requisição dura 190 ms; ART-1 tem as chaves locais 1, 100 e 500 | A latência é a soma (40 + 90 + 60); a chave local difere, e o identificador externo `ART-1` liga as cópias |
| 2 | “aplicado depois ignorado”, uma única ficha no satélite de ensaio | A mesma mensagem recebida duas vezes não cria duplicata (idempotência) |
| 3 | Cada requisição dura 3100 ms; B mostra DIVERGÊNCIA; o caderno contém ART-2 e ART-4 | A falha de B custa 3000 ms a cada gravação; o contador de B (3) é inferior ao dos outros (4) |
| 4 | Depois do reenvio, as quatro impressões digitais são idênticas | O caderno bastou para recuperar B |
| 5 | O contador de C vale 4, como os outros, mas a sua impressão digital difere; o reenvio não muda nada; a reconciliação devolve `ART-1` | O contador não vê uma ficha vencida; a impressão digital a vê; a reconciliação conserta até quando o caderno se perdeu |

## As armadilhas

| Armadilha | Consequência | Correção |
|---|---|---|
| Usar a chave local do referencial como identificador nos satélites | As chaves colidem com as que o satélite já distribuiu | Um identificador externo distinto, guardado em uma coluna dedicada do satélite |
| Sem identificador externo: criar a cada mensagem | Duplicatas a cada reenvio | Procurar a ficha pelo identificador externo antes de criar |
| Sem versão: aplicar toda mensagem recebida | Uma mensagem antiga, chegada atrasada, sobrescreve um estado mais recente | Ignorar toda versão inferior ou igual à já possuída |
| Responder “erro” a uma duplicata | O referencial reenvia sem fim | Responder “sucesso” e não mudar nada |
| Fazer a gravação falhar quando um satélite está mudo | A disponibilidade da aplicação depende da mais fraca das cópias | Gravar no referencial, anotar a divergência, reenviar depois |
| Caderno das falhas guardado só na memória | Um reinício apaga a lista; o satélite nunca será recuperado | Gravar o caderno em uma tabela do referencial, e reconciliar periodicamente |
| Reenviar a mensagem original | Várias mensagens a aplicar na ordem, ou uma mensagem vencida | Reenviar o estado atual da ficha |
| Não propagar a exclusão | Uma ficha excluída no referencial continua visível nos satélites | Enviar uma mensagem “excluído” (ou manter uma marca de exclusão: uma coluna `excluido = verdadeiro` em vez de apagar a linha) e tratar, na reconciliação, as fichas do satélite ausentes do referencial (a simulação não trata esse caso) |
| Confiar só no contador | Uma ficha vencida passa despercebida | Acrescentar uma impressão digital das versões |
| Uma impressão digital que só vê as versões | Uma ficha corrompida com versão igual passa despercebida | Incluir o conteúdo no cálculo da impressão digital |
| Prazo de espera ausente ou enorme | Um satélite mudo trava a requisição do usuário | Um prazo máximo curto, fixado para cada chamada |
| Tentar de novo imediatamente e sem fim | Um satélite já sobrecarregado recebe ainda mais requisições | Espaçar as novas tentativas, alongando a espera a cada falha |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um identificador externo e uma versão em **cada** mensagem | O satélite sabe qual ficha e qual estado, então o envio se reenvia sem perigo |
| Envios idempotentes, sempre confirmados por um sucesso | Um prazo estourado é ambíguo: só o reenvio tira a dúvida |
| Anotar cada falha em um caderno **durável** (uma tabela) | Nenhum satélite é esquecido depois de um reinício |
| Reenviar o estado atual da ficha, não a mensagem original | Um único envio basta, mesmo depois de várias mudanças |
| Reconciliar periodicamente | A rede de segurança que recupera tudo o que o caderno deixou passar |
| Comparar contadores e impressões digitais, e alertar sobre a divergência | Detectar a dessincronização antes que um usuário a perceba |
| Um prazo máximo curto em cada chamada ao satélite | Uma falha deixa de travar a requisição do usuário |
| Tirar o envio da requisição (fila de espera) assim que N cresce | A latência e a disponibilidade deixam de depender do número de satélites |
| Manter o sentido único: o referencial envia, os satélites recebem | Uma modificação local de um satélite seria sobrescrita no envio seguinte |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **referencial** (fonte da verdade) envia as suas mudanças a **satélites** (cópias locais) pelo código da aplicação: é a **replicação pela aplicação**, em oposição à replicação do banco de dados. Três estratégias: propagação síncrona (a requisição espera os N satélites), fila de espera (um worker entrega depois), consulta periódica (o satélite pede o que perdeu). Cada mensagem traz um **identificador externo** (a chave do referencial, distinta da chave local do satélite) e uma **versão**, para que o envio seja **idempotente**: recebê-lo duas vezes não muda nada a mais. Um satélite inacessível cria uma **divergência**, anotada em um **caderno** para um **reenvio**; a **reconciliação** compara tudo e recupera o que o caderno deixou passar. Detecta-se a dessincronização por contadores, impressão digital das versões e data da última atualização. O envio síncrono soma as latências e multiplica os riscos de falha. |
| **Armadilhas a evitar** | Usar a chave local como identificador; criar a cada mensagem; não versionar; responder “erro” a uma duplicata; fazer a gravação falhar quando um satélite está mudo; caderno guardado na memória; reenviar a mensagem antiga em vez do estado atual; esquecer as exclusões; confiar só no contador; prazo de espera ausente; novas tentativas sem pausa. |
| **Boas práticas** | Identificador externo e versão em cada mensagem; envios idempotentes confirmados por um sucesso; caderno durável; reenvio do estado atual; reconciliação periódica; alertas sobre contador e impressão digital; prazo máximo curto; fila de espera assim que o número de satélites cresce; fluxo de sentido único. |
