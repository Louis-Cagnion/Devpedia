---
order: 16
---

# A arquitetura de plugins

Uma aplicação cresce: acrescentamos a ela, sem parar, novos tipos de blocos de exibição, regras de validação e endereços de API. Se cada acréscimo obriga a abrir o mesmo arquivo central para nele incluir uma linha, esse arquivo se torna um ponto de atrito. A **arquitetura de plugins** (*plugin* se traduz por « módulo de extensão ») resolve esse problema: o programa define uma vez um **ponto de extensão**, e depois cada nova funcionalidade chega na forma de uma classe independente, que o programa encontra sozinho, sem que se modifique o seu código central.

Este capítulo se apoia nas classes, nas interfaces e nos namespaces da [programação orientada a objetos em PHP](/?c=langages&s=php&p=poo), e no princípio de [responsabilidade única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage). Sistemas de gestão de conteúdo como o Drupal (um software PHP que permite construir e administrar um site web) se organizam em grande parte assim: seus blocos de exibição, suas restrições de validação e seus recursos de API são todos plugins. Os exemplos abaixo permanecem genéricos e não usam nenhum código desse software.

## O problema: o `switch` que cresce

Sem plugins, a criação de um objeto a partir de um nome costuma se escrever com uma longa sequência de casos. Cada novo bloco obriga a modificar essa função, que precisa conhecer **todas** as classes existentes.

```php
<?php
function criarBloco(string $tipo): object     // recebe o nome do bloco pedido
{
    switch ($tipo) {                          // compara o nome a cada caso conhecido
        case 'boas_vindas':                   // primeiro bloco conhecido
            return new BlocoBoasVindas();     // cria um objeto dessa classe
        case 'relogio':                       // segundo bloco conhecido
            return new BlocoRelogio();        // cria um objeto dessa classe
        default:                              // qualquer outro nome
            throw new InvalidArgumentException("Bloco desconhecido : $tipo");
    }
}
```

| Defeito do `switch` central | Consequência |
|---|---|
| Ele lista todas as classes | Acrescentar um bloco obriga a modificar um arquivo que não tem nada a ver com esse bloco |
| Ele é compartilhado por toda a equipe | Conflitos de mesclagem frequentes, risco de esquecer uma linha |
| Ele não pode ser estendido de fora | Uma extensão distribuída à parte não consegue se acrescentar a ele |

## A ideia: declarar, descobrir, instanciar

O plugin inverte a responsabilidade: já não é o código central que conhece as classes, é cada classe que **se declara** junto a ele. Três etapas se seguem.

```
   Classes do projeto                   Gerenciador de plugins
  +-----------------+     1. descobrir     +----------------------------------+
  | #[Plugin(...)]  |  ------------------> |  catálogo (id => classe)         |
  | BlocoBoasVindas |     lê a etiqueta    |  boas_vindas => BlocoBoasVindas  |
  +-----------------+                      |  relogio => BlocoRelogio         |
  | #[Plugin(...)]  |                      +----------------------------------+
  | BlocoRelogio    |                                  |
  +-----------------+          2. escolhe pelo identificador ('relogio')
  | (sem etiqueta)  |                                  |
  | ignorada        |                      3. instancia (new BlocoRelogio)
  +-----------------+                                  v
                                                objeto pronto para uso
```

| Etapa | Papel | Pergunta à qual responde |
|---|---|---|
| Declaração | Uma etiqueta colada na classe fornece o seu identificador e as suas informações | « Quem sou eu? » |
| Descoberta | O gerenciador percorre as classes candidatas e lê as etiquetas | « Quais plugins existem? » |
| Instanciação | O gerenciador cria o objeto sob demanda, a partir do seu identificador | « Dá-me o plugin `relogio` » |

Os três ingredientes a fornecer são, portanto: um **contrato** (uma interface), uma **etiqueta** (a declaração) e um **gerenciador** (o maestro).

