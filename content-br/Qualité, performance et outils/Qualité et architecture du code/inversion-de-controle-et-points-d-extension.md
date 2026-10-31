---
order: 14
---

# Inversão de controle e pontos de extensão: hooks, eventos, dependência opcional

Em um pequeno programa, é o seu código que decide tudo: ele inicia, chama funções e depois para. Em uma aplicação construída sobre um **framework** (uma grande base de código já escrita, que fornece o esqueleto da aplicação: recepção das requisições, exibição, gravação dos dados), acontece o contrário. Você escreve apenas alguns trechos, e é o framework que decide quando executá-los. Essa inversão se chama **inversão de controle**. Este capítulo a explica com pequenos programas que você pode copiar, depois mostra como criar seus próprios pontos de conexão e como depender de outro módulo sem quebrar a aplicação quando ele estiver ausente.

## A ideia: deixar de chamar, passar a ser chamado

Uma **biblioteca** é um conjunto de funções que você chama quando precisa delas. Já um framework chama o seu código. Costuma-se resumir isso na frase « não nos chame, nós chamaremos você ».

| | Biblioteca | Framework |
|---|---|---|
| Quem inicia o programa | Seu código | O framework |
| Quem decide a ordem das chamadas | Você | O framework |
| O que você escreve | Chamadas de funções | Trechos que o framework chama de volta |
| Analogia | Você cozinha com utensílios | Você entrega uma receita ao restaurante, e a cozinha a executa quando chega um pedido |

```text
Sem inversão de controle           Com inversão de controle

  seu código ──chama──> ferramenta        framework ──chama──> seu código
  (você decide quando)                    (ele decide quando, você declara o quê)
```

O ganho: o framework pode acrescentar, substituir ou remover trechos sem alterar os outros. A contrapartida: para que o framework conheça o seu código, é preciso **declará-lo** a ele.

## O que se declara: rota, hook, serviço, plugin

Uma **declaração** é uma informação dada ao framework (em um arquivo de configuração ou por uma convenção de nomes) que diz « quando tal situação acontecer, chame isto ».

| O que você declara | Situação que dispara a chamada | Exemplo genérico |
|---|---|---|
| Uma **rota** | Um endereço é solicitado por um visitante | `/ola` chama a função `exibirOla` |
| Um **hook** (gancho) | O framework chega a um momento preciso do seu trabalho | « antes de exibir uma página », « todas as noites » |
| Um **assinante de evento** | Um evento é anunciado por outro trecho de código | « um pedido acaba de ser criado » |
| Um **serviço** | Um trecho de código precisa de uma funcionalidade compartilhada | Um serviço de envio de e-mails |
| Um **plugin** | O framework procura um componente de um tipo preciso | Um novo tipo de bloco de exibição |

Os serviços (e o contêiner que os fabrica) e as arquiteturas com plugins têm capítulos próprios: aqui tratamos apenas das rotas, dos hooks, dos eventos e da dependência entre módulos. O mecanismo de [injeção de dependências](/?c=langages&s=php&p=poo) (receber um objeto de fora em vez de criá-lo você mesmo) é a mesma ideia aplicada aos objetos.

## Primeiro exemplo: uma rota declarada

Este pequeno núcleo memoriza rotas (uma **rota** associa um endereço à função que lhe responde) e chama a função certa. Os elementos de sintaxe PHP usados são descritos logo a seguir.

```php
<?php
final class Nucleo
{
    private array $rotas = [];  // registro : endereço => função a chamar

    public function rota(string $endereco, callable $acao): void
    {
        $this->rotas[$endereco] = $acao;  // o projeto declara, o núcleo memoriza
    }

    public function tratar(string $endereco): string
    {
        $acao = $this->rotas[$endereco] ?? fn() => 'Erro 404';  // alternativa se desconhecida
        return $acao();  // é o núcleo que chama o código do projeto
    }
}

$nucleo = new Nucleo();
$nucleo->rota('/ola', fn() => 'Olá, mundo');  // declaração do lado do projeto
echo $nucleo->tratar('/ola'), "\n";  // o núcleo encontra e chama a função
echo $nucleo->tratar('/ausente'), "\n";  // nenhuma declaração: alternativa 404
```

