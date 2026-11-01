---
order: 17
---

# Exibir uma entidade: construtor de renderização, rota e controle de acesso (31/10/2026)

Uma **entidade** é um dado que a aplicação sabe identificar, guardar e encontrar: um artigo, um usuário, um comentário, um pedido. Ela tem um **tipo** (« artigo »), um **número** (o 12) e campos (título, texto, autor). Exibir uma entidade em uma página web parece simples: lemos o dado e escrevemos [HTML](/?c=langages&s=html&p=structure-dun-document) (a linguagem que descreve o conteúdo de uma página web). Na realidade, três perguntas distintas se escondem por trás desse gesto, e misturá-las produz código frágil e falhas de segurança. Este capítulo as separa com um pequeno programa PHP que você pode executar, depois mostra como um sistema de gerenciamento de conteúdo (CMS, um software que permite publicar e gerenciar conteúdos) como [Drupal](https://www.drupal.org/docs/drupal-apis/entity-api) as realiza com três ferramentas: um construtor de renderização, uma rota de entidade e um gerenciador de controle de acesso.

Ele exige **PHP 8.1 no mínimo** (as enumerações `enum` e as propriedades `readonly` não existem antes; o capítulo foi testado no PHP 8.3). Ele pressupõe que você já conheça [o roteamento sem framework](/?c=langages&s=php&p=routage) (uma rota associa um endereço a um código), [a POO em PHP](/?c=langages&s=php&p=poo) (classe, construtor, injeção de dependências) e, para o parâmetro de endereço transformado em objeto, [a conversão de parâmetro de rota](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre). Os códigos de status `200`, `403` e `404` são apresentados em [as trocas de dados: API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

> Neste capítulo, o Drupal é apenas um **exemplo**: o princípio vale para qualquer framework (uma grande base de código que fornece o esqueleto de uma aplicação, ver [a inversão de controle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension); por exemplo [Symfony](https://symfony.com/doc/current/index.html) ou [Laravel](https://laravel.com/docs)) ou para código escrito à mão. Tudo o que é próprio do Drupal está principalmente reunido na seção « Um exemplo: como o Drupal 11 realiza este princípio » (algumas menções « no Drupal » reaparecem em « As listas e as consultas » e nos resumos); o resto é PHP puro que o capítulo executa de verdade.

## O problema: três perguntas misturadas

Quando um visitante pede o artigo 12, o programa deve responder a três perguntas, nesta ordem.

| Pergunta | Ela diz respeito a | Exemplo de resposta | Ela muda quando |
|---|---|---|---|
| Qual é o dado? | O **dado** | « Título: Oi, autor: 2, estado: publicado » | O conteúdo do artigo é modificado |
| Podemos vê-lo? | O **direito de acesso** | « Sim » ou « Não » conforme a conta do visitante | Uma regra de segurança muda |
| Como apresentá-lo? | A **disposição visual** | Um título grande, depois o texto; ou só o título em uma lista | O design do site muda |

Veja o que dá o reflexo de escrever tudo no mesmo lugar. Alguns pontos de referência de sintaxe para este primeiro bloco (ver [a sintaxe do PHP](/?c=langages&s=php&p=syntaxe) e [as variáveis](/?c=langages&s=php&p=variables)): `<?php` abre o código PHP; `function nome(...)` define uma função, um bloco de código reutilizável; `array` e `string` são os tipos « vetor » e « texto »; `echo` escreve um texto na tela; `.` cola dois textos um após o outro; `!==` quer dizer « diferente (valor ou tipo) »; `&&` quer dizer « e » entre duas condições.

```php
<?php
// arquivo: mistura.php
// um artigo e duas contas, em vetores associativos (pares chave => valor)
$artigo = ['titulo' => 'Olá', 'estado' => 'rascunho', 'autor' => 2];
$autor = ['id' => 2];  // a conta que escreveu o artigo
$visitante = ['id' => 5]; // outra conta

// a exibição de um artigo, com tudo misturado em uma única função
function exibirArtigo(array $artigo, array $conta): string
{
    // regra de acesso: um rascunho só é visível para o seu autor
    if ($artigo['estado'] === 'rascunho' && $artigo['autor'] !== $conta['id']) {
        return 'Acesso proibido';
    }
    // disposição visual: o título é colado tal qual no HTML
    return '<h2>' . $artigo['titulo'] . '</h2>';
}

echo exibirArtigo($artigo, $autor), "\n";  // esperado: o título em HTML
echo exibirArtigo($artigo, $visitante), "\n"; // esperado: a recusa
```

Resultado obtido:

```text
<h2>Olá</h2>
Acesso proibido
```

Funciona, mas três defeitos aparecem assim que o site cresce.

| Defeito | Consequência |
|---|---|
| A regra de acesso é copiada em cada página que exibe um artigo (lista, feed, busca) | Uma página esquece a regra e deixa ver um rascunho: trata-se de um *controle de acesso quebrado*, a primeira família de falhas do [OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| A disposição visual está escrita na mesma função que a regra | Mudar o design obriga a reabrir código de segurança |
| O título é colado no HTML sem ser neutralizado | Um título contendo `<script>` seria executado pelo navegador: uma falha XSS (*Cross-Site Scripting*, ver [XSS em detalhe](/?c=securite&s=cybersecurite&p=xss-en-detail)), ver também [proteger seus dados](/?c=langages&s=php&p=securite) |

A solução é a de [a responsabilidade única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage): uma peça para cada pergunta (o dado, o direito, a apresentação), e uma quarta peça, a rota, que as encadeia.

```text
  requisição: /artigo/12
        |
        v
  ROTA DE ENTIDADE      "este endereço mostra um artigo, em modo completo,
        |                desde que se tenha o direito de vê-lo"
        v
  CONVERSÃO             "12" vira o objeto Artigo número 12 (senão 404)
        |
        v
  CONTROLE DE ACESSO ---- recusado ----> resposta 403
        |
     autorizado
        v
  CONSTRUTOR DE RENDERIZAÇÃO   dado + modo de exibição = vetor de renderização
        |
        v
  MOTOR DE RENDERIZAÇÃO        vetor de renderização = HTML (texto neutralizado)
        |
        v
  resposta 200
```

Cada etapa do esquema é detalhada mais adiante. « Construtor de renderização » e « motor de renderização » são duas peças diferentes; o primeiro não tem nada a ver com o `__construct` de uma classe.

## As peças do mini-exemplo

O restante do capítulo constrói essas peças uma por uma, em PHP puro, em quatro arquivos, depois um script de teste. Para experimentá-las, salve os cinco arquivos em uma mesma pasta, abra um terminal (ver [o terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)), posicione-se nesta pasta e digite o comando indicado no final.

| Peça | Papel | Arquivo |
|---|---|---|
| `Artigo`, `Conta` | O dado e a pessoa que pede para ver | `dado.php` |
| `Acesso` | A resposta de uma regra: autorizado, proibido ou neutro | `acesso.php` |
| `RegraAcesso` e suas implementações | Cada regra dá sua opinião sobre um artigo | `acesso.php` |
| `GerenciadorAcesso` | Reúne as opiniões e dá uma resposta única | `acesso.php` |
| `ConstrutorRenderizacao` | Transforma o artigo em vetor de renderização, conforme um modo | `renderizacao.php` |
| `MotorRenderizacao` | Transforma o vetor de renderização em HTML | `renderizacao.php` |
| `TiposEntidade` | Registro: para um tipo de entidade, fornece seus gerenciadores | `rotas.php` |
| `RoteadorEntidade` | Encadeia rota, conversão, acesso e renderização | `rotas.php` |

## O dado: o artigo e a conta

O dado é um objeto que só contém valores. Ele ignora tudo sobre a sua exibição e os seus direitos. Neste código, `int`, `string`, `array` e `bool` são **tipos declarados** (inteiro, texto, vetor, verdadeiro/falso): dizem que tipo de valor uma propriedade ou um parâmetro aceita; `: bool` depois dos parênteses indica o tipo do valor devolvido; `public` torna uma propriedade legível em qualquer lugar, `private` a reserva à sua classe; `void` significa « não devolve nada » (ver [a POO em PHP](/?c=langages&s=php&p=poo)).

```php
<?php
// arquivo: dado.php

// o dado puro: um artigo não tem nenhuma ideia da sua exibição nem dos seus direitos
final class Artigo
{
    // o construtor recebe os valores e os guarda em propriedades
    public function __construct(
        public readonly int $id,        // número; readonly: nunca mais modificável
        public readonly string $titulo, // título exibido
        public readonly string $corpo,  // texto do artigo
        public readonly int $autor,     // número da conta que o escreveu
        public readonly string $estado, // "publicado" ou "rascunho"
    ) {
    }
}

// a pessoa que pede para ver: seu número e suas permissões
final class Conta
{
    public function __construct(
        public readonly int $id,         // número da conta (0 para um visitante anônimo)
        public readonly array $permissoes // lista de textos, ex.: ['ver os artigos']
    ) {
    }

    // diz se a conta possui uma determinada permissão
    public function tem(string $permissao): bool
    {
        return in_array($permissao, $this->permissoes, true); // true: comparação estrita
    }
}
```

| Sintaxe PHP | Significado |
|---|---|
| `final class` | Classe que nenhuma outra classe pode estender (ver [a POO em PHP](/?c=langages&s=php&p=poo)) |
| `public readonly int $id` na lista do construtor | Cria uma propriedade pública, legível em toda parte, **somente leitura** (atribuída uma vez na construção, nunca modificada depois), e lhe dá o valor recebido |
| `in_array($x, $lista, true)` | Procura `$x` em `$lista`; o `true` impõe uma comparação estrita (sem ele, o PHP às vezes converte textos em números: `"1e1"` vale `"10"`, pois `1e1` também se escreve 10; com ele, não), sempre usar para textos |

Um visitante não conectado é uma conta como as outras, aqui de número `0` e sem permissão: o código não precisa de um caso especial. Uma **permissão** é um direito nomeado que se concede a uma conta (« ver os artigos »). Quem possui qual permissão é gerenciado em outro lugar (ver [RBAC e ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac)); aqui, `Conta` se limita a listá-la.

## Uma resposta de acesso com três valores

A pergunta « temos o direito? » não se resume a sim ou não. Uma regra pode também **não ter opinião**: a regra « um rascunho é visível para o seu autor » não tem nada a dizer sobre um artigo publicado. São necessárias, portanto, três respostas.

| Resposta | Significado | Exemplo |
|---|---|---|
| `Autoriza` | Esta regra diz sim | O autor abre o seu próprio rascunho |
| `Proibido` | Esta regra diz não, **e esse não vence todos os sim** | O artigo é bloqueado pela moderação |
| `Neutro` | Esta regra não tem opinião | A regra dos rascunhos diante de um artigo publicado |

Quando várias regras respondem, combinamos as respostas. Para escrevê-la em PHP, usamos uma **enumeração** (`enum`), um tipo cujos únicos valores possíveis são listados antecipadamente, aqui as três respostas.

```php
<?php
// arquivo: acesso.php

// uma resposta de acesso tem três valores possíveis, não dois: é uma enumeração
enum Acesso
{
    case Autoriza; // uma regra diz sim
    case Proibido; // uma regra diz não, e esse não é definitivo
    case Neutro;   // a regra não tem opinião sobre este caso

    // "ou": uma voz favorável basta, mas um Proibido sempre vence
    public function ou(Acesso $outro): Acesso
    {
        if ($this === self::Proibido || $outro === self::Proibido) {
            return self::Proibido; // um único veto basta
        }
        if ($this === self::Autoriza || $outro === self::Autoriza) {
            return self::Autoriza; // pelo menos um sim, nenhum veto
        }
        return self::Neutro; // ninguém tem opinião
    }

    // "e": é preciso a concordância dos dois; um veto ou um silêncio bloqueia
    public function e(Acesso $outro): Acesso
    {
        if ($this === self::Proibido || $outro === self::Proibido) {
            return self::Proibido; // um veto continua sendo um veto
        }
        if ($this === self::Autoriza && $outro === self::Autoriza) {
            return self::Autoriza; // os dois dizem sim
        }
        return self::Neutro; // um dos dois não disse sim
    }

    // a decisão final: só um Autoriza abre a porta (o Neutro recusa)
    public function estAutorizado(): bool
    {
        return $this === self::Autoriza;
    }
}
```

| Sintaxe PHP | Significado |
|---|---|
| `enum Acesso { case Autoriza; ... }` | Declara o tipo `Acesso` e os seus únicos valores possíveis, chamados *casos* |
| `self::Proibido` | O valor `Proibido` da enumeração atual |
| `$this` | O objeto sobre o qual o método é chamado: aqui, a primeira das duas respostas comparadas |
| `===` | Igualdade estrita: mesmo valor **e** mesmo tipo |
| `\|\|` e `&&` | « ou » e « e » entre duas condições (não confundir com os métodos `ou` e `e` da enumeração, que combinam respostas de acesso) |
| `if (...) { return ...; }` | Se a condição for verdadeira, a resposta é devolvida na hora e o resto do método não é lido (ver [as condições](/?c=langages&s=php&p=conditions)) |

A combinação `ou` é usada quando várias regras dividem a decisão; `e` quando duas condições devem ser reunidas. Veja o que dá cada par de respostas, verificado executando `Acesso::cases()` (a lista dos três valores):

| Resposta A | Resposta B | `A->ou(B)` | `A->e(B)` |
|---|---|---|---|
| Autoriza | Autoriza | Autoriza | Autoriza |
| Autoriza | Proibido | Proibido | Proibido |
| Autoriza | Neutro | Autoriza | Neutro |
| Proibido | Autoriza | Proibido | Proibido |
| Proibido | Proibido | Proibido | Proibido |
| Proibido | Neutro | Proibido | Proibido |
| Neutro | Autoriza | Autoriza | Neutro |
| Neutro | Proibido | Proibido | Proibido |
| Neutro | Neutro | Neutro | Neutro |

Dois fatos a reter: um `Proibido` sempre vence, qualquer que seja o operador; e a decisão final só abre a porta para um `Autoriza`. Um `Neutro` final significa « nenhuma regra disse sim »: o acesso é recusado. É o princípio da **recusa por padrão**: na ausência de regra favorável, a porta permanece fechada.

## As regras de acesso e o seu gerenciador

Uma **interface** é um contrato: ela lista os métodos que uma classe se compromete a oferecer, sem escrever o seu conteúdo. Todas as regras respeitam a mesma interface, então o gerenciador pode chamá-las sem saber o que elas fazem. Logo após `acesso.php`:

```php
// o contrato de uma regra de acesso: uma opinião sobre um artigo, uma operação e uma conta
interface RegraAcesso
{
    public function verificar(Artigo $artigo, string $operacao, Conta $conta): Acesso;
}
```

A primeira regra é a do próprio artigo.

```php
// a regra própria dos artigos (operação "ver" apenas)
final class RegraAcessoArtigo implements RegraAcesso
{
    public function verificar(Artigo $artigo, string $operacao, Conta $conta): Acesso
    {
        if ($operacao !== 'ver') {
            return Acesso::Neutro; // operação desconhecida: sem opinião
        }
        if ($conta->tem('administrar os artigos')) {
            return Acesso::Autoriza; // o administrador vê tudo
        }
        if ($artigo->estado === 'rascunho') {
            // um rascunho só é visível para o seu autor
            return $artigo->autor === $conta->id ? Acesso::Autoriza : Acesso::Neutro;
        }
        return $conta->tem('ver os artigos') ? Acesso::Autoriza : Acesso::Neutro;
    }
}
```

A segunda regra é acrescentada « de fora ». Ela não pertence às regras do artigo: podemos imaginar que um **módulo** (uma extensão que acrescenta funções à aplicação) de moderação a forneça. Ela nunca diz sim, só diz não quando o artigo está bloqueado.

```php
// uma regra acrescentada "de fora": ela proíbe todo artigo cujo número esteja bloqueado
final class RegraBloqueio implements RegraAcesso
{
    public function __construct(private array $numerosBloqueados) // números bloqueados
    {
    }

    public function verificar(Artigo $artigo, string $operacao, Conta $conta): Acesso
    {
        $bloqueado = in_array($artigo->id, $this->numerosBloqueados, true); // está na lista?
        return $bloqueado ? Acesso::Proibido : Acesso::Neutro; // bloqueado: proibido a todos
    }
}
```

O **gerenciador de controle de acesso** reúne as regras e dá uma única resposta. As outras peças do programa nunca chamam uma regra diretamente: elas consultam o gerenciador.

```php
// o gerenciador de controle de acesso: reúne as regras e dá UMA resposta
final class GerenciadorAcesso
{
    public function __construct(private array $regras) // lista de objetos RegraAcesso
    {
    }

    public function acesso(Artigo $artigo, string $operacao, Conta $conta): Acesso
    {
        $resposta = Acesso::Neutro; // partimos do silêncio
        foreach ($this->regras as $regra) {
            // combinamos cada opinião com "ou": um veto prevalece, um sim basta
            $resposta = $resposta->ou($regra->verificar($artigo, $operacao, $conta));
        }
        return $resposta;
    }
}
```

| Sintaxe PHP | Significado |
|---|---|
| `class X implements Y` | A classe `X` se compromete a oferecer todos os métodos da interface `Y` |
| `condição ? a : b` | Vale `a` se a condição for verdadeira, senão `b` |
| `private array $regras` na lista do construtor | Cria uma propriedade oculta do exterior e lhe dá o valor recebido |
| `foreach ($this->regras as $regra)` | Repete o bloco para cada elemento do vetor, sob o nome `$regra` |
| `$resposta->ou(...)` | Chama o método `ou` da enumeração sobre o valor contido em `$resposta` |

Veja o que dá cada combinação de regras para três situações.

| Caso | `RegraAcessoArtigo` | `RegraBloqueio` | Resposta do gerenciador |
|---|---|---|---|
| Artigo publicado, leitor com a permissão | Autoriza | Neutro | Autoriza |
| Rascunho, outra conta | Neutro | Neutro | Neutro (portanto recusa) |
| Artigo bloqueado, administrador | Autoriza | Proibido | Proibido (o veto prevalece sobre o administrador) |

## O construtor de renderização e o vetor de renderização

O **construtor de renderização** (em inglês *view builder*) responde à pergunta « como apresentar este dado? ». Ele ainda não produz HTML. Ele produz um **vetor de renderização** (em PHP, um *array*): um vetor que descreve o que deve ser exibido (quais campos, com quais valores, em qual modo). Outro componente, o **motor de renderização**, o transformará em HTML. Essa etapa intermediária tem um interesse: o vetor pode ser completado ou modificado por outros trechos de código antes de ser escrito em HTML, e pode ser testado sem analisar texto.

Um **modo de exibição** é uma maneira de mostrar o mesmo dado: o artigo inteiro na sua página, ou só o seu título em uma lista.

| Modo | Campos mostrados | Onde é visto |
|---|---|---|
| `completo` | título e corpo | A página do artigo |
| `previa` | título | Uma linha em uma lista de artigos |

```php
<?php
// arquivo: renderizacao.php

// o contrato de um construtor de renderização: do dado a um vetor de renderização
interface ConstrutorRenderizacao
{
    public function ver(Artigo $artigo, string $modo = 'completo'): array;
}

// construtor de renderização dos artigos: escolhe os campos conforme o modo de exibição
final class ConstrutorRenderizacaoArtigo implements ConstrutorRenderizacao
{
    // para cada modo de exibição, a lista dos campos a mostrar
    private const MODOS = [
        'completo' => ['titulo', 'corpo'], // a página do artigo
        'previa' => ['titulo'],            // a linha de uma lista
    ];

    public function ver(Artigo $artigo, string $modo = 'completo'): array
    {
        // throw dentro de um ??: se o modo não existir, lançamos um erro
        $campos = self::MODOS[$modo]
            ?? throw new InvalidArgumentException("Modo desconhecido: $modo");
        // chaves "#": metadados
        $vetor = ['#modo' => $modo, '#artigo' => $artigo->id];
        foreach ($campos as $campo) {
            $vetor[$campo] = $artigo->$campo; // $artigo->$campo: propriedade $campo
        }
        return $vetor;
    }
}
```

| Sintaxe PHP | Significado |
|---|---|
| `string $modo = 'completo'` | Valor padrão de um parâmetro: se quem chama não informar um modo, `$modo` vale `'completo'` |
| `"Modo desconhecido: $modo"` | Texto entre aspas duplas: o PHP substitui `$modo` pelo seu valor |
| `throw new InvalidArgumentException(...)` | Lança um erro, aqui da classe `InvalidArgumentException` (« argumento inválido »); ver [as exceções em PHP](/?c=langages&s=php&p=exceptions) |
| `private const MODOS = [...]` | Constante da classe, oculta do exterior: a lista dos modos conhecidos |
| `self::MODOS[$modo]` | Lê a constante da classe atual, na chave `$modo` |
| `$a ?? throw new ...` | Se `$a` não existir, lança um erro em vez de continuar com um valor vazio |
| `'#modo'` | Chave começando por `#`: por convenção, um metadado (informação sobre o vetor) e não um campo a exibir |
| `$artigo->$campo` | Lê a propriedade cujo nome está na variável `$campo` |

Para um artigo número 1, de título `T` e corpo `C`, o construtor devolve no modo `completo` (resultado de `print_r`, que exibe um vetor):

```text
Array
(
    [#modo] => completo
    [#artigo] => 1
    [titulo] => T
    [corpo] => C
)
```

Um modo desconhecido lança uma exceção (ver [as exceções em PHP](/?c=langages&s=php&p=exceptions)) cuja mensagem é `Modo desconhecido: desconhecido`.

O motor de renderização é acrescentado ao final de `renderizacao.php`. É ele, e somente ele, que escreve HTML, portanto é ele que neutraliza o texto.

```php
// o motor de renderização: transforma um vetor de renderização em HTML, e protege o texto
final class MotorRenderizacao
{
    public function html(array $vetor): string
    {
        $html = '<article>'; // tag de abertura
        foreach (['titulo' => 'h2', 'corpo' => 'p'] as $campo => $etiqueta) {
            if (isset($vetor[$campo])) { // somente os campos presentes neste modo
                // htmlspecialchars neutraliza < > & e ": o texto não vira HTML
                $html .= "<$etiqueta>" . htmlspecialchars($vetor[$campo]) . "</$etiqueta>";
            }
        }
        return $html . '</article>'; // tag de fechamento
    }
}
```

| Sintaxe PHP | Significado |
|---|---|
| `foreach (['titulo' => 'h2', ...] as $campo => $etiqueta)` | Percorre uma lista de pares chave => valor: a cada volta, `$campo` recebe a chave e `$etiqueta` o valor |
| `isset($vetor[$campo])` | Verdadeiro se a chave existir no vetor e não for `null` |
| `$html .= "..."` | Acrescenta o texto ao final de `$html` |
| `"<$etiqueta>"` | Texto entre aspas duplas: `$etiqueta` é substituído pelo seu valor, por exemplo `h2` |
| `htmlspecialchars(...)` | Substitui `<`, `>`, `&` e as aspas por códigos que o navegador exibe como estão |

`htmlspecialchars` troca `<` por `&lt;` (uma *entidade HTML*, um código que se exibe como o caractere): o navegador então exibe o texto `<b>` em vez de interpretá-lo como negrito. Escrever essa proteção no motor, e não em cada página, evita que uma página a esqueça.

## O registro de tipos e a rota de entidade

Resta ligar as peças. O **registro de tipos de entidade** associa a um tipo (« artigo ») seus gerenciadores: seu construtor de renderização e seu gerenciador de acesso. O roteador então não conhece nenhum tipo específico: ele pede ao registro.

```php
<?php
// arquivo: rotas.php

// registro dos tipos de entidade: para um tipo, fornece os seus gerenciadores
final class TiposEntidade
{
    private array $gerenciadores = []; // tipo => ['renderizacao' => ..., 'acesso' => ...]

    public function declarar(string $tipo, array $gerenciadores): void
    {
        $this->gerenciadores[$tipo] = $gerenciadores; // o tipo se registra sozinho
    }

    public function construtorRenderizacao(string $tipo): ConstrutorRenderizacao
    {
        return $this->gerenciadores[$tipo]['renderizacao'];
    }

    public function controleAcesso(string $tipo): GerenciadorAcesso
    {
        return $this->gerenciadores[$tipo]['acesso'];
    }
}
```

Uma **rota de entidade** é uma rota que não designa um trecho de código preciso, mas uma **entidade e um modo de exibição**: `artigo.completo` quer dizer « a entidade do tipo `artigo`, no modo `completo` ». Ela designa também a operação a autorizar: `artigo.ver`. O roteador lê esses dois textos e procura os gerenciadores correspondentes no registro.

```php
// o roteador de entidades: não conhece NENHUM tipo específico, somente os gerenciadores
final class RoteadorEntidade
{
    public function __construct(
        private TiposEntidade $tipos, // registro dos tipos
        private array $rotas,         // modelo => ['visao' => ..., 'acesso' => ...]
        private array $entidades      // [tipo => [número => objeto]]: em memória
    ) {
    }

    // devolve [código HTTP, corpo da resposta]
    public function responder(string $caminho, Conta $conta): array
    {
        foreach ($this->rotas as $modelo => $rota) {
            // {artigo} vira uma captura nomeada: (?<artigo>[^/]+) = tudo exceto "/"
            $captura = preg_replace('#\{(\w+)\}#', '(?<$1>[^/]+)', $modelo);
            $padrao = '#^' . $captura . '$#'; // o padrão completo, de ^ (início) a $ (fim)
            if (preg_match($padrao, $caminho, $encontrado) === 1) {
                return $this->tratar($rota, $encontrado, $conta); // primeira rota encontrada
            }
        }
        return [404, 'Página desconhecida']; // nenhuma rota corresponde
    }

    private function tratar(array $rota, array $encontrado, Conta $conta): array
    {
        [$tipo, $modo] = explode('.', $rota['visao']); // "artigo.completo" -> tipo e modo
        $numero = (int) ($encontrado[$tipo] ?? 0); // o texto do endereço vira um número
        $entidade = $this->entidades[$tipo][$numero] ?? null; // conversão em objeto, ou null
        if ($entidade === null) {
            return [404, 'Não encontrado']; // o número não designa nenhuma entidade
        }
        [, $operacao] = explode('.', $rota['acesso']); // "artigo.ver" -> "ver"
        $acesso = $this->tipos->controleAcesso($tipo)->acesso($entidade, $operacao, $conta);
        if (!$acesso->estAutorizado()) {
            return [403, 'Acesso proibido']; // Proibido ou Neutro: a porta continua fechada
        }
        $vetor = $this->tipos->construtorRenderizacao($tipo)->ver($entidade, $modo);
        return [200, (new MotorRenderizacao())->html($vetor)];
    }
}
```

| Elemento do roteador | Papel |
|---|---|
| `{artigo}` em `/artigo/{artigo}` | Um **parâmetro** de rota: a parte do endereço que muda (ver [o roteamento](/?c=langages&s=php&p=routage)). Seu nome é o do tipo de entidade, o que permite saber o que carregar |
| `preg_replace` e `preg_match` | Transformam o modelo em **expressão regular** (um padrão de busca em texto, sintaxe parecida com [a das regex](/?c=langages&s=domain-specific-languages-dsl&p=regex)) e depois testam o endereço |
| Armadilha do modelo | O modelo de endereço é lido como regex sem ser escapado: um `.` ou um `+` em `/artigo.html/{artigo}` seria interpretado como um símbolo do padrão. Os modelos deste capítulo não contêm nenhum; senão, proteger a parte fixa com `preg_quote` (função do PHP que escapa esses símbolos) |
| `(?<artigo>[^/]+)` | Captura nomeada: « um ou vários caracteres que não são `/` », guardados sob o nome `artigo` |
| `#\{(\w+)\}#` | Padrão que procura uma chave de abertura, uma palavra (`\w+`: letras, algarismos e `_`), depois uma chave de fechamento; os `#` nas duas pontas delimitam o padrão, e `$1` na substituição devolve a palavra encontrada |
| `'#^' . $captura . '$#'` | `^` significa « início do texto » e `$` « fim do texto »: todo o endereço deve corresponder, não apenas um pedaço |
| `explode('.', 'artigo.completo')` | Corta o texto a cada ponto: obtemos `['artigo', 'completo']` |
| `[$tipo, $modo] = ...` | Guarda os dois pedaços em duas variáveis de uma só vez |
| `(int) $texto` | Converte em número inteiro; um texto como `abc` dá `0`, que não designa nenhuma entidade. Armadilha: `1abc` dá `1`, então `/artigo/1abc` exibiria o artigo 1 (endereço duplicado); para ser estrito, testar antes com `ctype_digit($texto)` (verdadeiro somente se o texto tiver apenas algarismos) ou escrever `\d+` no lugar de `[^/]+` no padrão |
| `$vetor[$chave] ?? null` | Dá `null` quando a chave não existe: aqui, uma entidade ausente, que leva ao `404` |
| `[, $operacao] = ...` | Guarda o **segundo** pedaço apenas: a vírgula sozinha pula o primeiro |
| `preg_match($padrao, $caminho, $encontrado)` | Testa o endereço e guarda as capturas em `$encontrado`; devolve `1` se o endereço corresponder |
| `(new MotorRenderizacao())->html(...)` | Cria um objeto e chama logo um de seus métodos |

A ordem das verificações importa: primeiro a existência (`404`), depois o direito (`403`), e só então a construção da renderização. O construtor de renderização nunca é chamado para um visitante que não tem o direito.

## Montar e testar

O arquivo `teste.php` cria três artigos, quatro contas e duas rotas, depois pede cada endereço com cada conta.

```php
<?php
// arquivo: teste.php
require __DIR__ . '/dado.php';         // Artigo e Conta
require __DIR__ . '/acesso.php';       // Acesso, regras e gerenciador de acesso
require __DIR__ . '/renderizacao.php'; // construtor e motor de renderização
require __DIR__ . '/rotas.php';        // registro dos tipos e roteador

// três artigos: publicado, rascunho do autor 2, publicado mas bloqueado
$artigos = [
    1 => new Artigo(1, 'Oi', 'Uma <i>palavra</i>.', 2, 'publicado'),
    2 => new Artigo(2, 'Ideia em andamento', 'Não terminado.', 2, 'rascunho'),
    3 => new Artigo(3, 'Assunto polêmico', 'Retirado.', 2, 'publicado'),
];

// declaramos o tipo "artigo" com seu construtor de renderização e seu controle de acesso
$tipos = new TiposEntidade();
$tipos->declarar('artigo', [
    'renderizacao' => new ConstrutorRenderizacaoArtigo(),
    'acesso' => new GerenciadorAcesso([new RegraAcessoArtigo(), new RegraBloqueio([3])]),
]);

// duas rotas: a mesma entidade vista em modo completo, depois em prévia
$rotas = [
    '/artigo/{artigo}' => ['visao' => 'artigo.completo', 'acesso' => 'artigo.ver'],
    '/previa/{artigo}' => ['visao' => 'artigo.previa', 'acesso' => 'artigo.ver'],
];
$roteador = new RoteadorEntidade($tipos, $rotas, ['artigo' => $artigos]);

// quatro contas: visitante anônimo, leitor, autor do rascunho, administrador
$contas = [
    'visitante' => new Conta(0, []),
    'leitor' => new Conta(5, ['ver os artigos']),
    'autor' => new Conta(2, []),
    'admin' => new Conta(1, ['administrar os artigos']),
];

// cada linha: a conta, o endereço pedido, o código obtido e o corpo
foreach (['/artigo/1', '/previa/1', '/artigo/2', '/artigo/3', '/artigo/99'] as $endereco) {
    foreach ($contas as $nome => $conta) {
        [$codigo, $corpo] = $roteador->responder($endereco, $conta);
        printf("%-9s %-11s %d %s\n", $nome, $endereco, $codigo, $corpo);
    }
}
```

Alguns elementos de sintaxe deste script:

| Sintaxe PHP | Significado |
|---|---|
| `require __DIR__ . '/dado.php'` | Carrega outro arquivo, situado na mesma pasta que este (ver [include e require](/?c=langages&s=php&p=include)) |
| `new Artigo(1, 'Oi', ...)` | Cria um artigo; os valores seguem a ordem do construtor: número, título, corpo, autor, estado |
| `foreach ($contas as $nome => $conta)` | Percorre uma lista guardando a chave (`$nome`) e o valor (`$conta`) |
| `printf("%-9s %-11s %d %s\n", ...)` | Escreve uma linha conforme um formato: `%-9s` e `%-11s` um texto completado à direita com espaços até 9 e depois 11 caracteres, `%d` um inteiro, `%s` um texto |

Resultado obtido com `php teste.php`:

```text
visitante /artigo/1   403 Acesso proibido
leitor    /artigo/1   200 <article><h2>Oi</h2><p>Uma &lt;i&gt;palavra&lt;/i&gt;.</p></article>
autor     /artigo/1   403 Acesso proibido
admin     /artigo/1   200 <article><h2>Oi</h2><p>Uma &lt;i&gt;palavra&lt;/i&gt;.</p></article>
visitante /previa/1   403 Acesso proibido
leitor    /previa/1   200 <article><h2>Oi</h2></article>
autor     /previa/1   403 Acesso proibido
admin     /previa/1   200 <article><h2>Oi</h2></article>
visitante /artigo/2   403 Acesso proibido
leitor    /artigo/2   403 Acesso proibido
autor     /artigo/2   200 <article><h2>Ideia em andamento</h2><p>Não terminado.</p></article>
admin     /artigo/2   200 <article><h2>Ideia em andamento</h2><p>Não terminado.</p></article>
visitante /artigo/3   403 Acesso proibido
leitor    /artigo/3   403 Acesso proibido
autor     /artigo/3   403 Acesso proibido
admin     /artigo/3   403 Acesso proibido
visitante /artigo/99  404 Não encontrado
leitor    /artigo/99  404 Não encontrado
autor     /artigo/99  404 Não encontrado
admin     /artigo/99  404 Não encontrado
```

O mesmo resultado, apresentado em tabela (as linhas `/previa/1` e `/artigo/1` diferem apenas pelo modo):

| Endereço | Visitante | Leitor | Autor (sem permissão) | Administrador |
|---|---|---|---|---|
| `/artigo/1` (publicado) | 403 | 200 | 403 | 200 |
| `/previa/1` (publicado, modo prévia) | 403 | 200 | 403 | 200 |
| `/artigo/2` (rascunho do autor) | 403 | 403 | 200 | 200 |
| `/artigo/3` (bloqueado) | 403 | 403 | 403 | 403 |
| `/artigo/99` (inexistente) | 404 | 404 | 404 | 404 |

Três observações. O autor vê o seu rascunho, mas não o artigo publicado (ele não tem a permissão geral). O administrador vê tudo, exceto o artigo bloqueado: o veto de `RegraBloqueio` prevalece. E o texto `<i>palavra</i>` do corpo é escrito sob a forma `&lt;i&gt;palavra&lt;/i&gt;`: o navegador o exibe como está, sem colocá-lo em itálico.

## `403` ou `404`: o que revelar ao visitante?

O mini-exemplo responde `403` (proibido) para uma recusa e `404` (não encontrado) para uma entidade que não existe. Essa escolha tem uma consequência: um visitante pode **adivinhar** quais números existem, já que um rascunho responde `403` e um número vazio responde `404`.

| Escolha | O que o visitante fica sabendo | Usar quando |
|---|---|---|
| `403` para uma recusa, `404` para a ausência | O número existe, mas está fechado para ele | A existência da entidade não é um segredo (um artigo publicado do site) |
| `404` nos dois casos | Nada: a recusa e a ausência são indistinguíveis | A própria existência é sensível (um prontuário médico, o rascunho de um concorrente) |

No mini-exemplo, passar para a segunda escolha exige uma linha no roteador: devolver `[404, 'Não encontrado']` em vez de `[403, 'Acesso proibido']`. O código de estado `403` é descrito em [autenticação e autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation); a [documentação MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/403) detalha seu uso.

## Um exemplo: como o Drupal 11 realiza este princípio

> Os nomes de API Drupal desta seção são verificados no código-fonte do Drupal 11.x; a referência é a [documentação oficial](https://www.drupal.org/docs/drupal-apis/entity-api).

O Drupal chama **tipo de entidade** (*entity type*) a definição de uma espécie de dado (um artigo, um usuário), e **gerenciador** (*handler*) um objeto ligado a esse tipo para uma tarefa precisa. O **núcleo** (*core*) é a parte do Drupal comum a todos os sites. O princípio é o do registro `TiposEntidade` do mini-exemplo.

| Noção do mini-exemplo | Equivalente no Drupal |
|---|---|
| `TiposEntidade` | O gerenciador de tipos de entidade, obtido por `\Drupal::entityTypeManager()` |
| `declarar('artigo', [...])` | A definição do tipo de entidade, no cabeçalho da sua classe (anotação, um comentário especial lido pelo Drupal, ou atributo `#[...]`, uma etiqueta nativa do PHP 8, conforme a versão; ver [a arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)), com uma chave `handlers` |
| `'renderizacao' => ConstrutorRenderizacaoArtigo` | O gerenciador `view_builder`, por padrão a classe `Drupal\Core\Entity\EntityViewBuilder` |
| `'acesso' => GerenciadorAcesso` | O gerenciador `access`, uma classe que estende `Drupal\Core\Entity\EntityAccessControlHandler` |
| `Acesso::Autoriza`, `Proibido`, `Neutro` | `AccessResult::allowed()`, `forbidden()`, `neutral()` |
| `ou`, `e` | `orIf()`, `andIf()` sobre um resultado de acesso |
| Modo `completo`, `previa` | Modo de exibição (*view mode*): `full`, `teaser`, ou um modo criado pelo site |
| Vetor de renderização | *Render array*: vetor PHP cujas propriedades (`#theme`, `#cache`...) começam por `#` |
| Rota `artigo.completo` | Valor `_entity_view: 'tipo.modo'` nos valores padrão da rota |
| Direito `artigo.ver` | Exigência `_entity_access: 'tipo.view'` na rota |
| `RoteadorEntidade` | O sistema de roteamento do núcleo, com um controlador genérico para `_entity_view` |

### Declarar os gerenciadores do tipo

A chave `handlers` de um tipo de entidade nomeia uma classe por tarefa. Só o conteúdo da chave é mostrado aqui: a sintaxe que a envolve (anotação ou atributo) depende da versão do Drupal.

```php
<?php

// conteúdo da chave "handlers": uma tarefa => a classe que a executa
$handlers = [
  // o gerenciador de renderização: a classe do núcleo frequentemente basta
  'view_builder' => 'Drupal\Core\Entity\EntityViewBuilder',
  // o gerenciador de controle de acesso: a nossa classe
  'access' => 'Drupal\exemple_articles\ArtigoAccessControlHandler',
  // o provedor de rotas: gera as rotas padrão do tipo
  'route_provider' => [
    'html' => 'Drupal\Core\Entity\Routing\DefaultHtmlRouteProvider',
  ],
];
```

`exemple_articles` e `exemple_article` são nomes inventados para este capítulo: um módulo (um pacote de código que o Drupal carrega) de mesmo nome conteria o tipo de entidade. Um tipo de entidade que não declara `view_builder` ou `access` recebe em geral uma classe padrão do núcleo; o detalhe depende do tipo (conteúdo ou configuração).

### O construtor de renderização

O gerenciador de renderização é obtido junto ao gerenciador de tipos, depois devolve um vetor de renderização. O controle de acesso consulta diretamente a entidade.

```php
<?php

// $artigo é uma entidade carregada, $conta a conta do visitante (obtidos em outro lugar)
// o gerenciador de renderização do tipo de entidade, pedido ao gerenciador de tipos
$construtor = \Drupal::entityTypeManager()->getViewBuilder('exemple_article');
// o vetor de renderização deste artigo no modo "teaser" (prévia)
$vetor = $construtor->view($artigo, 'teaser');

// o resultado de acesso para a operação "view"; TRUE pede o objeto, não um booleano
$resposta = $artigo->access('view', $conta, TRUE);
// verdadeiro somente se o resultado for "allowed" (um "neutral" dá falso)
$autorizado = $resposta->isAllowed();
```

| Chamada | Papel |
|---|---|
| `getViewBuilder('exemple_article')` | Devolve o gerenciador de renderização do tipo |
| `view($entidade, 'teaser')` | Devolve o vetor de renderização de **uma** entidade em um modo |
| `viewMultiple($entidades, 'teaser')` | A mesma coisa para várias entidades de uma vez |
| `$entidade->access('view', $conta, TRUE)` | Devolve um objeto resultado (`TRUE` no terceiro argumento); sem ele, um simples booleano |
| `$resultado->isAllowed()` | Verdadeiro somente para `allowed`: `neutral` dá falso, como nosso `estAutorizado()` |

Um ponto merece atenção: no Drupal, a escolha dos campos mostrados em cada modo não é escrita em PHP como nossa constante `MODOS`. Ela é **configurada** (pelo administrador do site, numa configuração de exibição ligada ao tipo e ao modo), e o construtor de renderização lê essa configuração. O vetor de renderização também contém **metadados de cache** (sob a chave `#cache`). Um **cache** é uma cópia de um resultado guardada para não recalculá-lo; esses metadados dizem do que o resultado depende, o que evita reconstruir a página a cada visita, sem entregá-la ao visitante errado. Esse assunto de cache é separado e não é detalhado aqui.

O motor de renderização do Drupal se apoia em modelos ([Twig](https://twig.symfony.com/doc/), uma linguagem de modelos de página) que escapam as variáveis por padrão (o texto fica inofensivo para o HTML): é o equivalente do nosso `htmlspecialchars`, aplicado automaticamente.

### A rota de entidade

Uma rota se declara em um arquivo de configuração do módulo, no formato YAML (um formato de arquivo de ajustes feito de chaves e valores, em que a indentação expressa o aninhamento; especificação em [yaml.org](https://yaml.org/)). Eis o espírito de uma rota de entidade:

```yaml
# nome da rota: o tipo de entidade, depois o papel "canonical" (a página da entidade)
entity.exemple_article.canonical:
  # o endereço; {exemple_article} é o parâmetro, nomeado como o tipo de entidade
  path: '/artigo/{exemple_article}'
  defaults:
    # exibe a entidade no modo "full" (inteiro)
    _entity_view: 'exemple_article.full'
  requirements:
    # exige que a operação "view" seja autorizada nesta entidade
    _entity_access: 'exemple_article.view'
```

| Chave | Papel |
|---|---|
| `path` | O endereço, com o parâmetro `{exemple_article}` nomeado como o tipo de entidade |
| `defaults._entity_view` | « Exibe a entidade deste tipo neste modo »: o núcleo fornece o **controlador** (o código que responde à rota) |
| `requirements._entity_access` | « Exige que o acesso `view` seja autorizado nesta entidade » |

O parâmetro `{exemple_article}`, nome do tipo de entidade, é convertido em objeto pelo conversor de parâmetros do núcleo, como em [a conversão de parâmetro de rota](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre): um número inexistente dá em princípio um `404` antes que o controle de acesso seja chamado. Para os tipos de entidade comuns, o Drupal pode também **gerar** essa rota a partir da chave `route_provider` do tipo, sem que ela seja escrita à mão.

### O gerenciador de controle de acesso

O gerenciador estende a classe base do núcleo e implementa `checkAccess()`, que recebe a entidade, a operação (`'view'`, `'update'`, `'delete'`) e a conta.

```php
<?php

// espaço de nomes (ver a POO em PHP): a pasta lógica onde vive a classe
namespace Drupal\exemple_articles;

use Drupal\Core\Access\AccessResult;                 // fábrica dos resultados de acesso
use Drupal\Core\Access\AccessResultInterface;        // o tipo de um resultado de acesso
use Drupal\Core\Entity\EntityAccessControlHandler;   // a classe base fornecida pelo núcleo
use Drupal\Core\Entity\EntityInterface;              // o tipo de qualquer entidade
use Drupal\Core\Session\AccountInterface;            // o tipo de uma conta

// nosso gerenciador de acesso: herda todo o trabalho comum do núcleo
class ArtigoAccessControlHandler extends EntityAccessControlHandler {

  // chamada pelo núcleo com a entidade, a operação pedida e a conta
  protected function checkAccess(
    EntityInterface $entity,
    $operation,
    AccountInterface $account
  ): AccessResultInterface {
    if ($operation === 'view') {
      // autorizado se a conta tiver a permissão, senão neutro (sem opinião)
      return AccessResult::allowedIfHasPermission($account, 'view exemple articles');
    }
    return AccessResult::neutral(); // qualquer outra operação: sem opinião
  }

}
```

| Elemento | Papel |
|---|---|
| `AccessResult::allowedIfHasPermission($conta, 'texto')` | `allowed` se a conta tiver a permissão, senão `neutral` |
| `AccessResult::neutral()` | « Sem opinião »: a recusa por padrão se aplica se ninguém disser sim |
| `AccessResult::forbidden()` | Veto definitivo |
| `checkAccess()` chamada por `access()` | O núcleo a chama depois de consultar os hooks dos outros módulos, exceto se um deles proibir |
| Declaração das permissões | Um arquivo do módulo (`*.permissions.yml`) lista as permissões que existem |

Outros módulos podem dar sua opinião sobre qualquer entidade por meio de **hooks** (ver [a inversão de controle e os pontos de extensão](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)): `hook_entity_access()` para todos os tipos, `hook_ENTITY_TYPE_access()` para um tipo específico. Suas respostas são combinadas com a do gerenciador por uma lógica do mesmo gênero que `ou` (a ordem é a seguinte: os hooks `hook_entity_access()` e `hook_ENTITY_TYPE_access()` são consultados primeiro; se um deles proibir, `checkAccess()` não é chamada; caso contrário, o seu resultado é combinado aos deles por `orIf()`): é exatamente o papel da nossa `RegraBloqueio`, um módulo externo que impõe um veto sem conhecer as regras dos artigos.

### Onde ficam as peças na arquitetura

| Peça | Capítulo que a explica |
|---|---|
| O registro dos gerenciadores é um **serviço** do núcleo, fabricado por um contêiner | [O contêiner de serviços](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services) |
| Os tipos de entidade são descobertos pelo núcleo (anotação ou atributo) | [A arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| Os hooks de acesso dos outros módulos | [Inversão de controle e pontos de extensão](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) |
| O gerenciador recebe suas dependências pelo seu construtor | [A POO em PHP](/?c=langages&s=php&p=poo) |

Em uma classe do seu módulo, **injetamos** o gerenciador de tipos de entidade pelo construtor, em vez de chamar `\Drupal::entityTypeManager()`: a chamada estática torna a classe difícil de testar (ver [o contêiner de serviços](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services), seção « Testar: substituir um serviço por um falso »).

## As listas e as consultas: a outra porta de entrada

O controle de acesso de uma página de entidade protege somente essa página. Uma lista de artigos, um mecanismo de busca, um feed de notícias, uma interface de programação (API) podem mostrar os mesmos dados sem passar pela rota.

| Porta de entrada | Onde verificar o acesso |
|---|---|
| Página da entidade | A rota (`_entity_access`) |
| Lista construída em PHP | Chamar o gerenciador de acesso para **cada** entidade da lista (`$entidade->access('view')` no Drupal) |
| Consulta no [banco de dados](/?c=domain-specific-languages-dsl&p=sql) filtrada | A própria consulta deve aplicar o filtro; no Drupal, uma consulta de entidade pede `->accessCheck(TRUE)` (ou `FALSE` quando se sabe por quê) |
| Saída [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) de uma API | O mesmo controle da página, antes de transformar os dados em texto JSON |
| Modo prévia em uma página de outro tipo | O mesmo gerenciador de renderização, portanto o mesmo controle de acesso antes |

No nosso mini-exemplo, a proteção é produzir listas somente a partir de `GerenciadorAcesso`: uma função `listar(Conta $conta)` filtraria os artigos com `estAutorizado()` antes de passá-los ao construtor de renderização no modo `previa`.

## As armadilhas

| Armadilha | Consequência | Proteção |
|---|---|---|
| Verificar o acesso na página, mas não na lista ou na API | Um rascunho aparece em uma lista: controle de acesso quebrado | Um único ponto de decisão (o gerenciador), chamado por todas as portas |
| Tratar `Neutro` como `Autoriza` | Uma entidade sem regra aplicável torna-se pública | Recusa por padrão: só `Autoriza` abre |
| Tratar `Neutro` como `Proibido` para combinar | Uma regra que não tem opinião bloqueia as outras: nenhum módulo externo consegue mais abrir um acesso | Três valores distintos, `ou` que deixa um sim vencer um silêncio |
| Um veto que pode ser anulado por um sim | Um administrador vê um artigo bloqueado | `Proibido` sempre vence na combinação |
| Escrever HTML no construtor de renderização ou na rota | A disposição e a segurança do texto se misturam, e outro modo precisa copiar tudo | Construtor: um vetor; motor: o HTML e a neutralização |
| Esquecer de neutralizar o texto de um campo | Falha XSS (ver [XSS em detalhe](/?c=securite&s=cybersecurite&p=xss-en-detail)) | O motor de renderização neutraliza tudo, sem exceção campo a campo |
| Construir a renderização antes de verificar o acesso | Trabalho inútil, e ações secundárias (leituras no banco, escritas em um registro) para um visitante recusado | Primeiro a existência, depois o acesso, depois a renderização |
| Responder `403` quando a existência é sensível | O visitante adivinha quais números existem | `404` idêntico para « ausente » e « proibido » |
| Guardar em cache uma renderização sem levar em conta o visitante | Um visitante recebe a página preparada para outro, rascunho incluído | Indicar do que a renderização depende (a conta, suas permissões) nos metadados de cache |
| Testar os direitos somente com uma conta administradora | Todas as recusas passam despercebidas | Um teste por tipo de conta: visitante, leitor, autor, administrador |
| Substituir um gerenciador do núcleo por uma classe incompleta | Uma página do núcleo chama um método ausente | Estender a classe base, redefinir somente `checkAccess()` |

## Boas práticas

| Boa prática | Motivo |
|---|---|
| Três peças separadas: dado, renderização, acesso | Cada motivo de mudança tem o seu arquivo |
| Uma resposta de acesso com três valores e uma combinação em que o veto vence | Os módulos externos podem proibir ou autorizar sem se conhecerem |
| Recusa por padrão | Uma regra esquecida fecha em vez de abrir |
| Passar pelo gerenciador em cada porta de entrada (página, lista, API) | Uma regra modificada uma vez se aplica em toda parte |
| Um vetor de renderização, depois um motor que escreve o HTML | O texto é neutralizado em um só lugar, e a renderização se testa sem HTML |
| Um modo de exibição por uso (página, lista, prévia) | O mesmo objeto se apresenta de várias formas sem duplicar código |
| Uma rota de entidade que designa um tipo, um modo e uma operação | Acrescentar um tipo de entidade não exige reescrever o roteador |
| Verificar existência, depois direito, depois construir | Nada é produzido para um visitante recusado |
| Decidir o `403` ou o `404` conforme a sensibilidade da existência | Nenhum vazamento de informação sobre o que existe |
| Testar cada regra com uma conta de cada tipo | Os casos de recusa são verificados, não apenas os casos felizes |
| Injetar o gerenciador de tipos em vez de chamá-lo de forma estática | A classe se testa com um gerenciador falso |

## O que reter

| | |
|---|---|
| **Para lembrar** | Exibir uma entidade responde a três perguntas que separamos: qual dado (a entidade), como apresentá-lo (construtor de renderização, que produz um vetor de renderização conforme um modo de exibição, depois motor de renderização que escreve o HTML), temos o direito? (gerenciador de controle de acesso). Uma rota de entidade designa um tipo, um modo e uma operação, sem conhecer a entidade. Uma regra de acesso responde autorizado, proibido ou neutro; um proibido sempre vence, um neutro final recusa. No Drupal 11, essas peças são o `view_builder`, a rota com `_entity_view` e `_entity_access`, e o gerenciador de acesso que devolve `AccessResult`. |
| **Armadilhas a evitar** | Verificar o acesso só na página e esquecer as listas e as APIs; tratar um neutro como um sim; deixar um sim anular um veto; colocar HTML no construtor de renderização; esquecer de neutralizar o texto; construir a renderização antes do controle; revelar a existência com um `403`; guardar em cache sem levar em conta o visitante; testar só com um administrador. |
| **Boas práticas** | Um único ponto de decisão de acesso; recusa por padrão; um veto que vence; um vetor de renderização e depois um motor; um modo por uso; existência, direito, renderização nesta ordem; `404` quando a existência é sensível; um teste por tipo de conta; gerenciadores injetados. |

Para ir além: a [documentação da API das entidades do Drupal](https://www.drupal.org/docs/drupal-apis/entity-api), a do [sistema de roteamento](https://www.drupal.org/docs/drupal-apis/routing-system), e o manual PHP sobre as [enumerações](https://www.php.net/manual/pt_BR/language.enumerations.php).
