---
order: 17
---

# A máquina de estados de uma aplicação

Um artigo de blog passa por várias etapas: a gente o escreve, alguém o revisa, o publica e, um dia, o arquiva. Essa etapa fica registrada em um campo, muitas vezes chamado **estado**. Se qualquer trecho de código puder gravar nele qualquer valor, a aplicação acaba com artigos « publicados » que ninguém revisou, ou « arquivados » sem nunca terem estado no ar. Uma **máquina de estados de aplicação** resolve isso: declara-se uma vez, em uma tabela, quais estados existem e quais passagens de um para outro são permitidas, e um único lugar do código aplica essa tabela.

Este capítulo se apoia nas [exceções em PHP](/?c=langages&s=php&p=exceptions) e nas [classes e métodos](/?c=langages&s=php&p=poo). O mesmo princípio serve para analisar um texto passo a passo, como mostra a [análise incremental por máquina de estados](/?c=langages&s=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats); aqui, porém, a máquina não lê um texto, ela protege a vida de um registro. Sistemas de gerenciamento de conteúdo como o Drupal (um software em PHP que permite construir e administrar um site) funcionam assim para o estado de publicação. Os exemplos abaixo continuam genéricos e não usam nenhum código desse software.

## As palavras a conhecer

| Termo | Sentido | Exemplo |
|---|---|---|
| Estado (ou status) | A situação de um objeto em um dado instante, uma só por vez | `rascunho` |
| Transição | A passagem de um estado para outro | de `rascunho` para `em_revisao` |
| Transição permitida | Uma passagem que a regra de negócio autoriza | `em_revisao` para `publicado` |
| Transição proibida | Uma passagem que a regra recusa | `rascunho` para `publicado` |
| Estado final | Um estado do qual não se sai mais | `arquivado` |
| Efeito | Uma ação disparada por uma transição precisa | registrar a data de publicação |

## O esquema dos estados

Cada seta é uma transição permitida. Tudo o que não está desenhado é proibido.

```text
              +--------------+
              |   rascunho   |<-----------+
              +------+-------+            |
                     |                    |
                     v                    |
              +--------------+            |
              |  em_revisao  |------------+
              +------+-------+   (devolução para correção)
                     |
                     v
              +--------------+
              |   publicado  |
              +------+-------+
                     |
                     v
              +--------------+
              |   arquivado  |   (estado final)
              +--------------+
```

## O problema: um estado livre, sem guarda

Sem máquina de estados, o estado é apenas uma cadeia de caracteres que cada parte do código altera como quer.

```php
<?php
$artigo = ['titulo' => 'Os estados', 'estado' => 'rascunho']; // um artigo recém-criado
$artigo['estado'] = 'publicado';          // pula a revisão: ninguém impede
$artigo['estado'] = 'publicado ';         // um erro de digitação também é aceito
$artigo['estado'] = 'arquivado';          // e dá para arquivar o que nunca existiu
```

Cada linha é aceita sem a menor verificação. A **guarda** (o controle colocado antes da mudança, que recusa ou autoriza) está ausente.

## Os estados impossíveis

Outro erro frequente substitui um estado único por várias caixas de seleção (booleanos, valores verdadeiro ou falso). Duas caixas dão quatro combinações, e algumas não têm nenhum sentido.

| `esta_publicado` | `esta_arquivado` | Significado |
|---|---|---|
| falso | falso | Rascunho ou revisão, não se sabe qual |
| verdadeiro | falso | Publicado |
| falso | verdadeiro | Arquivado, mas nunca publicado? Caso ambíguo |
| verdadeiro | verdadeiro | Publicado e arquivado ao mesmo tempo: estado impossível |

Um campo único, que só aceita os valores da tabela, torna essas combinações **impossíveis de representar**: não se pode escrever o que não existe. É o mesmo princípio de [um único mecanismo por informação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-seul-mecanisme-par-information).

## Os `if` espalhados

Outra ladeira escorregadia: verificar a regra à mão, em cada lugar que altera o estado.