Resultado obtido na execução:

```text
Olá, mundo
Erro 404
```

| Sintaxe PHP | Significado |
|---|---|
| `final class` | Classe que nenhuma outra classe pode estender (ver [a POO em PHP](/?c=langages&s=php&p=poo)) |
| `private array $rotas = []` | Propriedade oculta de fora, do tipo array, vazia no início |
| `callable` | Tipo de um valor que se pode chamar como uma função |
| `fn() => 'texto'` | Função anônima curta: não tem nome e devolve o valor depois da seta |
| `$a ?? $b` | Vale `$a` se existir, senão `$b` |
| `$acao()` | Chama a função guardada na variável `$acao` |

O projeto não contém nenhum `tratar()`: ele apenas chama `rota()`. A chamada de sua função é totalmente decidida pelo núcleo.

## O hook: uma convenção de nomes

Um **hook** é um ponto preciso do trabalho do framework em que cada módulo pode se conectar. No estilo mais simples, o framework procura funções cujo nome segue uma regra: `<nome do módulo>_<nome do hook>`. Um **módulo** é, aqui, um pacote de código que se ativa ou desativa.

```php
<?php
function blog_cron(): string { return 'blog : limpeza dos rascunhos'; }
function stats_cron(): string { return 'stats : cálculo do relatório'; }

$modulos = ['blog', 'stats', 'galeria'];  // módulos ativados (galeria não tem cron)
foreach ($modulos as $modulo) {
    $gancho = $modulo . '_cron';  // nome construído: módulo + '_' + nome do hook
    if (function_exists($gancho)) {  // o módulo escreveu esta função?
        echo $gancho(), "\n";  // chamada de uma função cujo nome está em $gancho
    }
}
```

Resultado:

```text
blog : limpeza dos rascunhos
stats : cálculo do relatório
```

O hook `cron` (uma tarefa executada em intervalos regulares, veja [a automação](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow)) é chamado para `blog` e `stats`. O módulo `galeria` não escreveu nada: `function_exists` (que responde `true` se existir uma função com esse nome) evita o erro e o módulo é ignorado. Nenhuma declaração era necessária: o nome da função basta.

O mesmo princípio, aplicado aos assistentes de inteligência artificial, é descrito em [os hooks de um agente LLM](/?c=ia&s=configuration-de-llms&p=hooks).

## O assinante de evento e sua prioridade

Um **evento** é o anúncio « algo acaba de acontecer » (um pedido é criado). Os trechos de código interessados se **inscrevem**: fornecem uma função, chamada a cada anúncio. Em uma página web, `addEventListener` cumpre esse papel (veja [o DOM e o gerenciamento de eventos](/?c=langages&s=javascript&p=dom-et-evenements)). Quando vários assinantes escutam o mesmo evento, a ordem importa: ela é definida com uma **prioridade**, um número inteiro. O maior passa primeiro.

```js
class Despachante {
  constructor() {
    this.ouvintes = new Map();  // nome do evento => lista de ouvintes
  }

  inscrever(evento, ouvinte, prioridade = 0) {
    const lista = this.ouvintes.get(evento) ?? [];  // lista existente ou vazia
    lista.push({ ouvinte, prioridade });  // acrescentamos o ouvinte com sua prioridade
    lista.sort((a, b) => b.prioridade - a.prioridade);  // maior prioridade primeiro
    this.ouvintes.set(evento, lista);  // guardamos a lista ordenada
  }

  despachar(evento, carga) {
    for (const { ouvinte } of this.ouvintes.get(evento) ?? []) {
      if (ouvinte(carga) === false) {  // um ouvinte responde false: paramos
        return false;
      }
    }
    return true;  // todos os ouvintes passaram
  }
}

const despachante = new Despachante();
despachante.inscrever('pedido.criado', (c) => console.log('registro :', c.id), -10);
despachante.inscrever('pedido.criado', (c) => console.log('e-mail para', c.cliente));
despachante.inscrever('pedido.criado', (c) => c.cliente !== 'banido', 100);

console.log(despachante.despachar('pedido.criado', { id: 1, cliente: 'Alice' }));
console.log(despachante.despachar('pedido.criado', { id: 2, cliente: 'banido' }));
```

