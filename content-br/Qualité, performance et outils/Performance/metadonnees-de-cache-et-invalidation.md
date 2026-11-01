---
order: 12
---

# Metadados de cache e invalidação (31/10/2026)

[Evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) mostra como guardar o resultado de uma função para não recalculá-lo. Este capítulo trata da etapa seguinte: um **cache compartilhado** por todos os visitantes de um site (as pessoas que consultam as páginas dele com o seu navegador, o programa que exibe as páginas web, a partir de um servidor, o computador que as envia), em que a verdadeira dificuldade não é guardar uma resposta, mas saber **quando ela deixa de estar certa**. A resposta cabe em três informações, os **metadados de cache**, e em uma maneira de usá-las, a **invalidação**. Dois capítulos vizinhos prolongam o assunto do lado da página: [Carregamento adiado e espaço reservado](/?c=qualite-performance-et-outils&s=performance&p=chargement-differe-et-espace-reserve) (não bloquear uma página por causa de um bloco lento ou próprio da pessoa) e [Redimensionar imagens e servir o WebP](/?c=qualite-performance-et-outils&s=performance&p=redimensionner-des-images-et-servir-du-webp) (aliviar as imagens, a parte mais pesada de muitas páginas).

## Uma entrada de cache e sua chave

Um **cache** é uma reserva onde se guarda o resultado de um trabalho custoso, para entregá-lo de novo sem refazer o trabalho. Uma **entrada** é uma resposta guardada. Ela é encontrada graças à sua **chave**, um texto que funciona como o rótulo de uma gaveta, como o número de um armário. Uma leitura que encontra a entrada é um **acerto** (*cache hit*); uma leitura que não a encontra é uma **falha** (*cache miss*). Nesse caso é preciso **recalcular** a resposta, isto é, refazer o trabalho, antes de guardá-la para a próxima vez. O padrão « procurar; se não achar, calcular e guardar » se chama *cache-aside*; ele é descrito em [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

```text
visitante ──> servidor ──> o cache tem a chave « artigo:7|idioma=pt » ?
                           │
               sim (acerto)│             não (falha)
                   ┌───────┘                   └────────┐
                   v                                    v
           devolve a entrada                   recalcula (lento), guarda,
           (rápido, gratuito)                  depois devolve
```

Dois visitantes que pedem « a mesma página » recebem mesmo a mesma resposta? Nem sempre: a página pode mudar conforme o idioma, conforme o usuário conectado, conforme o endereço pedido. Tudo se decide, portanto, em três perguntas, que os metadados de cache fazem a cada entrada.

## Os três metadados

| Metadado | Pergunta à qual ele responde | Papel | Exemplo | Equivalente HTTP |
|---|---|---|---|---|
| **Contexto** | O que faz a resposta variar? | Entra na **chave**: uma variante por valor | `idioma=pt`, `idioma=en` ; `papel=admin` | Cabeçalho `Vary` (lista os cabeçalhos da requisição que fazem a resposta variar, como o idioma; o endereço pedido já está na chave) |
| **Etiqueta** (*tag*) | De quais dados a resposta depende? | Permite **invalidar** só as entradas afetadas | `artigo:7`, `lista`, `config` | Nenhum padrão (alguns CDNs oferecem um mecanismo próprio do seu produto) |
| **Tempo de vida** (*max-age*) | Por quanto tempo a resposta continua aceitável? | Fixa o instante em que a entrada fica **vencida** por si mesma | 3600 segundos ; 0 = vencida imediatamente (nada reutilizável) | `Cache-Control: max-age=N` |

A palavra [**HTTP**](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) designa a linguagem que um navegador e um servidor web usam para trocar páginas; suas regras de cache (os cabeçalhos `Vary` e `Cache-Control`, linhas de informação anexadas a cada resposta) são descritas na [norma RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (um RFC é um documento de normalização da Internet). Um **CDN** (rede de servidores que guardam cópias das suas páginas perto dos visitantes) aplica as mesmas regras: veja [CDN e transmissão adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative). Um **tempo de vida** também tem o nome de **TTL** (*Time To Live*), explicado em [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

Essas três informações cumprem papéis muito diferentes, por isso vale a pena não confundi-las:

| Se você omitir... | O que acontece | Gravidade |
|---|---|---|
| Um **contexto** | Um visitante recebe a resposta prevista para outro (página em inglês para um leitor francês, dados de outra conta) | Resposta errada para o visitante, às vezes vazamento de dados |
| Uma **etiqueta** | O conteúdo muda, mas a entrada continua servida até o fim do seu tempo de vida | Resposta vencida |
| Um **tempo de vida** | A entrada fica para sempre, ou desaparece cedo demais para servir | Resposta vencida ou cache inútil |

## Um cache com etiquetas, contextos e tempo de vida

O programa abaixo, em [Python](/?c=langages&s=python&p=python), constrói essas três informações de verdade. As medições deste capítulo vêm da sua execução (execução de 31/10/2026). Três noções de Python são usadas aqui: uma **classe** é um molde que reúne dados e as funções que os manipulam (veja [a programação orientada a objetos](/?c=langages&s=python&p=poo)), `self` designa o objeto em curso, e um **conjunto** (`set`) é uma coleção sem repetição (veja [os dicionários e os conjuntos](/?c=langages&s=python&p=dictionnaires-et-ensembles)). Um texto que começa com `f"` insere os valores entre chaves dentro do texto. O **relógio** é simulado: o programa soma segundos em vez de esperar. `hora` é um dicionário, e não uma simples variável: uma função pode alterar o conteúdo de um dicionário, mas não trocar o valor de uma variável definida fora dela sem uma instrução especial. Percorrer um dicionário com `for k in d` dá as suas chaves, `d.items()` dá os seus pares (chave, valor) que `c, e` recebem um a um, e `[x for ... if ...]` constrói uma lista apenas com os elementos retidos. O módulo `threading` (tarefas executadas ao mesmo tempo, veja [o paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) só serve para a seção sobre a rajada.

```python
import random                                  # sorteios ao acaso, para simular visitas
import threading                               # tarefas simultâneas, para a rajada (abaixo)
import time                                    # pausa de 50 ms que simula um cálculo lento


hora = {"t": 0.0}                              # relógio simulado, em segundos


def agora():                                   # devolve a hora simulada
    return hora["t"]                           # evita esperar de verdade


class Cache:                                   # um cache com etiquetas e tempo de vida
    def __init__(self):                        # chamado na criação de um cache
        self.entradas = {}                     # chave -> entrada guardada
        self.acertos = 0                       # leituras que acharam uma entrada válida
        self.falhas = 0                        # leituras que não acharam nada utilizável
        self.calculos = 0                      # recálculos feitos
        self.tempo_calculo = 0.0               # segundos de trabalho simulado gastos

    def chave(self, nome, contexto):           # monta a chave de uma entrada
        valores = [f"{k}={contexto[k]}" for k in sorted(contexto)]  # sorted: ordem fixa
        return "|".join([nome] + valores)      # ex. "artigo:7|idioma=pt"

    def ler(self, nome, contexto):             # procura uma entrada ainda válida
        entrada = self.entradas.get(self.chave(nome, contexto))  # None se a chave faltar
        if entrada is None or entrada["expira_em"] <= agora():  # ausente ou vencida
            self.falhas += 1                   # conta uma falha
            return None                        # nada utilizável
        self.acertos += 1                      # conta um acerto
        return entrada["valor"]                # a resposta guardada

    def escrever(self, nome, contexto, valor, etiquetas, duracao):  # guarda uma resposta
        self.entradas[self.chave(nome, contexto)] = {  # a chave distingue cada variante
            "valor": valor,                    # a resposta
            "etiquetas": set(etiquetas),       # do que ela depende
            "expira_em": agora() + duracao,    # instante de vencimento
        }

    def servir(self, nome, contexto, etiquetas, duracao, custo=0.05):  # ler ou recalcular
        valor = self.ler(nome, contexto)       # primeiro o cache
        if valor is None:                      # falha: é preciso recalcular
            self.calculos += 1                 # um recálculo a mais
            self.tempo_calculo += custo        # ele custa trabalho
            valor = f"resposta de {nome}"      # o resultado do cálculo (simulado)
            self.escrever(nome, contexto, valor, etiquetas, duracao)  # guardamos o resultado
        return valor                           # nos dois casos, devolvemos o valor

    def invalidar(self, etiquetas):            # apaga as entradas que têm a etiqueta
        visadas = set(etiquetas)               # conjunto: coleção sem repetição
        # & mantém os elementos comuns aos dois conjuntos: a entrada é atingida
        # c, e: a chave e a entrada de cada par fornecido por .items()
        mortas = [c for c, e in self.entradas.items() if e["etiquetas"] & visadas]
        for c in mortas:                       # para cada entrada atingida
            del self.entradas[c]               # apagamos a entrada
        return len(mortas)                     # número de entradas apagadas

    def purgar(self):                          # esvazia o cache inteiro
        n = len(self.entradas)                 # quantas entradas havia
        self.entradas.clear()                  # apagamos tudo
        return n                               # número de entradas apagadas
```

Cada entrada guarda, portanto, **três coisas** além do seu valor: suas etiquetas, seu instante de vencimento e sua chave, que contém os contextos. `invalidar` percorre todas as entradas para achar as que têm a etiqueta: é simples e suficiente aqui, mas um cache real mantém antes um índice « etiqueta para chaves » para não percorrer tudo a cada escrita.

## Invalidar por etiqueta em vez de purgar tudo

Uma entrada pode deixar de estar certa de três maneiras, e cada uma pede uma resposta diferente:

| Maneira de retirar uma entrada | Como | Vantagem | Desvantagem |
|---|---|---|---|
| **Expiração** (tempo de vida) | A entrada vence sozinha depois do `max-age` | Nenhuma ação a escrever | A resposta fica errada até o vencimento |
| **Invalidação direcionada** (por etiqueta) | Uma escrita apaga as entradas que têm a etiqueta dos dados alterados | Precisa: só o necessário é recalculado | É preciso ter **etiquetado** corretamente cada entrada |
| **Purga total** | Esvaziamos todo o cache | Simples, nunca resposta vencida | Tudo é recalculado de uma vez |

Experimento: um site de 20 artigos em 2 idiomas, portanto 40 páginas de artigo e 2 páginas de início (a lista dos artigos), o que dá 42 entradas. Depois de 2 000 visitas para encher o cache (o aquecimento), alteramos o artigo 7 e depois observamos 300 visitas. A página de início tem a etiqueta `lista`, porque exibe os títulos; o artigo 7 alterado atinge, portanto, 4 entradas (a página do artigo e a página de início, nos dois idiomas).

```python
IDIOMAS = ["pt", "en"]                         # o contexto « idioma » tem 2 valores
NB_ARTIGOS = 20                                # o site tem 20 artigos


def requisicao(cache, sorteio):                # simula a visita de um leitor
    hora["t"] += 0.01                          # 100 visitas por segundo
    idioma = sorteio.choice(IDIOMAS)           # o idioma do leitor
    n = sorteio.randrange(NB_ARTIGOS)          # inteiro de 0 a 19: o artigo pedido
    if sorteio.random() < 0.3:                 # sorteio entre 0 e 1: 3 vezes em 10
        cache.servir("inicio", {"idioma": idioma}, {"lista"}, 3600)
    else:                                      # senão: a página de um artigo
        cache.servir(f"artigo:{n}", {"idioma": idioma}, {f"artigo:{n}"}, 3600)


def fase(cache, sorteio, quantidade):          # joga `quantidade` visitas e mede
    r0, f0, c0 = cache.acertos, cache.falhas, cache.calculos  # 3 variáveis, 1 linha
    for _ in range(quantidade):                # uma visita por vez
        requisicao(cache, sorteio)             # o leitor chega
    acertos = cache.acertos - r0               # acertos só desta fase
    falhas = cache.falhas - f0                 # falhas só desta fase
    taxa = 100 * acertos / (acertos + falhas)  # porcentagem de acerto
    return taxa, cache.calculos - c0           # taxa e número de recálculos


def ensaio(estrategia):                        # uma experiência completa
    hora["t"] = 0.0                            # o relógio recomeça do zero
    cache, sorteio = Cache(), random.Random(1)  # 2 variáveis, 1 linha; semente 1
    fase(cache, sorteio, 2000)                 # aquecimento: o cache se enche
    taxa, recalculos = fase(cache, sorteio, 300)  # 300 visitas sem modificação
    print(f"{estrategia:<22} sem modif. : {taxa:5.1f} %  recálculos : {recalculos}")
    if estrategia == "invalidação seletiva":   # alteramos o artigo 7...
        removidas = cache.invalidar({"artigo:7", "lista"})  # ...e os que dependem dele
    else:                                      # senão: purga total
        removidas = cache.purgar()             # esvaziamos tudo
    taxa, recalculos = fase(cache, sorteio, 300)  # 300 visitas depois da alteração
    print(f"{'':<22} após modif. : {taxa:5.1f} %  recálculos : {recalculos}"
          f"  (entradas removidas : {removidas})")


ensaio("invalidação seletiva")                 # roda os dois experimentos
ensaio("purga total")
```

Nesse código, `:<22` alinha o texto à esquerda em 22 caracteres e `:5.1f` escreve um número com uma casa depois da vírgula. Os sorteios (`random.Random(1)`) partem de uma **semente**: com a mesma semente, cada execução sorteia os mesmos números, então as duas estratégias recebem exatamente as mesmas visitas.

Resultado obtido:

```text
invalidação seletiva   sem modif. : 100.0 %  recálculos : 0
                       após modif. :  98.7 %  recálculos : 4  (entradas removidas : 4)
purga total            sem modif. : 100.0 %  recálculos : 0
                       após modif. :  86.3 %  recálculos : 41  (entradas removidas : 42)
```

| | Invalidação direcionada | Purga total |
|---|---|---|
| Entradas removidas | 4 de 42 | 42 de 42 |
| Recálculos nas 300 visitas seguintes | 4 | 41 |
| Taxa de acerto depois da alteração | 98,7 % | 86,3 % |

O programa escreve as casas decimais com ponto, à inglesa (`98.7`), e o texto com vírgula (98,7). A purga total remove mais de 10 vezes mais entradas (42 contra 4) para a mesma alteração, e os 41 recálculos que seguem se concentram **no início**: 23 caem nas 50 primeiras visitas e 33 nas 100 primeiras (medido com as mesmas visitas); voltamos a isso adiante.

## Os metadados sobem: juntar e pegar o mínimo

Uma página raramente é uma só entrada: ela é feita de **pedaços** (um cabeçalho, uma lista, um bloco « Olá, Maria »). A página inteira depende de tudo de que depende cada um dos seus pedaços. Os metadados de um pedaço **sobem** então para a página (diz-se que se **propagam**, em inglês *bubbling*) segundo três regras:

| Metadado | Regra de fusão | Por quê |
|---|---|---|
| Contextos | **União** dos contextos de todos os pedaços | Se um pedaço varia com o usuário, a página inteira varia com o usuário |
| Etiquetas | **União** das etiquetas de todos os pedaços | A página deve ser invalidada assim que um dos seus dados muda |
| Tempo de vida | **Mínimo** dos tempos | A página vence assim que o seu pedaço mais frágil vencer |

```python
def fundir(*filhos):                           # *filhos: quantos pedaços quisermos
    return {                                   # cada pedaço tem seus próprios metadados
        "contextos": set().union(*(e["contextos"] for e in filhos)),  # união dos contextos
        "etiquetas": set().union(*(e["etiquetas"] for e in filhos)),  # idem
        "duracao": min(e["duracao"] for e in filhos),  # a duração mais curta prevalece
    }


def exibir(meta):                              # mostra: contextos | etiquetas | duração
    contextos = sorted(meta["contextos"])      # ordena para uma exibição estável
    etiquetas = sorted(meta["etiquetas"])      # idem
    print(f"{contextos} | {etiquetas} | duração {meta['duracao']}")  # colunas separadas por |


cabecalho = {"contextos": {"idioma"}, "etiquetas": {"config"}, "duracao": 3600}
lista = {"contextos": {"idioma"}, "etiquetas": {"artigo:7", "lista"}, "duracao": 600}
saudacao = {"contextos": {"usuario"}, "etiquetas": {"usuario:42"}, "duracao": 3600}
exibicao_hora = {"contextos": set(), "etiquetas": set(), "duracao": 0}  # « hora exata »

exibir(fundir(cabecalho, lista))               # página sem contexto por usuário
exibir(fundir(cabecalho, lista, saudacao))     # um bloco por usuário se acrescenta
exibir(fundir(cabecalho, lista, exibicao_hora))  # um bloco de duração 0 se acrescenta
```

Em `fundir`, `set()` cria um conjunto vazio, e `.union(a, b, ...)` devolve a união de vários conjuntos. A expressão `(e["contextos"] for e in filhos)` produz um conjunto por pedaço, e o `*` na frente dela os desempacota em argumentos separados para `union`.

Resultado obtido:

```text
['idioma'] | ['artigo:7', 'config', 'lista'] | duração 600
['idioma', 'usuario'] | ['artigo:7', 'config', 'lista', 'usuario:42'] | duração 600
['idioma'] | ['artigo:7', 'config', 'lista'] | duração 0
```

Cada linha dá os contextos, as etiquetas e depois a duração da página fundida. Leia as três linhas de cima para baixo. Um único pedaço que varia conforme o usuário (`saudacao`) faz variar a página inteira: ela deixa de ser compartilhada entre leitores. Um único pedaço de duração 0 (`exibicao_hora`, que mostra a hora exata) torna **a página inteira** impossível de guardar. É uma armadilha clássica de eficiência: um pequeno bloco dinâmico arruína o cache de uma página de cem blocos.

> **Armadilha:** deixar um detalhe de exibição (a hora, um contador de visitantes) impor uma duração de 0 a uma página inteira. Isole esse detalhe em um pedaço próprio, carregado à parte, para que o resto da página continue guardável.

## A invalidação a cada escrita: a armadilha

Uma **escrita** é todo evento que altera dados: um comentário publicado, um artigo modificado, um produto adicionado ao carrinho. Para que o cache continue correto, cada escrita invalida as entradas que dependem dela. Tudo depende então da **largura** do que ela invalida e da **frequência** das escritas.

Imaginemos que cada página de artigo exiba um bloco « últimos comentários ». Duas maneiras de etiquetá-lo:

| Variante | Etiquetas da página do artigo | O que um comentário invalida |
|---|---|---|
| **ampla** | `artigo:N` **e** `comentarios` na página inteira | Todas as páginas de artigo de todos os idiomas |
| **fragmento** | `artigo:N` na página ; `comentarios` no bloco, carregado à parte (requisição separada): ele tem a sua própria entrada, de custo baixo, e não é fundido na da página | Só o bloco |

O programa mede 1 000 visitas (10 segundos simulados, 100 visitas por segundo), com uma escrita a cada `k` visitas. A **carga** é o tempo total de cálculo dividido pelos 10 segundos: a 100 %, o servidor passa todo o seu tempo recalculando; acima de 100 %, ele não dá conta mais e os visitantes esperam. Uma página custa 0,05 s para recalcular, um bloco de comentários 0,005 s.

```python
def visita(cache, sorteio, variante):          # uma visita a uma página de artigo
    hora["t"] += 0.01                          # 100 visitas por segundo
    n = sorteio.randrange(NB_ARTIGOS)          # o artigo pedido
    contexto = {"idioma": sorteio.choice(IDIOMAS)}  # o idioma do leitor
    if variante == "ampla":                    # a página também depende dos comentários
        cache.servir(f"artigo:{n}", contexto, {f"artigo:{n}", "comentarios"}, 3600)
    else:                                      # « fragmento »: bloco carregado à parte
        cache.servir(f"artigo:{n}", contexto, {f"artigo:{n}"}, 3600)
        cache.servir("comentarios", contexto, {"comentarios"}, 3600, custo=0.005)


def carga(variante, escrita_a_cada):           # 1000 visitas, uma escrita a cada k
    hora["t"] = 0.0                            # o relógio recomeça do zero
    cache, sorteio = Cache(), random.Random(2)  # semente 2: sorteios reproduzíveis
    for i in range(1, 1001):                   # 1000 visitas = 10 segundos simulados
        visita(cache, sorteio, variante)       # um leitor chega
        if escrita_a_cada and i % escrita_a_cada == 0:  # % : resto da divisão
            cache.invalidar({"comentarios"})   # invalida a etiqueta « comentarios »
    taxa = 100 * cache.acertos / (cache.acertos + cache.falhas)  # acerto global
    return taxa, cache.calculos, cache.tempo_calculo / 10 * 100  # carga em % de 10 s


print(f"{'escrita':<14}{'variante':<10}{'acerto':>9}{'recálculos':>12}{'carga':>9}")
for k in (None, 100, 20, 5, 2):                # de « nunca » a « uma visita em duas »
    for variante in ("ampla", "fragmento"):    # etiqueta na página, ou em um bloco
        taxa, calculos, percentual = carga(variante, k)  # rodamos o experimento
        escrita = "nenhuma" if k is None else f"1 a cada {k}"  # rótulo da linha
        print(f"{escrita:<14}{variante:<10}{taxa:>8.1f}%{calculos:>12}{percentual:>8.0f}%")
```

No `if` de `carga`, `None` (sem escrita) conta como falso, portanto a condição é falsa. Nas `f"..."` da exibição, `>` alinha à direita (`<` à esquerda) e `.0f` escreve um número sem casas decimais.

Resultado obtido:

```text
escrita       variante     acerto  recálculos    carga
nenhuma       ampla         96.0%          40      20%
nenhuma       fragmento     97.9%          42      20%
1 a cada 100  ampla         62.7%         373     187%
1 a cada 100  fragmento     97.0%          60      21%
1 a cada 20   ampla         21.6%         784     392%
1 a cada 20   fragmento     93.0%         140      25%
1 a cada 5    ampla          5.2%         948     474%
1 a cada 5    fragmento     78.8%         423      39%
1 a cada 2    ampla          1.6%         984     492%
1 a cada 2    fragmento     61.8%         765      56%
```

| Escrita | Carga « ampla » | Carga « fragmento » |
|---|---|---|
| Nenhuma (cache vazio no início: só os primeiros recálculos) | 20 % | 20 % |
| 1 visita em 100 (um comentário por segundo) | **187 %** | 21 % |
| 1 visita em 20 | 392 % | 25 % |
| 1 visita em 5 | 474 % | 39 % |
| 1 visita em 2 | 492 % | 56 % |

Um único comentário por segundo faz o servidor passar de 20 % para 187 % de carga com a variante ampla: o cache se esvazia mais depressa do que se enche. A taxa de acerto cai para 62,7 % (uma escrita a cada 100 visitas), depois para 1,6 % (uma a cada 2): nesse último caso, quase toda visita dispara um recálculo completo. O cache continua existindo, mas já não serve para nada.

### Da lentidão à negação de serviço

Se a escrita está **aberta a qualquer pessoa** (formulário de comentário, botão « curtir », adição ao carrinho, envio de um formulário de contato), um terceiro mal-intencionado, ou um simples robô exagerado, pode produzir a frequência de escritas que esvazia o cache, com uma **requisição** (um pedido enviado ao servidor) **barata** que provoca recálculos **caros**: é uma **amplificação**. O servidor satura sem que nenhuma requisição seja enorme; é uma **negação de serviço de aplicação** (tornar o serviço inutilizável pela carga que lhe é imposta, sem quebrar a rede). Este capítulo não detalha os ataques: o catálogo das famílias de sobrecarga, com suas defesas, está em [Sobrecarga e negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

| Defesa | Princípio | Efeito na experiência |
|---|---|---|
| **Etiquetas finas** | Um pedaço só carrega as etiquetas de que realmente depende | Variante « fragmento »: 187 % passa a 21 % |
| **Limitar a frequência das escritas** | Um número máximo de escritas por usuário e por minuto | Limita a frequência `k` |
| **Agrupar as invalidações** | Invalidar no máximo uma vez por segundo, e não a cada escrita | Qualquer que seja o número de escritas, uma só limpeza por intervalo |
| **Servir a resposta antiga durante o recálculo** | A entrada vencida continua servida enquanto um só visitante a refaz | Nenhuma rajada de recálculos (veja adiante) |
| **Reservar as escritas às contas identificadas** | Nenhuma escrita anônima sobre o que invalida um cache amplo | Reduz os possíveis autores |

## Contextos finos demais

O erro inverso de esquecer um contexto é declarar **demais**, ou escolher um contexto com valores numerosos demais. Como cada valor de contexto cria uma variante da chave, o número de entradas possíveis é o **produto** do número de páginas pelo número de valores de cada contexto:

```text
entradas possíveis = páginas × (valores do contexto 1) × (valores do contexto 2) × ...
```

Experimento: 20 artigos, 50 leitores conectados (2 idiomas, 3 papéis), 3 000 visitas. Só com o idioma como contexto, há 20 × 2 = 40 chaves possíveis; com o identificador do leitor, até 20 × 50 = 1 000.

```python
USUARIOS = 50                                  # 50 leitores conectados diferentes
PAPEIS = ["leitor", "editor", "admin"]         # o papel de um leitor (3 valores)


def trafego_contextos(nomes):                  # 3000 visitas com esses contextos
    hora["t"] = 0.0                            # o relógio recomeça do zero
    cache, sorteio = Cache(), random.Random(3)  # semente 3: sorteios reproduzíveis
    for _ in range(3000):                      # 3000 visitas
        hora["t"] += 0.01                      # 100 visitas por segundo
        u = sorteio.randrange(USUARIOS)        # quem visita
        conhecido = {                          # o que a requisição sabe sobre o leitor
            "idioma": IDIOMAS[u % 2],          # o idioma dele (resto de u dividido por 2)
            "papel": PAPEIS[u % 3],            # o papel dele (resto da divisão de u por 3)
            "usuario": f"u{u}",                # o identificador dele
        }
        contexto = {nome: conhecido[nome] for nome in nomes}  # só os contextos declarados
        n = sorteio.randrange(NB_ARTIGOS)      # o artigo pedido
        cache.servir(f"artigo:{n}", contexto, {f"artigo:{n}"}, 3600)
    taxa = 100 * cache.acertos / (cache.acertos + cache.falhas)  # acerto global
    return taxa, len(cache.entradas), cache.calculos  # taxa, entradas guardadas, recálculos


print(f"{'contextos':<24}{'acerto':>9}{'entradas':>10}{'recálculos':>12}")
for nomes in (["idioma"], ["idioma", "papel"], ["usuario"]):  # do mais amplo ao mais fino
    taxa, entradas, calculos = trafego_contextos(nomes)  # rodamos o experimento
    print(f"{' + '.join(nomes):<24}{taxa:>8.1f}%{entradas:>10}{calculos:>12}")
```

Resultado obtido:

```text
contextos                  acerto  entradas  recálculos
idioma                      98.7%        40          40
idioma + papel              96.0%       120         120
usuario                     68.3%       950         950
```

| Contextos | Entradas guardadas | Taxa de acerto | Leitura |
|---|---|---|---|
| `idioma` | 40 | 98,7 % | Poucas variantes, cada uma muito reutilizada |
| `idioma + papel` | 120 | 96,0 % | Um pouco mais de variantes, ainda eficaz |
| `usuario` | 950 | 68,3 % | Quase uma entrada por visitante: cada entrada serve pouco antes de ser esquecida |

No último caso, o cache **funciona** (nunca se engana), mas **quase não serve mais**: 950 recálculos para 3 000 visitas, contra 40. Além disso, ele ocupa mais memória. A regra: escolher como contexto a **categoria** que realmente faz a resposta variar (o idioma, o papel) e nunca a identidade da pessoa se a página não depende dela; um bloco que realmente depende do usuário fica isolado no seu próprio pedaço (veja a fusão acima), para que o resto da página continue compartilhado.

## A rajada sobre o cache vazio

Quando uma entrada muito pedida desaparece (invalidada, vencida, ou depois de uma reinicialização), os visitantes que chegam durante o seu recálculo a encontram todos ausente. Se cada um dispara o recálculo por conta própria, o servidor recebe **uma rajada de cálculos idênticos**: é a **rajada sobre o cache vazio** (*cache stampede*). Esse fenômeno agrava a sobrecarga da seção anterior: quanto mais lento for o recálculo, mais visitantes chegam antes que ele termine.

O experimento lança 20 **fios de execução** (*threads*; um fio é uma sequência de instruções que roda ao mesmo tempo que outras, veja [Paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) que pedem a mesma chave vazia no mesmo instante. Uma **trava** (*lock*) é um objeto que um só fio por vez pode segurar: os outros esperam que ela seja liberada. Aqui, o fio que segura a trava recalcula; os outros, quando entram por sua vez, encontram a resposta já guardada e não recalculam. As funções do módulo `threading` estão descritas na [documentação oficial do Python](https://docs.python.org/3/library/threading.html). No código: `Thread(target=f)` cria um fio que executará `f`, `start()` o inicia, `join()` espera o seu fim; `Barrier(n)` faz cada fio esperar a chegada de `n` fios e então libera todos juntos; `time.sleep(0.05)` suspende o fio por 50 milissegundos (0,05 s) para simular um cálculo lento; `with trava:` segura a trava durante o bloco; `setdefault(chave, valor)` devolve o valor da chave, criando-o se faltar. Uma segunda trava protege o contador de recálculos: se dois fios somassem 1 ao mesmo tempo, uma das somas poderia se perder. Por fim, `calcular` e `leitor` são funções definidas dentro de `rajada`: assim podem usar as suas variáveis (`cache`, `contador`, `travas`).

```python
def rajada(com_trava, fios=20):                # `fios` leitores chegam a uma chave vazia
    cache = Cache()                            # um cache vazio: todo mundo erra
    contador = {"n": 0}                        # recálculos realmente disparados
    trava_contador = threading.Lock()          # protege o contador compartilhado
    travas = {}                                # uma trava por chave
    partida = threading.Barrier(fios)          # todos os fios partem ao mesmo tempo

    def calcular():                            # o cálculo lento
        with trava_contador:                   # só um fio altera o contador por vez
            contador["n"] += 1                 # um recálculo a mais
        time.sleep(0.05)                       # 50 ms de trabalho
        return "página popular"                # o resultado

    def leitor():                              # o que faz cada fio
        partida.wait()                         # espera todos estarem prontos
        if cache.ler("inicio", {}) is not None:  # entrada presente?
            return                             # sim: nada a fazer
        if com_trava:                          # variante protegida
            trava = travas.setdefault("inicio", threading.Lock())  # trava da chave
            with trava:                        # só um fio por vez entra aqui
                if cache.ler("inicio", {}) is None:  # outro talvez já tenha preenchido
                    cache.escrever("inicio", {}, calcular(), {"lista"}, 60)
        else:                                  # variante ingênua: cada um recalcula
            cache.escrever("inicio", {}, calcular(), {"lista"}, 60)

    lista_fios = [threading.Thread(target=leitor) for _ in range(fios)]  # cria os fios
    for f in lista_fios:                       # inicia cada fio
        f.start()
    for f in lista_fios:                       # espera o fim de cada fio
        f.join()
    return contador["n"]                       # número de recálculos disparados


print("sem trava :", rajada(False), "recálculos para 20 leitores")
print("com trava :", rajada(True), "recálculo para 20 leitores")
```

Resultado obtido:

```text
sem trava : 20 recálculos para 20 leitores
com trava : 1 recálculo para 20 leitores
```

Vinte recálculos idênticos sem trava, um só com ela. Existem outras defesas, que se somam a esta:

| Defesa | Princípio | Contra o quê |
|---|---|---|
| **Trava por chave** | Um só visitante recalcula, os outros esperam o resultado | Rajada de recálculos idênticos |
| **Servir a resposta vencida durante o recálculo** (*stale-while-revalidate*, veja [Bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | O valor antigo continua servido alguns segundos | Latência vista pelos visitantes |
| **Variar o tempo de vida** | Acrescentar uma **gigue** (*jitter*, variação aleatória) de ± 10 % ao `max-age` de cada entrada | Vencimentos simultâneos (veja abaixo) |
| **Pré-aquecer** | Recalcular antecipadamente as páginas populares depois de uma purga | Primeiros visitantes lentos |

A variação do tempo de vida evita outro caso de rajada: entradas **gravadas juntas** com a **mesma duração** vencem **juntas**. O experimento grava 1 000 entradas no mesmo instante, com uma duração nominal de 60 segundos.

`random.uniform(a, b)` sorteia um número ao acaso entre `a` e `b`; `int(x)` guarda sua parte inteira, aqui o segundo em que a entrada vence.

```python
def expiracoes_por_segundo(variacao):          # 1000 entradas gravadas juntas
    sorteio = random.Random(4)                 # semente 4: sorteios reproduzíveis
    por_segundo = {}                           # segundo -> entradas que expiram
    for _ in range(1000):                      # 1000 entradas
        duracao = 60 * sorteio.uniform(1 - variacao, 1 + variacao)  # 60 s, ± variação
        segundo = int(duracao)                 # segundo de expiração (escrita em 0)
        por_segundo[segundo] = por_segundo.get(segundo, 0) + 1  # contamos
    return max(por_segundo.values())           # o pico de expirações em um segundo


print("sem variação :", expiracoes_por_segundo(0.0), "expirações no mesmo segundo")
print("± 10 %       :", expiracoes_por_segundo(0.1), "expirações no máximo por segundo")
```

Resultado obtido:

```text
sem variação : 1000 expirações no mesmo segundo
± 10 %       : 104 expirações no máximo por segundo
```

Sem variação, as 1 000 entradas vencem no mesmo segundo; com ± 10 %, no máximo 104 por segundo, ou seja, dez vezes menos.

## Um exemplo em um framework: Drupal

Um **framework** é uma base de código pronta sobre a qual se constrói uma aplicação. [Drupal](https://www.drupal.org/docs/drupal-apis/cache-api/cache-api), um sistema de gestão de conteúdo (um programa para publicar e organizar páginas) escrito em [PHP](/?c=langages&s=php&p=php), aplica as três informações deste capítulo com nomes próprios: os **contextos** (*cache contexts*), as **etiquetas** (*cache tags*) e o **tempo de vida** (*max-age*), que ele faz **subir** de cada pedaço para a página segundo as regras de fusão vistas acima.

> Os nomes de contextos, etiquetas e funções desta seção são verificados no código-fonte do Drupal 11.x.

Em PHP, `[ chave => valor ]` cria um array associativo (como um dicionário Python), e `=>` associa uma chave ao seu valor. `\Drupal\Core\Cache\Cache::invalidateTags(...)` chama a função `invalidateTags` da classe `Cache`, guardada no espaço de nomes `\Drupal\Core\Cache` (um nome de pasta que evita colisões de nomes); `::` chama uma função ligada à classe, sem criar um objeto.

```php
<?php
// Um « array de renderização »: a descrição de um pedaço da página.
$renderizacao = [
    '#markup' => 'Lista de artigos',                      // o conteúdo a exibir
    '#cache' => [                                         // os metadados de cache
        'contexts' => ['languages:language_interface', 'user.roles'],  // varia conforme...
        'tags' => ['node:7', 'node_list'],                // depende de...
        'max-age' => 3600,                                // tempo de vida, em segundos
    ],
];

// Depois de salvar o conteúdo número 7: invalidamos as suas etiquetas.
\Drupal\Core\Cache\Cache::invalidateTags(['node:7', 'node_list']);
```

| Noção do capítulo | Escrita neste exemplo | Observação |
|---|---|---|
| Contexto | `languages:language_interface`, `user.roles` | A resposta varia conforme o idioma da interface e conforme os papéis do usuário |
| Etiqueta | `node:7`, `node_list` | `node` é o nome que o Drupal dá a um conteúdo; `node_list` é a etiqueta das listas de conteúdos |
| Tempo de vida | `'max-age' => 3600` | Em segundos; um valor de 0 proíbe guardar a resposta |
| Invalidação direcionada | `Cache::invalidateTags(['node:7', 'node_list'])` | Apaga as entradas que têm uma destas etiquetas, como `invalidar` acima |

O modelo é o mesmo que em Python: declarar do que um pedaço depende, deixar o framework fundir e invalidar. As armadilhas deste capítulo se aplicam a ele tal qual: um pedaço de duração 0 arruína a página inteira, e uma etiqueta ampla demais (`node_list` em cada página) transforma cada alteração de conteúdo em uma purga maciça.

## Onde fica o cache

Os mesmos três metadados aparecem em cada etapa da cadeia que leva do visitante aos dados:

| Etapa | Quem guarda a cópia | Quem decide invalidá-la |
|---|---|---|
| Navegador do visitante | O navegador | Sobretudo o tempo de vida; não é possível alcançá-lo a partir do servidor |
| CDN | Uma rede de servidores próximos aos visitantes ([CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative)) | Uma purga pedida ao CDN, ou o tempo de vida |
| Aplicação | A memória do servidor ou um serviço dedicado como [Redis](/?c=donnees&s=bases-de-donnees&p=redis) | O código da aplicação, por etiqueta |
| Antes do banco de dados | O resultado de uma consulta cara, guardado para não repeti-la ([Bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | O código da aplicação, ou o tempo de vida |

Um cache serve sobretudo para evitar idas e vindas caras; quando não há nada a guardar, [Limitar as idas e vindas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) mostra como agrupá-las.

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Nenhum contexto quando a resposta varia | Um visitante recebe a resposta de outro, às vezes os seus dados | Declarar cada fator de variação na chave |
| Um contexto fino demais (o identificador do usuário) | Quase uma entrada por visitante, o cache deixa de servir (68 % em vez de 99 % no experimento) | Escolher a categoria (idioma, papel), isolar o bloco pessoal |
| Nenhuma etiqueta, só uma duração | Uma alteração fica invisível até o vencimento | Etiquetar por dado e invalidar na escrita |
| Uma etiqueta ampla demais | Cada escrita esvazia um cache inteiro: 187 % de carga para um comentário por segundo | Etiquetas finas, blocos separados |
| Purga total « por garantia » | 42 entradas removidas em vez de 4, 41 recálculos em vez de 4 | Invalidação direcionada por etiqueta |
| Um pedaço de duração 0 numa página | A duração mínima sobe: a página inteira fica impossível de guardar | Isolar o pedaço dinâmico, carregá-lo à parte |
| Escrita aberta a todos que invalida um cache amplo | Amplificação: requisição barata, recálculos caros, negação de serviço de aplicação | Limitar as escritas, agrupar as invalidações |
| Mesma duração em entradas gravadas juntas | Vencem juntas e provocam uma rajada | Variar a duração (± 10 %) |
| Vários visitantes recalculando a mesma chave | Rajada sobre o cache vazio: 20 recálculos em vez de um | Trava por chave, ou servir o valor antigo durante o recálculo |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Declarar, para cada entrada, seus contextos, suas etiquetas e sua duração desde a criação | As três informações raramente faltam juntas, mas cada uma que falta cria um defeito diferente |
| Escolher os contextos mais **grossos** que bastam | Menos variantes, mais acertos |
| Etiquetar cada entrada com **todos** os dados de que ela depende, e nada mais | Invalidar o suficiente, sem apagar o que não mudou |
| Separar os pedaços que mudam com frequência do resto da página | Um pedaço frágil não arruína os outros |
| Invalidar por etiqueta, nunca por purga total, fora de incidente | O custo acompanha a amplitude da mudança |
| Medir a taxa de acerto e o número de recálculos depois de cada escrita | Um cache esvaziado com frequência demais aparece nos números antes de aparecer nos visitantes |
| Limitar a frequência das escritas que invalidam, e agrupar as suas invalidações | Corta a amplificação em negação de serviço |
| Trava por chave e variação da duração | Evita rajadas de recálculos idênticos |
| Medir primeiro (veja [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) antes de generalizar um cache | Ele complica o código: precisa ganhar um tempo real |

## O que reter

| | |
|---|---|
| **Para lembrar** | Uma entrada de cache é encontrada por uma **chave** e carrega três **metadados**: o **contexto** (o que faz a resposta variar: idioma, papel; entra na chave), a **etiqueta** (do que ela depende, para invalidar de forma direcionada) e o **tempo de vida** (`max-age`, depois do qual ela vence). Os metadados de uma página composta **sobem**: união dos contextos, união das etiquetas, mínimo das durações. A invalidação por etiqueta apaga só o necessário (4 entradas de 42, 98,7 % de acerto depois), onde a purga total apaga tudo (86,3 %, 41 recálculos). Uma escrita frequente que invalida um cache amplo o esvazia mais depressa do que ele se enche: 187 % de carga para um comentário por segundo, contra 21 % com um bloco separado. Aberta a terceiros, essa escrita vira uma negação de serviço de aplicação, detalhada em [Sobrecarga e negação de serviço em nível de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Um contexto fino demais (um por usuário) deixa um cache correto, mas inútil (68,3 %). A rajada sobre o cache vazio (20 recálculos idênticos) se corta com uma trava por chave e com um tempo de vida variado. |
| **Armadilhas a evitar** | Contexto esquecido (resposta de outro visitante); contexto fino demais; duração sem etiqueta; etiqueta ampla demais; purga total sistemática; pedaço de duração 0 numa página; escrita pública que invalida um cache amplo; durações idênticas em entradas gravadas juntas; recálculos concorrentes da mesma chave. |
| **Boas práticas** | Declarar contextos, etiquetas e duração na criação; contextos grossos; etiquetas exatas; pedaços separados para o que muda com frequência; invalidação direcionada; limitar e agrupar as escritas que invalidam; trava por chave e duração variada; medir a taxa de acerto e os recálculos. |