```php
<?php
function botaoPublicar(array $artigo): void        // chamada pela página de edição
{
    if ($artigo['estado'] === 'em_revisao') {      // regra escrita uma primeira vez
        echo "Publicar";                           // exibe o botão
    }
}

function importarArtigo(array $linha): array       // chamada por uma importação de arquivo
{
    if ($linha['estado'] === 'publicado') {        // regra reescrita, já diferente
        $linha['data'] = date('Y-m-d');            // esquece o controle da revisão
    }
    return $linha;                                 // devolve a linha, nunca recusada
}
```

Essas duas funções aplicam, cada uma, a sua versão da regra. No dia em que se acrescenta um estado, é preciso encontrar todos os `if`, e sempre se esquece um. A solução é a descrita em [evitar a repetição com estruturas indexadas](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees): uma tabela de dados, percorrida por um único código.

## A tabela das transições

Um **array associativo** (uma lista em que cada valor é encontrado por um nome, sua chave) indica, para cada estado, a lista dos estados seguintes permitidos. Uma **constante** (`const`) é um valor nomeado que não pode mais ser alterado depois de declarado.

| Estado atual | Transições permitidas |
|---|---|
| `rascunho` | `em_revisao` |
| `em_revisao` | `rascunho`, `publicado` |
| `publicado` | `arquivado` |
| `arquivado` | nenhuma |

```php
<?php
const TRANSITIONS = [                              // a tabela: uma única fonte de verdade
    'rascunho'   => ['em_revisao'],                // um rascunho vai para revisão
    'em_revisao' => ['rascunho', 'publicado'],     // a revisão corrige ou publica
    'publicado'  => ['arquivado'],                 // um artigo publicado termina arquivado
    'arquivado'  => [],                            // estado final: nenhuma saída
];
```

Acrescentar um estado equivale a acrescentar uma linha nessa tabela, e em nenhum outro lugar. É a [fonte única da verdade](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite).

## Recusar uma transição ilegal, com uma mensagem clara

Uma função única, `changerStatut`, é a única porta de entrada. Ela verifica a tabela e lança uma **exceção** (um sinal de erro que o código chamador pode capturar, veja o capítulo sobre as [exceções](/?c=langages&s=php&p=exceptions)), cuja mensagem nomeia a causa. O princípio é o de [uma mensagem de erro para cada causa](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-message-d-erreur-par-cause): a mensagem diz qual estado, qual alvo e o que era permitido.

```php
<?php
class TransitionInterdite extends DomainException {}   // um tipo de erro dedicado a este caso

function changerStatut(array $artigo, string $alvo): array
{
    $atual = $artigo['estado'] ?? '';                  // lê o estado, vazio se faltar
    if (!array_key_exists($atual, TRANSITIONS)) {      // o estado atual é conhecido?
        throw new TransitionInterdite(                 // senão, recusa com a causa
            "Estado atual desconhecido : « $atual »."
        );
    }
    if (!array_key_exists($alvo, TRANSITIONS)) {       // o estado de destino existe?
        throw new TransitionInterdite(                 // senão, recusa com a causa
            "Estado de destino desconhecido : « $alvo »."
        );
    }
    $permitidos = TRANSITIONS[$atual];                 // os alvos permitidos a partir daqui
    if (!in_array($alvo, $permitidos, true)) {         // o alvo está na lista?
        $lista = $permitidos ? implode(', ', $permitidos) : 'nenhuma';   // texto da lista
        throw new TransitionInterdite(                 // recusa nomeando as opções
            "Passagem de « $atual » para « $alvo » proibida. Permitidos : $lista."
        );
    }
    $artigo['estado'] = $alvo;                         // a única linha que grava o estado
    return $artigo;                                    // devolve o artigo alterado
}
```

| Caso testado | Resultado |
|---|---|
| `rascunho` para `em_revisao` | aceito |
| `rascunho` para `publicado` | recusado, mensagem: permitido `em_revisao` |
| `arquivado` para `rascunho` | recusado, mensagem: permitido `nenhuma` |
| `publicado` para `Publicado` (erro de maiúscula) | recusado, estado de destino desconhecido |