Resultado:

```text
e-mail para Alice
registro : 1
true
false
```

| Termo JavaScript | Significado |
|---|---|
| `Map` | Dicionário: associa uma chave (aqui o nome do evento) a um valor |
| `carga` | Carga útil: os dados anexados ao anúncio (aqui o pedido) |
| `lista.sort((a, b) => ...)` | Ordena a lista; a função compara dois elementos, `b - a` dá a ordem decrescente |
| `for (const { ouvinte } of ...)` | Percorre a lista extraindo o campo `ouvinte` de cada elemento |

Para Alice, o ouvinte de prioridade 100 (verificação) responde `true`, depois o de prioridade 0 envia o e-mail, e em seguida o de prioridade -10 grava o registro. Para o cliente banido, a verificação responde `false`: os outros dois nunca são chamados. Dois ouvintes com a mesma prioridade são executados na ordem de inscrição, pois a ordenação do JavaScript é estável (ela não reordena elementos iguais).

## Hook ou evento: qual escolher

| | Hook (convenção de nome) | Assinante de evento |
|---|---|---|
| Como o código é encontrado | O framework procura o nome `módulo_hook` | O código se inscreve explicitamente |
| Ordem de execução | Ordem dos módulos (muitas vezes um peso configurável) | Prioridade fixada na inscrição |
| Interromper o restante | Raramente possível | Possível (a propagação para) |
| O que é transmitido | Os argumentos da função | Um objeto de evento, modificável |
| Forma típica | Funções procedurais | Classes ou funções anônimas |

As duas servem à mesma ideia. Um framework antigo costuma usar hooks, um framework recente prefere os eventos, e muitos oferecem as duas opções.

## Criar seu próprio ponto de extensão: `invokeAll` e `alter`

Um framework não tem o monopólio dos pontos de conexão: o seu próprio módulo pode declarar alguns, para que outros módulos se conectem a eles sem alterá-lo. Duas formas muito comuns:

| Forma | Papel | Valor devolvido |
|---|---|---|
| `invokeAll(hook, args)` | Chama **todas** as implementações do hook e reúne as respostas | Um array: uma resposta por módulo |
| `alter(hook, dados)` | Entrega o dado **já construído** a cada módulo, que pode modificá-lo | Nada: o dado é modificado no lugar |

`invokeAll` serve para **coletar** (cada módulo traz links de menu). `alter` serve para **retocar** o resultado final (um módulo retira um deles).

```php
<?php
function blog_menu_links(): array { return ['inicio' => '/', 'blog' => '/blog']; }
function stats_menu_links(): array { return ['stats' => '/stats']; }
function prive_menu_links_alter(array &$links): void { unset($links['stats']); }

final class GerenciadorModulos
{
    public function __construct(private array $modulos) {}  // módulos ativados

    public function invokeAll(string $gancho, array $args = []): array
    {
        $resultados = [];
        foreach ($this->modulos as $modulo) {
            $funcao = $modulo . '_' . $gancho;  // ex. blog_menu_links
            if (function_exists($funcao)) {
                $resultados[$modulo] = $funcao(...$args);  // ... : desempacota $args
            }
        }
        return $resultados;
    }

    public function alter(string $gancho, array &$dados): void
    {
        foreach ($this->modulos as $modulo) {
            $funcao = $modulo . '_' . $gancho . '_alter';  // ex. prive_menu_links_alter
            if (function_exists($funcao)) {
                $funcao($dados);  // a função modifica $dados no lugar
            }
        }
    }
}

$gerenciador = new GerenciadorModulos(['blog', 'stats', 'prive']);
$links = array_merge(...array_values($gerenciador->invokeAll('menu_links')));
$gerenciador->alter('menu_links', $links);  // os módulos retocam o resultado
echo json_encode($links), "\n";
```

Resultado (a sequência `\/` é apenas a maneira como `json_encode` escreve `/`):

