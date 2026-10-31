---
order: 16
---

# Aliases de endereço, redirecionamento 301 e conversão de parâmetro de rota

Um **endereço** (também chamado **URL**, a linha que se lê no topo do navegador, por exemplo `/blog/meu-artigo`) pode ter duas faces: a que o visitante lê e a que o programa realmente usa. Este capítulo constrói, em PHP mínimo e sem framework, um pequeno roteador que cuida dessas duas faces, dos redirecionamentos que evitam quebrar links antigos e da conversão automática de um pedaço de endereço (`12`) em objeto (o artigo número 12). Ele complementa [o roteamento sem framework](/?c=langages&s=php&p=routage): a noção de rota, o ponto de entrada único e o `php -S` são explicados ali, e não são repetidos aqui. Os códigos de status HTTP (`200`, `404`...) são apresentados em [as trocas de dados: API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http), e os objetos PHP (classe, construtor) em [a programação orientada a objetos (POO)](/?c=langages&s=php&p=poo).

> Sistemas de gerenciamento de conteúdo (CMS) como o [Drupal](https://www.drupal.org/docs) oferecem esses mecanismos prontos: um módulo de aliases, um módulo de redirecionamentos e um conversor de parâmetros de rota. O capítulo mostra como eles funcionam por dentro, com código que você pode executar por conta própria.

## Um alias: um endereço legível para um endereço interno

Um programa costuma identificar uma página por um número: `/node/12` quer dizer “o conteúdo número 12”. Isso é prático para a máquina, ilegível para um humano e sem utilidade para um mecanismo de busca (um site que indexa as páginas da web para propô-las em seus resultados). Um **alias de endereço** é um endereço legível (`/blog/meu-artigo`) que designa a mesma página que o **endereço interno** (`/node/12`). O visitante só vê e compartilha o alias.

| Noção | Exemplo | Quem vê | Papel |
|---|---|---|---|
| Endereço interno | `/node/12` | O programa (rotas, banco de dados) | Identificar a página de forma estável, pelo seu número |
| Alias | `/blog/meu-artigo` | O visitante, os mecanismos de busca | Ser legível, memorizável, compartilhável |
| Alias antigo | `/blog/antigo-titulo` | Os links antigos, os favoritos, os mecanismos de busca | Continuar levando à página após uma renomeação |

Onde guardar a correspondência? Em um banco de dados, de verdade. Aqui, um simples array associativo do PHP (uma lista de pares “chave => valor”) basta para entender o princípio.

## O processador de entrada e o processador de saída

Duas funções, chamadas **processadores de endereço**, trabalham em sentidos opostos:

| Processador | Quando executa | Sentido | Exemplo |
|---|---|---|---|
| De entrada | A cada requisição recebida, **antes** do roteamento | alias para endereço interno | `/blog/meu-artigo` vira `/node/12` |
| De saída | Quando o programa escreve um link em uma página | endereço interno para alias | `/node/12` vira `/blog/meu-artigo` |

```text
  Visitante digita         Processador            Roteador
/blog/meu-artigo   --->   de entrada (alias   --->  /node/12  --->  controlador
                          para interno)            (rota)

  Página HTML gerada       Processador
<a href="/blog/...">  <---  de saída (interno  <--- o programa conhece /node/12
                            para alias)
```

O roteador ([capítulo sobre o roteamento](/?c=langages&s=php&p=routage)) só precisa conhecer os endereços internos: ele nem sabe que os aliases existem. O código abaixo é o arquivo `alias.php`: cada linha é comentada.

```php
<?php
// arquivo: alias.php
// tabela de aliases: endereço legível => endereço interno
$alias = [
    '/blog/meu-artigo' => '/node/12',
    '/blog/outro-assunto' => '/node/13',
];

// coloca um endereço em uma forma única: minúsculas, um "/" no início, nenhum no fim
function normalizar(string $caminho): string
{
    // strtolower coloca em minúsculas, trim retira as "/" nas duas pontas
    return '/' . trim(strtolower($caminho), '/');
}

// processador de entrada: alias -> endereço interno
function tratarEntrada(string $caminho, array $alias): string
{
    $caminho = normalizar($caminho); // "/Blog/Meu-Artigo/" vira "/blog/meu-artigo"
    // o operador ?? dá o valor da direita quando o da esquerda não existe
    return $alias[$caminho] ?? $caminho; // alias desconhecido: o endereço fica igual
}

// processador de saída: endereço interno -> alias
function tratarSaida(string $interno, array $alias): string
{
    $inverso = array_flip($alias); // array_flip troca chaves e valores
    return $inverso[$interno] ?? $interno; // sem alias: mantém o endereço interno
}
```

Um pequeno script de teste, executado na linha de comando (`php teste-alias.php`), mostra os dois sentidos.

```php
<?php
// arquivo: teste-alias.php
require __DIR__ . '/alias.php'; // carrega a tabela $alias e as funções

echo tratarEntrada('/blog/meu-artigo', $alias), "\n"; // esperado: /node/12
echo tratarEntrada('/Blog/Meu-Artigo/', $alias), "\n"; // esperado: /node/12
echo tratarEntrada('/contato', $alias), "\n"; // esperado: /contato
echo tratarSaida('/node/12', $alias), "\n"; // esperado: /blog/meu-artigo
```

Resultado obtido:

```text
/node/12
/node/12
/contato
/blog/meu-artigo
```

> **Armadilha:** `array_flip` supõe uma única chave por valor. Se dois aliases levam a `/node/12`, o sentido de saída retém apenas um deles (o último da tabela): escolha sempre um alias **oficial** por página, os outros são aliases antigos (próxima seção).

## Redirecionamento 301 ou 302

Um **redirecionamento** é uma resposta do servidor que diz ao navegador: “o que você procura está em outro lugar, vá para este endereço”. Ele é escrito com um código de status (um número que resume a resposta) e um cabeçalho `Location` (o novo endereço). O código indica se a mudança é definitiva.

| Código | Nome | Sentido | Cache do navegador | Uso típico |
|---|---|---|---|---|
| `301` | Moved Permanently (movida definitivamente) | O endereço antigo não serve mais, use o novo | Retido por muito tempo | Página renomeada, endereço interno para seu alias |
| `302` | Found (encontrada, deslocamento temporário) | A página está em outro lugar por enquanto | Não retido de forma duradoura | Promoção, página de manutenção, teste |
| `308` | Permanent Redirect | Igual a `301`, mas o método HTTP é mantido | Retido por muito tempo | Redirecionamento permanente de um formulário enviado em `POST` |
| `307` | Temporary Redirect | Igual a `302`, mas o método HTTP é mantido | Não retido | Redirecionamento temporário de um formulário enviado em `POST` |

Um **método HTTP** é o verbo da requisição (`GET` para ler, `POST` para enviar um formulário), visto em [as trocas de dados](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Com `301` e `302`, os navegadores transformam historicamente um `POST` em `GET` após o redirecionamento; `307` e `308` proíbem isso. O funcionamento completo é descrito na [documentação da MDN sobre redirecionamentos](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Redirections).

O que realmente diferencia `301` e `302` é o que o leitor faz com eles. Um navegador ou um mecanismo de busca que recebe um `301` substitui o endereço antigo pelo novo em seus favoritos e em seu índice; com um `302`, ele mantém o antigo.

## Manter o alias antigo após uma renomeação

Um artigo muda de título: seu alias passa de `/blog/antigo-titulo` para `/blog/meu-artigo`. Se o alias antigo desaparece, todos os links já publicados (e-mails, favoritos, outros sites) levam a um erro `404` (página não encontrada). A solução: **manter o alias antigo** em uma tabela à parte e responder com um `301` para o alias atual.

O arquivo `redirecionamento.php` faz três coisas: enviar um redirecionamento, guardar a tabela dos aliases antigos e decidir qual redirecionamento aplicar a um endereço pedido.

```php
<?php
// arquivo: redirecionamento.php
require_once __DIR__ . '/alias.php'; // uma única vez: necessário para tratarSaida()

// envia um redirecionamento e depois interrompe o script
function redirecionar(string $alvo, int $codigo = 301): void
{
    header('Location: ' . $alvo, true, $codigo); // true: substitui um Location já enviado
    exit; // sem exit, o resto do script continuaria sendo executado
}

// aliases antigos mantidos após uma renomeação: alias antigo => endereço interno
$antigos = [
    '/blog/antigo-titulo' => '/node/12',
];

// redirecionamentos temporários desejados: endereço pedido => destino
$temporarios = [
    '/promocao' => '/blog/outro-assunto',
];

// devolve [destino, código] se o endereço deve ser redirecionado, senão null
function buscarRedirecionamento(
    string $caminho,
    array $alias,
    array $antigos,
    array $temporarios
): ?array {
    if (isset($temporarios[$caminho])) { // isset: verdadeiro se a chave existe
        return [$temporarios[$caminho], 302]; // deslocamento temporário: 302
    }
    if (isset($antigos[$caminho])) { // alias antigo conhecido
        return [tratarSaida($antigos[$caminho], $alias), 301]; // para o alias atual
    }
    $paraAlias = tratarSaida($caminho, $alias); // /node/12 digitado à mão?
    if ($paraAlias !== $caminho) {
        return [$paraAlias, 301]; // o endereço oficial é o alias, não o endereço interno
    }
    return null; // ?array: o resultado é um array ou null (nada a redirecionar)
}
```

A terceira regra é importante: se alguém digitar diretamente `/node/12`, ele é redirecionado para `/blog/meu-artigo`. Sem ela, a mesma página existiria sob dois endereços, e os mecanismos de busca a contariam como duas páginas concorrentes (um “conteúdo duplicado”).

| Endereço pedido | Caso | Resposta |
|---|---|---|
| `/blog/antigo-titulo` | Alias antigo mantido | `301` para `/blog/meu-artigo` |
| `/node/12` | Endereço interno que tem um alias | `301` para `/blog/meu-artigo` |
| `/promocao` | Redirecionamento temporário desejado | `302` para `/blog/outro-assunto` |
| `/blog/meu-artigo` | Alias atual | Nenhum redirecionamento: a página é exibida |

## Converter um parâmetro de rota em objeto

Uma rota pode conter uma parte variável, escrita entre chaves: `/article/{artigo}`. Para `/article/12`, a parte variável (o **parâmetro de rota**) vale o texto `12`. Cada controlador (a função que constrói a resposta da página) deveria então buscar o artigo no banco e responder `404` se ele não existir: o mesmo código repetido em todo lugar. Um **conversor de parâmetro** (em inglês *param converter*) faz esse trabalho uma única vez, antes do controlador, que recebe diretamente o objeto artigo.

```text
/article/12  --->  parâmetro "12" (texto)
                        |
                        v
               conversor: busca o artigo 12
                  |                       |
        encontrado|                       | não encontrado
                  v                       v
      controlador(objeto Artigo)   resposta 404, controlador nunca chamado
```

Eis o arquivo `conversor.php`. Um **objeto** é um valor que agrupa dados (aqui, um número e um título) e que se manipula de uma vez; a classe `Artigo` (ver [a programação orientada a objetos (POO)](/?c=langages&s=php&p=poo)) descreve sua forma.

```php
<?php
// arquivo: conversor.php
// a classe Artigo descreve um artigo: um número e um título
class Artigo
{
    // "public int $id" no construtor cria diretamente a propriedade $id
    public function __construct(public int $id, public string $titulo)
    {
    }
}

// base de dados imitada: número => objeto Artigo
$artigos = [
    12 => new Artigo(12, 'Meu artigo'),
    13 => new Artigo(13, 'Outro assunto'),
];

// conversor: texto do endereço -> objeto Artigo, ou null se ele não existir
function converterArtigo(string $valor, array $artigos): ?Artigo
{
    if (!ctype_digit($valor)) { // ctype_digit: verdadeiro se o texto só tem algarismos
        return null; // "abc" ou "-1" não são números válidos
    }
    return $artigos[(int) $valor] ?? null; // (int) transforma o texto "12" no número 12
}
```

O roteador `roteador.php` localiza os parâmetros no endereço com uma **expressão regular** (um padrão que descreve uma forma de texto, explicado em [o capítulo sobre a regex](/?c=langages&s=domain-specific-languages-dsl&p=regex)), chama o conversor de cada parâmetro e, depois, o controlador.

```php
<?php
// arquivo: roteador.php
// procura a rota correspondente, converte os parâmetros, chama o controlador
function despachar(string $caminho, array $rotas, array $conversores): void
{
    foreach ($rotas as $modelo => $controlador) {
        // "/article/{artigo}" vira a expressão "#^/article/(?P<artigo>[^/]+)$#"
        $padrao = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $modelo);
        $regex = '#^' . $padrao . '$#';
        // preg_match guarda os pedaços encontrados em $encontrados
        if (!preg_match($regex, $caminho, $encontrados)) {
            continue; // esta rota não serve: tentamos a seguinte
        }
        $parametros = []; // os objetos a passar ao controlador
        foreach ($encontrados as $nome => $texto) {
            if (is_int($nome)) {
                continue; // preg_match acrescenta entradas numeradas: são ignoradas
            }
            $objeto = $conversores[$nome]($texto); // conversor de mesmo nome
            if ($objeto === null) {
                http_response_code(404); // objeto não encontrado: a página não existe
                echo "Não encontrado\n";
                return; // o controlador nunca é chamado
            }
            $parametros[] = $objeto; // objeto pronto para o controlador
        }
        $controlador(...$parametros); // os três pontos entregam cada objeto como argumento
        return; // uma única rota tratada
    }
    http_response_code(404); // nenhuma rota corresponde
    echo "Página desconhecida\n";
}
```

| Valor no endereço | Resultado do conversor | Resposta |
|---|---|---|
| `12` | Objeto `Artigo` número 12 | `200`, o controlador recebe o objeto |
| `999` | `null` (nenhum artigo) | `404`, controlador não chamado |
| `abc` | `null` (não é um número) | `404`, controlador não chamado |
| `-1` | `null` (o sinal `-` não é um algarismo) | `404`, controlador não chamado |

## Montar tudo

O ponto de entrada `index.php` carrega os quatro arquivos, declara o controlador e as rotas e, em seguida, trata a requisição nesta ordem: redirecionamento eventual, tradução do alias, roteamento.

```php
<?php
// arquivo: index.php
require __DIR__ . '/alias.php'; // aliases e processadores
require __DIR__ . '/redirecionamento.php'; // redirecionamentos 301 e 302
require __DIR__ . '/conversor.php'; // classe Artigo e conversor
require __DIR__ . '/roteador.php'; // função despachar()

// controlador: recebe diretamente o objeto Artigo, nunca um número
function exibirArtigo(Artigo $artigo): void
{
    // htmlspecialchars neutraliza os caracteres < e > de um texto exibido na página
    echo '<h1>' . htmlspecialchars($artigo->titulo) . "</h1>\n";
}

// rotas: modelo de endereço => controlador chamado
$rotas = [
    '/node/{artigo}' => 'exibirArtigo',
    '/article/{artigo}' => 'exibirArtigo',
];

// conversores: nome do parâmetro => função de conversão
$conversores = [
    'artigo' => fn(string $texto): ?Artigo => converterArtigo($texto, $artigos),
];

// endereço pedido, sem a parte depois de "?"
$caminho = normalizar(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// 1) é preciso redirecionar?
$redirecionamento = buscarRedirecionamento($caminho, $alias, $antigos, $temporarios);
if ($redirecionamento !== null) {
    redirecionar(...$redirecionamento); // [destino, código] vira dois argumentos
}

// 2) o alias vira endereço interno, 3) o roteador assume
despachar(tratarEntrada($caminho, $alias), $rotas, $conversores);
```

O arquivo é executado com o servidor embutido do PHP (`php -S 127.0.0.1:5611 index.php`; veja [o capítulo sobre o roteamento](/?c=langages&s=php&p=routage) para o seu funcionamento). Resultados coletados com `curl -i` (a opção `-i` mostra também os cabeçalhos da resposta):

| Endereço pedido | Código | Cabeçalho `Location` | Corpo |
|---|---|---|---|
| `/blog/meu-artigo` | `200` | nenhum | `<h1>Meu artigo</h1>` |
| `/blog/meu-artigo/` (barra final) | `200` | nenhum | `<h1>Meu artigo</h1>` |
| `/article/12` | `200` | nenhum | `<h1>Meu artigo</h1>` |
| `/node/12` | `301` | `/blog/meu-artigo` | vazio |
| `/blog/antigo-titulo` | `301` | `/blog/meu-artigo` | vazio |
| `/promocao` | `302` | `/blog/outro-assunto` | vazio |
| `/article/999` | `404` | nenhum | `Não encontrado` |
| `/article/abc` | `404` | nenhum | `Não encontrado` |
| `/blog/desconhecido` | `404` | nenhum | `Página desconhecida` |

## As armadilhas

| Armadilha | Consequência | Solução |
|---|---|---|
| Redirecionar com `301` por engano ou para um teste | O navegador retém o redirecionamento por muito tempo: mesmo após a correção, alguns visitantes continuam sendo reenviados | Testar com `302` e passar para `301` somente quando houver certeza |
| Apagar o alias antigo na renomeação | Todos os links antigos dão `404` | Manter cada alias antigo com um `301` para o alias atual |
| Esquecer o `exit` após `header('Location: ...')` | O script continua e pode produzir conteúdo ou efeitos após o redirecionamento | Isolar o redirecionamento em uma função que chama `exit` |
| Cadeia de redirecionamentos (A para B para C) | Lentidão, risco de loop | Redirecionar diretamente para o alias **atual**, nunca para um alias antigo |
| Dois aliases idênticos para páginas diferentes | Uma página fica inacessível (ou a errada é exibida) | Tornar o alias único no momento do registro |
| Página acessível pelo alias e pelo endereço interno sem redirecionamento | Conteúdo duplicado para os mecanismos de busca | Redirecionar o endereço interno para o alias em `301` |
| Maiúsculas e barra final não normalizadas | `/Blog/Meu-Artigo/` e `/blog/meu-artigo` são dois endereços para um mesmo conteúdo | Normalizar (aqui, `normalizar()`) e redirecionar para a forma oficial |
| Redirecionar para um endereço vindo da requisição (`?next=...`) | Desvio do site para phishing (*open redirect*) | Redirecionar somente para endereços da sua tabela, veja [as falhas do lado do navegador](/?c=securite&s=cybersecurite&p=failles-de-navigateur) |
| Conversor sem validação (`(int) "abc"` vale `0`) | Um texto inválido é tomado como um número válido | Validar o formato (`ctype_digit`) antes de buscar |
| Controlador que recebe um objeto possivelmente vazio | Erro fatal com `null` | O conversor responde `404` antes de chamar o controlador |
| Exibir um título sem escapá-lo | Falha XSS (código injetado na página) | `htmlspecialchars()` na exibição |

## Boas práticas

| Prática | Motivo |
|---|---|
| Um único alias oficial por página, os outros são aliases antigos em `301` | Uma página, um endereço: sem conteúdo duplicado |
| Criar automaticamente o alias antigo na renomeação | Nenhum link publicado quebra |
| `301` para uma mudança definitiva, `302` para uma mudança temporária | O navegador e os mecanismos de busca sabem o que reter |
| Produzir todos os links do site pelo processador de saída | Uma mudança de alias atualiza cada link sem retoque |
| Dar a conhecer ao roteador somente os endereços internos | As rotas não mudam quando um alias muda |
| Um conversor por tipo de objeto, reutilizado por todas as rotas | A busca e o `404` são escritos uma única vez |
| Validar o texto do parâmetro antes de buscar o objeto | Os valores absurdos são recusados corretamente |
| Comparar endereços normalizados (minúsculas, sem barra final) | Nenhum duplicado por simples diferença de maiúsculas |

## O que reter

| Noção | O que reter |
|---|---|
| Alias de endereço | Endereço legível para um endereço interno (`/blog/meu-artigo` para `/node/12`) |
| Processador de entrada | Traduz o alias em endereço interno antes do roteamento |
| Processador de saída | Traduz o endereço interno em alias quando o programa escreve um link |
| Redirecionamento `301` | Definitivo: o navegador e os mecanismos de busca o retêm |
| Redirecionamento `302` | Temporário: o endereço antigo continua válido |
| Alias antigo mantido | Mantém os links antigos vivos após uma renomeação, graças a um `301` |
| Conversor de parâmetro | Transforma o texto do endereço em objeto antes do controlador, `404` se não encontrado |
| Controlador | Recebe diretamente o objeto, sem buscar nem verificar por conta própria |

Para ir além do mesmo princípio em um framework, veja a [documentação do Laravel sobre roteamento](https://laravel.com/docs/routing) (vinculação automática de um parâmetro de rota a um modelo) e a [especificação oficial dos redirecionamentos HTTP](https://www.rfc-editor.org/rfc/rfc9110).