O terceiro parâmetro `true` de `in_array` impõe uma comparação estrita: sem ele, o PHP pode considerar iguais valores de tipos diferentes.

## Os efeitos ligados a uma transição

Algumas ações só fazem sentido para uma passagem precisa: registrar a data no momento da publicação, avisar o autor quando o texto volta para rascunho, retirar o artigo do site ao arquivá-lo. Elas ficam em uma segunda tabela, indexada pelo par `origem>destino`. Cada efeito é uma **função anônima** (uma função sem nome, escrita diretamente no lugar em que é guardada, aqui com a forma curta `fn`).

| Transição | Efeito |
|---|---|
| `rascunho>em_revisao` | registrar a data do pedido de revisão |
| `em_revisao>publicado` | registrar a data de publicação |
| `publicado>arquivado` | registrar a data de arquivamento |

```php
<?php
const FORMAT_DATE = 'Y-m-d';                              // formato das datas gravadas

function effets(): array                                  // a tabela dos efeitos
{
    return [
        'rascunho>em_revisao' => fn(array $a): array      // ao pedir a revisão
            => $a + ['revisao_em' => date(FORMAT_DATE)],
        'em_revisao>publicado' => fn(array $a): array     // na publicação
            => $a + ['publicado_em' => date(FORMAT_DATE)],
        'publicado>arquivado' => fn(array $a): array      // no arquivamento
            => $a + ['arquivado_em' => date(FORMAT_DATE)],
    ];
}

function transiter(array $artigo, string $alvo): array
{
    $origem = $artigo['estado'] ?? '';                    // guarda o estado de origem
    $artigo = changerStatut($artigo, $alvo);              // valida, lança se proibido
    $chave = "$origem>$alvo";                             // chave da tabela dos efeitos
    $efeito = effets()[$chave] ?? null;                   // procura o efeito dessa passagem
    return $efeito ? $efeito($artigo) : $artigo;          // executa se existir
}
```

A ordem importa: a validação vem **antes** dos efeitos. Uma transição recusada lança a exceção na linha de `changerStatut`, e a linha que executa o efeito nunca é alcançada. O operador `+` entre dois arrays acrescenta as chaves que faltam sem alterar as que já existem.

Os efeitos que prolongam uma transição (enviar um e-mail, esvaziar um cache) podem também passar por pontos de extensão que outros módulos conectam, como em um capítulo vizinho dedicado aos hooks e aos eventos; este capítulo mantém a tabela, mais simples enquanto os efeitos forem poucos.

## Ver a máquina em funcionamento

```php
<?php
$artigo = ['titulo' => 'Os estados', 'estado' => 'rascunho'];   // ponto de partida
$artigo = transiter($artigo, 'em_revisao');                     // transição permitida
$artigo = transiter($artigo, 'publicado');                      // transição permitida
echo $artigo['estado'], ' em ', $artigo['publicado_em'], "\n";  // exibe o estado final
try {
    transiter($artigo, 'rascunho');                             // publicado para rascunho
} catch (TransitionInterdite $e) {                              // captura a recusa
    echo $e->getMessage(), "\n";                                // exibe a causa
}
```

A saída do último bloco se parece com:

```text
publicado em 2026-10-31
Passagem de « publicado » para « rascunho » proibida. Permitidos : arquivado.
```

## Testar a própria tabela

Uma tabela pode conter um erro de digitação: um alvo que não existe, um estado do qual não se sai mais por engano. Um [teste unitário](/?c=tests&p=tests-unitaires) a verifica em poucas linhas.

```php
<?php
function verifierTable(array $tabela): array              // devolve a lista das anomalias
{
    $anomalias = [];                                      // lista vazia no início
    foreach ($tabela as $origem => $alvos) {              // percorre cada estado
        foreach ($alvos as $alvo) {                       // percorre os seus alvos
            if (!array_key_exists($alvo, $tabela)) {      // o alvo tem uma entrada?
                $anomalias[] = "$origem leva a $alvo, desconhecido";   // registra a anomalia
            }
        }
    }
    return $anomalias;                                    // vazia se a tabela estiver sã
}
```