```text
{"inicio":"\/","blog":"\/blog"}
```

| Sintaxe PHP | Significado |
|---|---|
| `array &$links` | O `&` passa uma **referência**: a função recebe a própria variável, não uma cópia, então suas modificações aparecem fora |
| `unset($links['stats'])` | Remove a chave `stats` do array |
| `private array $modulos` no construtor | Atalho: declara a propriedade e a preenche na criação do objeto |
| `$funcao(...$args)` | As três reticências desempacotam o array `$args` em argumentos separados |
| `array_values`, `array_merge` | O primeiro ignora as chaves (aqui os nomes dos módulos), o segundo funde arrays |
| `json_encode` | Transforma um array em texto JSON, prático para exibi-lo |

O funcionamento: `invokeAll` coletou os links de `blog` e de `stats`, depois `alter` deixou o módulo `prive` retirar o link `stats`. Os módulos `blog`, `stats` e `prive` não se conhecem: somente o ponto de extensão `menu_links` os liga.

```text
  GerenciadorModulos::invokeAll('menu_links')
        │
        ├──> blog_menu_links()   ──> inicio, blog
        └──> stats_menu_links()  ──> stats
                    │
                    ▼  tabela mesclada
  GerenciadorModulos::alter('menu_links', $links)
        └──> prive_menu_links_alter()  ──> retira « stats »
```

## A dependência entre módulos: declarada, opcional ou oculta

Quando o módulo `export` usa uma função do módulo `stats`, ele **depende** dele. Existem três situações.

| Tipo | Situação | O que o framework faz |
|---|---|---|
| Dependência **obrigatória** declarada | `export` não funciona sem `stats` | Recusa ativar `export` se `stats` estiver ausente |
| Dependência **opcional** | `export` funciona sem `stats`, mas acrescenta uma informação se ele estiver presente | Nada: `export` verifica ele mesmo a presença |
| Dependência **não declarada** | `export` chama `stats` sem avisar nem verificar | Nada, até o erro fatal em produção |

Uma declaração obrigatória costuma ser escrita no arquivo de descrição do módulo. Exemplo fictício:

```yaml
name: Export
requires:
  - core      # sem o núcleo, nada funciona
optional:
  - stats     # a usar se presente (verificado no código)
```

Para a dependência opcional, pergunta-se ao gerenciador se o módulo está ativado. Em muitos frameworks, esse método se chama `moduleExists`.

```php
<?php
$ativo = ($argv[1] ?? 'sem') === 'com';  // simula o módulo stats ativado ou não
if ($ativo) {
    function stats_total(): int { return 340; }  // definida só se stats estiver ativado
}

final class Modulos
{
    public function __construct(private array $ativos) {}

    public function moduleExists(string $nome): bool
    {
        return in_array($nome, $this->ativos, true);  // o módulo está ativado?
    }
}

function relatorio_prudente(Modulos $modulos): string
{
    $texto = '12 artigos';
    if ($modulos->moduleExists('stats')) {  // dependência opcional: verificamos
        $texto .= ', ' . stats_total() . ' visitas';
    }
    return $texto;
}

function relatorio_imprudente(): string
{
    return '12 artigos, ' . stats_total() . ' visitas';  // dependência não declarada
}

$modulos = new Modulos($ativo ? ['export', 'stats'] : ['export']);
echo relatorio_prudente($modulos), "\n";
try {
    echo relatorio_imprudente(), "\n";
} catch (Error $erro) {
    echo 'Erro : ', $erro->getMessage(), "\n";
}
```

Este script é executado com `php arquivo.php sem` (o módulo `stats` está desativado) ou `php arquivo.php com`. Resultados observados:

| Execução | `relatorio_prudente` | `relatorio_imprudente` |
|---|---|---|
| `sem` | `12 artigos` | `Erro : Call to undefined function stats_total()` |
| `com` | `12 artigos, 340 visitas` | `12 artigos, 340 visitas` |