| Ingrediente | Definição | Exemplo neste capítulo |
|---|---|---|
| Contrato | Uma [interface](https://www.php.net/manual/fr/language.oop5.interfaces.php): a lista dos métodos que toda classe que a assina deve oferecer | `PluginDeBloco` com o método `renderizar()` |
| Etiqueta | Uma informação presa à própria classe, legível por outro programa | `#[Plugin(id: 'relogio', ...)]` |
| Gerenciador | Um objeto que mantém o catálogo dos plugins e os fabrica | `GerenciadorDePlugins` |

## O contrato e a etiqueta em PHP

Um **atributo** é, desde o PHP 8, uma etiqueta escrita entre `#[` e `]` logo antes de uma classe, de um método ou de uma propriedade. Ele não faz nada por si só: carrega informações que outro código lerá mais tarde, graças à **reflexão** ([Reflection](https://www.php.net/manual/fr/book.reflection.php)), isto é, a capacidade de um programa de examinar as próprias classes durante a execução.

```php
<?php
// Contrato: todo plugin de bloco sabe produzir o seu texto
interface PluginDeBloco                       // declara a interface (o contrato)
{
    public function renderizar(): string;     // método obrigatório, devolve um texto
}

#[Attribute(Attribute::TARGET_CLASS)]         // este atributo só se põe numa classe
final class Plugin                            // a classe que representa a etiqueta
{
    public function __construct(              // os valores dados entre parênteses
        public readonly string $id,           // identificador único, somente leitura
        public readonly string $rotulo,       // nome legível para uma tela de administração
    ) {
    }
}

#[Plugin(id: 'boas_vindas', rotulo: 'Mensagem de boas-vindas')]  // a etiqueta do plugin
final class BlocoBoasVindas implements PluginDeBloco            // assina o contrato
{
    public function renderizar(): string      // implementa o método exigido
    {
        return 'Olá e bem-vindo!';            // o texto produzido por este bloco
    }
}

#[Plugin(id: 'relogio', rotulo: 'Hora do servidor')]         // a etiqueta do segundo plugin
final class BlocoRelogio implements PluginDeBloco            // assina o mesmo contrato
{
    public function renderizar(): string      // implementa o método exigido
    {
        return 'Agora são ' . date('H:i');    // a hora atual, no formato horas:minutos
    }
}

// Esta classe não tem etiqueta: o gerenciador a ignorará
final class ClasseSemEtiqueta implements PluginDeBloco
{
    public function renderizar(): string      // o contrato é respeitado
    {
        return 'invisível';                   // mas ninguém a descobrirá
    }
}
```

`final` proíbe herdar de uma classe, `readonly` proíbe modificar uma propriedade depois da sua criação: essas duas palavras tornam os plugins mais previsíveis. O nome `Plugin` do atributo é uma escolha do exemplo, nada impõe essa palavra.

## O gerenciador de plugins

O gerenciador faz duas coisas: ele **descobre** (lê as etiquetas para preencher um catálogo, uma tabela que associa cada identificador à sua classe) e depois **instancia** (cria um objeto a partir de uma classe). Ele também verifica se cada classe etiquetada respeita de fato o contrato esperado.

```php
<?php
final class GerenciadorDePlugins
{
    /** @var array<string, array{classe: class-string, rotulo: string}> */
    private array $catalogo = [];             // o catálogo: identificador => informações

    /** @param class-string $contrato interface que cada plugin deve respeitar */
    public function __construct(private readonly string $contrato)  // guarda o contrato
    {
    }

    /** @param list<class-string> $classes classes candidatas a examinar */
    public function descobrir(array $classes): void
    {
        foreach ($classes as $classe) {       // examina cada classe candidata
            $etiquetas = (new ReflectionClass($classe))    // abre a classe em reflexão
                ->getAttributes(Plugin::class);            // obtém os seus atributos Plugin
            if ($etiquetas === [] || !is_subclass_of($classe, $this->contrato)) {
                continue;                     // sem etiqueta ou contrato errado: passa
            }
            $definicao = $etiquetas[0]->newInstance();     // cria o objeto Plugin lido
            $this->catalogo[$definicao->id] = [            // registra no catálogo
                'classe' => $classe,          // a classe a instanciar depois
                'rotulo' => $definicao->rotulo,            // o nome legível
            ];
        }
    }

    /** @return array<string, string> identificador => rótulo */
    public function definicoes(): array
    {
        return array_map(                     // transforma cada entrada do catálogo
            static fn (array $entrada): string => $entrada['rotulo'],  // guarda o rótulo
            $this->catalogo,                  // a tabela a transformar
        );
    }

    public function criar(string $id): object
    {
        if (!isset($this->catalogo[$id])) {   // o identificador não está no catálogo
            throw new InvalidArgumentException("Plugin desconhecido : $id");  // erro claro
        }
        return new $this->catalogo[$id]['classe']();   // cria o objeto da classe encontrada
    }
}
```

Uma [exceção](/?c=langages&s=php&p=exceptions) é lançada para um identificador desconhecido: sem ela, o programa falharia com uma mensagem obscura mais adiante. O uso se escreve em poucas linhas:

```php
<?php
$gerenciador = new GerenciadorDePlugins(PluginDeBloco::class);  // um gerenciador de blocos
$gerenciador->descobrir([                     // dá a lista das classes a examinar
    BlocoBoasVindas::class,                   // plugin etiquetado
    BlocoRelogio::class,                      // plugin etiquetado
    ClasseSemEtiqueta::class,                 // ignorada por falta de etiqueta
]);

print_r($gerenciador->definicoes());          // exibe o catálogo: 2 entradas
echo $gerenciador->criar('boas_vindas')->renderizar(), "\n";   // cria o bloco e o exibe
try {                                         // tenta criar um plugin inexistente
    $gerenciador->criar('ausente');           // o identificador não existe
} catch (InvalidArgumentException $erro) {    // captura o erro anunciado
    echo $erro->getMessage(), "\n";           // exibe « Plugin desconhecido : ausente »
}
```

Resultado obtido na execução: o catálogo contém `boas_vindas` e `relogio` (a classe sem etiqueta está ausente), depois `Olá e bem-vindo!`, depois `Plugin desconhecido : ausente`.

## Onde procurar os plugins: as estratégias de descoberta

O gerenciador recebe aqui uma lista de classes escrita à mão, o que reproduz o defeito do `switch`. Na prática, automatiza-se a busca.

| Estratégia | Princípio | Vantagem | Limite |
|---|---|---|---|
| Lista explícita | O código fornece os nomes das classes | Simples, rápido | É preciso lembrar de atualizá-la |
| Percurso de pasta | O gerenciador carrega todos os arquivos de uma pasta combinada | Basta depositar um arquivo | Carregar todos os arquivos custa tempo |
| Correspondência com o [autoloading](/?c=langages&s=php&p=autoloading) | Um namespace está associado a uma pasta, as classes se carregam sob demanda | Nenhum `require` a escrever | Depende das convenções de nomenclatura |
| Arquivo de configuração | Um arquivo (YAML, JSON) lista os plugins | Legível sem ler o código | Dois lugares a manter sincronizados |

Eis o percurso de pasta, testado com um arquivo depositado numa pasta `plugs/`:

```php
<?php
function classesDaPasta(string $pasta): array      // devolve as classes de uma pasta
{
    $antes = get_declared_classes();          // fotografia das classes já conhecidas
    foreach (glob($pasta . '/*.php') as $arquivo) {    // cada arquivo .php da pasta
        require_once $arquivo;                // carrega-o uma única vez
    }
    return array_values(array_diff(get_declared_classes(), $antes));  // classes novas
}
```

Chamar `$gerenciador->descobrir(classesDaPasta(__DIR__ . '/plugs'))` basta então: acrescentar um plugin equivale a depositar um arquivo na pasta, sem modificar uma única linha do código central.

## Anotação ou atributo

Antes do PHP 8, não existia etiqueta nativa: as bibliotecas liam comentários especiais (as **anotações**), por exemplo `@Block(id="relogio")` dentro de um comentário de documentação. Um atributo é a versão nativa dessa ideia.

| Critério | Anotação (comentário) | Atributo (`#[...]`) |
|---|---|---|
| Natureza | Texto dentro de um comentário | Código reconhecido pela linguagem |
| Leitura | Uma biblioteca precisa analisar o texto | A reflexão do PHP o fornece diretamente |
| Erro de digitação | Silencioso: o comentário é ignorado | Detectado na execução (classe de atributo não encontrada) |
| Ferramentas | Complementação limitada | Complementação e análise estática completas |
| Versões em questão | Bases de código antigas | Código recente |

Os atributos são lidos na execução: para não relê-los a cada requisição, um gerenciador sério guarda o seu catálogo em **cache** (uma cópia conservada para não recalcular), senão a leitura por reflexão de centenas de classes deixa cada página mais lenta.

## O mesmo mecanismo em JavaScript

As classes JavaScript não têm atributos nativos desse tipo. Uma propriedade estática (um valor preso à própria classe, não aos seus objetos) faz então o papel de etiqueta. Veja as [classes JavaScript](/?c=langages&s=javascript&p=poo).

```javascript
// Cada classe carrega sua declaração em uma propriedade estática
class RecursoUsuarios {
  static definicao = { id: 'usuarios', caminho: '/api/usuarios' }; // a etiqueta

  listar() {                                  // método esperado de todo recurso
    return ['Alice', 'Bruno'];                // os dados devolvidos
  }
}

class RecursoArtigos {
  static definicao = { id: 'artigos', caminho: '/api/artigos' };         // a etiqueta

  listar() {                                  // mesmo método, outro dado
    return ['Primeiro artigo'];               // os dados devolvidos
  }
}

class GerenciadorDePlugins {
  #catalogo = new Map();                      // dicionário privado: identificador => classe

  descobrir(classes) {
    for (const classe of classes) {           // examina cada classe candidata
      const definicao = classe.definicao;     // lê a etiqueta, ausente se não declarada
      if (definicao === undefined) continue;  // sem etiqueta: ignora a classe
      this.#catalogo.set(definicao.id, classe);  // registra no catálogo
    }
  }

  criar(id) {
    const classe = this.#catalogo.get(id);    // procura a classe pelo identificador
    if (classe === undefined) throw new Error(`Plugin desconhecido : ${id}`); // erro
    return new classe();                      // cria o objeto
  }
}

const gerenciador = new GerenciadorDePlugins();   // cria o gerenciador
gerenciador.descobrir([RecursoUsuarios, RecursoArtigos, class Outra {}]);
console.log(gerenciador.criar('artigos').listar());   // exibe [ 'Primeiro artigo' ]
try {
  gerenciador.criar('ausente');               // identificador desconhecido
} catch (erro) {
  console.log(erro.message);                  // exibe « Plugin desconhecido : ausente »
}
```

## Um gerenciador, vários tipos de plugins

O gerenciador depende apenas de um contrato: para outro tipo de plugin, muda-se a interface. Eis uma restrição de validação (uma regra que um valor digitado deve respeitar), com as mesmas classes `Plugin` e `GerenciadorDePlugins`.

```php
<?php
// Um segundo tipo de plugin: uma restrição de validação
interface Restricao                           // o contrato de uma restrição
{
    public function valida(string $valor): bool;    // verdadeiro se o valor for aceito
}

#[Plugin(id: 'nao_vazio', rotulo: 'Valor obrigatório')]         // sua etiqueta
final class NaoVazio implements Restricao     // assina o contrato Restricao
{
    public function valida(string $valor): bool
    {
        return trim($valor) !== '';           // recusa uma cadeia vazia ou feita de espaços
    }
}

#[Plugin(id: 'tamanho_max_5', rotulo: 'Cinco caracteres no máximo')]  // sua etiqueta
final class TamanhoMax5 implements Restricao  // assina o contrato Restricao
{
    public function valida(string $valor): bool
    {
        return mb_strlen($valor) <= 5;        // conta os caracteres, acentos incluídos
    }
}

// O mesmo gerenciador, outro contrato
$restricoes = new GerenciadorDePlugins(Restricao::class);   // gerenciador de restrições
$restricoes->descobrir([NaoVazio::class, TamanhoMax5::class, BlocoRelogio::class]);

// Os identificadores vêm de uma configuração (aqui, uma simples tabela)
foreach (['nao_vazio', 'tamanho_max_5'] as $id) {    // restrições pedidas pela configuração
    $resultado = $restricoes->criar($id)->valida('Bom dia') ? 'ok' : 'recusado';
    echo "$id : $resultado\n";                // exibe o veredito de cada restrição
}
print_r(array_keys($restricoes->definicoes()));     // BlocoRelogio não aparece aqui
```

À execução, `nao_vazio : ok`, `tamanho_max_5 : recusado` (« Bom dia » conta sete caracteres), e o catálogo contém apenas as duas restrições: `BlocoRelogio`, embora etiquetada, não assina o contrato `Restricao` e é descartada.

| Tipo de plugin | Contrato típico | O que o plugin traz | Onde o identificador é usado |
|---|---|---|---|
| Bloco de exibição | `renderizar()` devolve um conteúdo | Um trecho de página reutilizável | Uma configuração de layout |
| Restrição de validação | `valida($valor)` devolve verdadeiro ou falso | Uma regra de controle de um campo | As regras de um formulário |
| Recurso de API | Um método por verbo HTTP (`get`, `post`) | As respostas de um endereço de API | A tabela de rotas da API |

## O que o plugin não é

Vários mecanismos vizinhos se confundem facilmente com ele. As noções de inversão de controle e de ganchos (*hooks*), assim como o contêiner de serviços que fornece as dependências aos objetos, pertencem a outros capítulos: aqui nos limitamos à diferença de natureza.

| Mecanismo | O que faz | Diferença com o plugin |
|---|---|---|
| Plugin | Várias variantes de um mesmo papel, escolhidas por identificador | Uma classe por variante, instanciada sob demanda |
| Herança | Uma classe-mãe especializada por classes-filhas | Liga as variantes a uma classe-mãe, sem catálogo nem descoberta |
| `switch` central | Lista as variantes num único arquivo | Precisa ser modificado a cada acréscimo |
| Gancho ou evento | Chama todas as funções inscritas, uma após a outra | Executa todo mundo, enquanto um plugin escolhe um |

## As armadilhas

| Armadilha | Por que é um problema | Reflexo |
|---|---|---|
| Dois plugins com o mesmo identificador | O segundo sobrescreve em silêncio o primeiro no catálogo | Recusar a duplicata com uma exceção no momento da descoberta |
| Esquecer a interface do contrato | O plugin é descoberto e depois falha na chamada de um método ausente | Verificar o contrato na descoberta, como `is_subclass_of` acima |
| Reler a reflexão a cada requisição | Lentidão proporcional ao número de classes | Colocar o catálogo em cache e invalidá-lo na implantação |
| Carregar todos os arquivos de uma pasta | Uma classe com defeito faz toda a descoberta falhar | Capturar o erro arquivo por arquivo e assinalar o plugin defeituoso |
| Um plugin que cria ele mesmo as suas dependências | Plugin difícil de testar, acoplado a um detalhe técnico | Fornecer-lhe as dependências de fora, ver a [injeção de dependências](/?c=langages&s=php&p=poo#injecao-de-dependencias) |
| Identificador digitado à mão em todo lugar | Um erro de digitação só aparece na execução | Constante ou configuração centralizada, ver a [fonte única de verdade](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite) |
| Plugin para só duas variantes | Mecanismo desnecessariamente pesado | Começar com um `switch` e passar aos plugins quando as variantes se multiplicarem |

## Boas práticas

| Prática | Motivo |
|---|---|
| Um contrato claro e pequeno por tipo de plugin | O gerenciador continua simples e o plugin continua fácil de escrever |
| Um identificador estável, em minúsculas, nunca renomeado | As configurações salvas apontam para ele |
| Uma classe por plugin, uma responsabilidade por classe | Princípio da [responsabilidade única](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) |
| Um gerenciador por tipo de plugin | Cada catálogo permanece coerente, com um contrato diferente por catálogo |
| Uma mensagem de erro que nomeia o identificador defeituoso | A depuração se faz em uma leitura |
| Um teste que descobre todos os plugins e verifica o seu contrato | Detecta um plugin mal declarado antes de ir ao ar |
| Documentação oficial de referência | [Atributos PHP](https://www.php.net/manual/fr/language.attributes.overview.php) e [documentação de um sistema de plugins](https://www.drupal.org/docs/drupal-apis/plugin-api) |

## O que reter

| Noção | O que reter |
|---|---|
| Plugin | Uma classe independente que se declara a si mesma, em vez de ser listada num arquivo central |
| Contrato | Uma interface que descreve o que todo plugin de um tipo deve saber fazer |
| Etiqueta | Um atributo PHP `#[...]` (ou uma anotação em comentário) carrega o identificador do plugin |
| Gerenciador | Descobre as classes etiquetadas, preenche um catálogo, instancia sob demanda |
| Descoberta | Lista, pasta ou autoloading; um cache evita reler a reflexão a cada requisição |
| Benefício | Acrescentar uma funcionalidade sem tocar no código central |
| Armadilha principal | Identificadores duplicados e contrato não verificado, a detectar desde a descoberta |