A função acima realiza o primeiro controle da tabela a seguir; os outros dois se escrevem do mesmo jeito, percorrendo a tabela.

| Controle | O que detecta |
|---|---|
| Todo alvo também é uma chave | Erro de digitação em um alvo |
| Ao menos um estado final | Máquina sem fim possível |
| Todo estado é alcançável a partir do primeiro | Estado acrescentado, mas ligado a nada |

## Estado livre, `if` espalhados ou tabela

| Critério | Estado livre | `if` espalhados | Tabela de transições |
|---|---|---|---|
| Valor inválido aceito | sim | às vezes | não |
| Regra escrita em um só lugar | não | não | sim |
| Acrescentar um estado | nada orienta | procurar todos os `if` | uma linha na tabela |
| Mensagem de erro clara | nenhuma | diferente em todo lugar | uma só, nomeia a causa |
| Regra legível de relance | não | não | sim |

## As armadilhas

| Armadilha | Por que é um problema | Reflexo |
|---|---|---|
| Estado livre sem guarda | Qualquer valor é aceito, inclusive um erro de digitação | Uma única função grava o estado e valida antes |
| Várias caixas de seleção em vez de um estado | Estados impossíveis passam a ser representáveis | Um campo único cujos valores são listados |
| Regra copiada em vários `if` | As cópias divergem, e uma delas é esquecida | Uma tabela lida por um único código |
| Gravar o estado diretamente no banco, fora da função | Contorna a guarda, por exemplo em uma importação | Fazer todo caminho, importação incluída, passar por `transiter` |
| Efeito executado antes da validação | Uma transição recusada já teve consequências | Validar primeiro, aplicar depois |
| Dois usuários mudam o estado ao mesmo tempo | Cada um valida sobre um estado já desatualizado | Gravar com uma condição sobre o estado antigo, ver os [bancos de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) |
| Mensagem vaga (« erro de estado ») | O usuário não sabe o que fazer | Nomear a origem, o destino e as opções permitidas |
| Estados renomeados depois | Os valores antigos armazenados viram desconhecidos | Prever uma migração dos dados antes de renomear |

## Boas práticas

| Prática | Motivo |
|---|---|
| Declarar estados e transições em uma tabela de dados | Uma única fonte de verdade, legível de relance |
| Uma única função autorizada a gravar o estado | Nenhum caminho contorna a guarda |
| Validar antes de aplicar os efeitos | Uma recusa não deixa nenhum rastro |
| Uma mensagem de erro que nomeia o estado, o alvo e as opções | A depuração se faz em uma única leitura |
| Um identificador de estado estável, em minúsculas, sem espaço | Os dados já armazenados continuam válidos |
| Um teste que verifica a própria tabela | Detecta um alvo desconhecido antes de ir ao ar |
| Manter os efeitos em uma tabela enquanto forem poucos | Mais simples que um sistema de pontos de extensão |

Documentação oficial de referência: [arrays do PHP](https://www.php.net/manual/pt_BR/language.types.array.php) e [exceções do PHP](https://www.php.net/manual/pt_BR/language.exceptions.php).

## O que reter

| Noção | O que reter |
|---|---|
| Máquina de estados | Um campo com valores listados e uma tabela das passagens permitidas |
| Transição | Uma passagem de um estado para outro, permitida ou proibida pela tabela |
| Guarda | O controle colocado antes da mudança, que recusa com uma exceção clara |
| Efeito | Uma ação ligada a uma transição precisa, executada após a validação |
| Ponto de entrada único | Uma só função grava o estado, importação e interface incluídas |
| Estado impossível | Evitado ao substituir vários booleanos por um único estado |
| Armadilha principal | Um estado livre, ou uma regra espalhada em `if` que divergem |