A função imprudente funciona enquanto `stats` estiver ativado, o que mascara o defeito: a aplicação quebra no dia em que alguém desativar `stats`, muitas vezes longe do lugar do erro. A função prudente se adapta aos dois casos. Os elementos de sintaxe novos: `$argv` contém as palavras digitadas após o nome do script, `in_array(..., true)` procura um valor em um array comparando também o tipo, `try` / `catch (Error ...)` captura um erro em vez de interromper o programa (veja [as exceções em PHP](/?c=langages&s=php&p=exceptions)), e `.=` acrescenta texto ao fim de uma string.

O sentido da dependência também importa: um módulo de base nunca deve depender de um módulo opcional, sem o que se cria um ciclo (veja [verificar o sentido das dependências](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser)).

## O que a inversão de controle muda no seu código

| Vantagem | Contrapartida |
|---|---|
| Acrescentar um comportamento sem modificar o código existente | O caminho de execução é mais difícil de seguir: não se vê quem chama quem |
| Cada módulo continua pequeno e independente (ver a [responsabilidade única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)) | Um esquecimento na declaração resulta em silêncio: nada é chamado e nenhum erro aparece |
| O framework pode mudar a ordem ou o momento das chamadas | A ordem de execução depende de prioridades ou pesos a vigiar |

## As armadilhas

| Armadilha | Por que é um problema | Reação recomendada |
|---|---|---|
| Erro de digitação no nome de um hook (`blog_cron` escrito `blog_cro`) | A função nunca é chamada e nenhum erro é sinalizado | Testar se o efeito esperado acontece; conferir o nome na documentação do hook |
| Dois assinantes de mesma prioridade cuja ordem importa | A ordem passa a depender da ordem de inscrição, o que é frágil | Dar prioridades distintas quando a ordem for importante |
| Um assinante que interrompe a propagação sem avisar | Os outros assinantes deixam de ser executados, sem nenhum rastro | Documentar cada interrupção e registrá-la no log |
| Um `alter` que muda a forma do dado | Os módulos seguintes recebem uma estrutura inesperada | Manter a mesma estrutura, modificando apenas os valores |
| Um hook que faz trabalho pesado (requisição de rede, laço sobre toda a base) | Ele é chamado a cada passagem e deixa tudo mais lento | Confiar o trabalho pesado a uma tarefa adiada |
| Chamar outro módulo sem declará-lo nem verificá-lo | Erro fatal no dia em que esse módulo for desativado | Declarar a dependência ou testá-la com `moduleExists` |
| Modificar o núcleo do framework para « acrescentar uma função » | A modificação se perde na próxima atualização | Passar por um hook, um evento ou um serviço do projeto |

## Boas práticas

| Boa prática | Motivo |
|---|---|
| Escolher um nome de hook claro e documentá-lo ao lado da sua declaração | Os outros módulos sabem o que implementar |
| Preferir `invokeAll` para coletar e `alter` para retocar | Cada forma tem um papel preciso, e o comportamento permanece previsível |
| Declarar toda dependência obrigatória no arquivo do módulo | O framework recusa a ativação incoerente em vez de quebrar depois |
| Proteger toda dependência opcional com uma verificação (`moduleExists`) | A aplicação sobrevive à ausência do módulo |
| Escrever um teste por implementação de hook, com e sem os módulos opcionais | Um hook não chamado não produz erro algum: só um teste o revela |
| Manter os assinantes curtos e sem efeito colateral escondido | Facilita a depuração de um caminho já indireto |

## O que reter

- A **inversão de controle** consiste em declarar código (rota, hook, assinante, serviço, plugin) para que o framework o chame no momento certo, em vez de chamá-lo você mesmo.
- Um **hook** se reconhece por uma convenção de nomes; um **assinante de evento** se inscreve explicitamente e recebe uma **prioridade** que define a ordem de execução.
- É possível criar seus próprios pontos de extensão: `invokeAll` coleta as respostas de todos os módulos, `alter` permite que eles modifiquem um dado já construído.
- Uma **dependência obrigatória** se declara, uma **dependência opcional** se verifica no código (`moduleExists`), e uma **dependência não declarada** é um defeito que só quebra no dia em que o módulo desaparece.
- O preço da inversão é um caminho de execução menos visível: nomear, documentar e testar cada ponto de extensão.
