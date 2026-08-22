---
order: 9
---

# As exceções

Uma função PHP clássica sinaliza um erro retornando um valor especial (`false`, `null`) ou emitindo um aviso, que o código chamador deve se lembrar de verificar explicitamente a cada chamada. As **exceções** propõem um mecanismo diferente: um erro **interrompe** imediatamente o fluxo normal do código e sobe automaticamente até que um bloco previsto para tratá-lo o intercepte, sem que nenhuma verificação manual seja necessária em cada etapa intermediária.

## `try` / `catch`: interceptar um erro

```php
<?php
function dividir(float $a, float $b): float
{
    if ($b === 0.0) {
        throw new DivisionByZeroError("Divisao por zero");
    }
    return $a / $b;
}

try {
    echo dividir(10, 0);
} catch (DivisionByZeroError $e) {
    echo "Erro: " . $e->getMessage();  // "Erro: Divisao por zero"
}
```

- `throw` lança uma exceção: ela interrompe imediatamente a função atual, sem executar o resto de seu código.
- `try` delimita o código a monitorar; `catch` recebe a exceção se uma delas for lançada dentro do bloco `try`, com um tipo preciso (aqui `DivisionByZeroError`) que determina quais exceções esse bloco intercepta.
- `$e->getMessage()` retorna a mensagem associada à exceção, fornecida no momento do `throw`.

> **Armadilha:** esquecer que uma exceção não interceptada por nenhum `try`/`catch` (em nenhum nível da cadeia de chamadas) trava o script inteiro, com um erro fatal exibido ao usuário. Um `throw` sem rede de segurança em algum lugar do programa não é um tratamento de erro, apenas um travamento adiado.
>
> **Boa prática:** interceptar uma exceção no local onde o programa pode realmente reagir (exibir uma mensagem clara, tentar novamente, registrar em log), não necessariamente o mais próximo possível do `throw`.

## `Exception` vs `Error`: duas famílias sob `Throwable`

PHP distingue duas grandes famílias de objetos que podem ser lançados e interceptados, ambas implementando a interface **`Throwable`**:

| | `Exception` | `Error` |
|---|---|---|
| Origem típica | Lançada explicitamente pelo código de negócio (`throw new ...`) | Lançada pelo próprio PHP para um erro de programação (tipo inválido, método inexistente) |
| Exemplo | `InvalidArgumentException`, uma exceção de negócio personalizada | `TypeError`, `DivisionByZeroError`, `ArgumentCountError` |
| Sentido habitual | Uma situação anormal mas previsível (dado inválido, recurso indisponível) | Um bug no próprio código, descoberto na execução |

```php
<?php
try {
    strlen();  // chamada sem o parametro obrigatorio
} catch (ArgumentCountError $e) {
    echo "Erro de programacao: " . $e->getMessage();
}
```

> **Armadilha:** escrever `catch (Exception $e)` pensando interceptar qualquer erro possível. Um `TypeError` ou um `DivisionByZeroError` **não é** uma `Exception`: são `Error`, um ramo distinto de `Throwable`. Esse `catch` os deixa passar sem interceptá-los.
>
> **Boa prática:** interceptar `Throwable` apenas quando o código realmente precisa reagir a qualquer erro possível (um ponto de entrada global que registra tudo em log antes de travar corretamente, por exemplo); no resto do código, direcionar o tipo de exceção realmente esperado, para nunca mascarar um erro de programação que mereceria ser visto e corrigido.

## Vários `catch`: do mais preciso ao mais geral

Um `try` pode ser seguido de vários blocos `catch`, cada um visando um tipo diferente; PHP executa o **primeiro** cujo tipo corresponde, na ordem em que são escritos:

```php
<?php
try {
    processarPedido($dados);
} catch (EstoqueInsuficienteException $e) {
    echo "Estoque insuficiente: " . $e->getMessage();
} catch (PagamentoRecusadoException $e) {
    echo "Pagamento recusado: " . $e->getMessage();
} catch (Exception $e) {
    echo "Erro inesperado: " . $e->getMessage();
}
```

> **Armadilha:** colocar um `catch` geral (`Exception $e`) **antes** de um `catch` mais específico (`EstoqueInsuficienteException $e`, que herda de `Exception`). O bloco geral então intercepta tudo, incluindo os casos que o bloco específico deveria tratar primeiro: este nunca é executado.
>
> **Boa prática:** sempre ordenar os blocos `catch` do tipo mais específico ao tipo mais geral, nunca o inverso.

## `finally`: executar código em todos os casos

Um bloco `finally`, colocado depois do último `catch`, é executado sistematicamente, tenha ou não sido lançada uma exceção, e mesmo que o `catch` correspondente relance ele mesmo uma exceção:

```php
<?php
$conexao = abrirConexao();
try {
    executarConsulta($conexao);
} catch (ConsultaFalhouException $e) {
    echo "Consulta falhou: " . $e->getMessage();
} finally {
    fecharConexao($conexao);  // sempre executado: sucesso, falha, ou re-throw
}
```

> **Armadilha:** liberar um recurso (conexão, arquivo aberto) apenas ao final do bloco `try`, depois do código que pode falhar. Se uma exceção interromper o bloco antes de alcançar essa linha, o recurso permanece aberto indefinidamente.
>
> **Boa prática:** colocar toda liberação de recurso em um bloco `finally`, nunca apenas ao final do `try`, para garantir que ela seja executada mesmo em caso de erro.

## Criar uma exceção personalizada

Estender `Exception` (ou uma subclasse mais precisa) permite criar um tipo de erro próprio do negócio da aplicação, com seus próprios dados associados:

```php
<?php
class EstoqueInsuficienteException extends Exception
{
    public function __construct(
        private string $produto,
        private int $quantidadeSolicitada,
        private int $quantidadeDisponivel
    ) {
        parent::__construct(
            "Estoque insuficiente para {$produto}: {$quantidadeSolicitada} solicitados, {$quantidadeDisponivel} disponiveis"
        );
    }

    public function getProduto(): string
    {
        return $this->produto;
    }
}

throw new EstoqueInsuficienteException("Teclado", 5, 2);
```

`parent::__construct(...)` transmite a mensagem ao construtor de `Exception` (veja [a herança e as classes](/?c=langages-de-programmation&s=php&p=poo) já vistas): a exceção personalizada continua sendo uma verdadeira `Exception`, interceptável como tal, ao mesmo tempo em que carrega dados adicionais próprios do caso de negócio (`getProduto()`).

> **Boa prática:** criar uma exceção personalizada assim que um chamador precisar reagir diferentemente conforme o tipo preciso de erro (veja a seção anterior sobre múltiplos `catch`), em vez de agrupar tudo sob uma `Exception` genérica e analisar sua mensagem de texto para adivinhar a causa.

## Encadear as exceções: não perder a causa de origem

Relançar uma nova exceção a partir de um bloco `catch` pode fazer perder o rastro do erro de origem, a menos que se transmita explicitamente via o quarto parâmetro do construtor de `Exception`:

```php
<?php
try {
    $dados = json_decode($respostaApi, flags: JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new ApiIndisponivelException("Resposta da API invalida", previous: $e);
}
```

```php
<?php
try {
    chamarApi();
} catch (ApiIndisponivelException $e) {
    echo $e->getMessage();               // "Resposta da API invalida"
    echo $e->getPrevious()->getMessage(); // "Syntax error" (o erro JSON de origem)
}
```

> **Armadilha:** relançar uma nova exceção sem passar a exceção de origem em `previous`. A causa real do problema (aqui, um JSON malformado) desaparece, deixando apenas a mensagem genérica da nova exceção: uma depuração bem mais difícil, em particular em produção onde o erro de origem não é visível em nenhum log.
>
> **Boa prática:** sempre transmitir a exceção interceptada via `previous` ao relançar uma nova exceção, para manter um rastro completo da cadeia de causa e efeito.

Veja também [A programação orientada a objetos](/?c=langages-de-programmation&s=php&p=poo) para a herança de classes reutilizada aqui, e [Segurança](/?c=langages-de-programmation&s=php&p=securite) para o que nunca deve aparecer em uma mensagem de exceção exibida ao usuário (dados sensíveis, detalhes de implementação).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `throw` interrompe o fluxo normal; `try`/`catch` intercepta uma exceção por tipo, `finally` é executado em todos os casos. `Exception` (erros de negócio) e `Error` (erros de programação) são dois ramos distintos de `Throwable`. Uma exceção personalizada estende `Exception`; `previous` encadeia uma nova exceção à sua causa de origem. |
| **Ferramentas utilizáveis** | `try`/`catch`/`finally`/`throw`, `getMessage()`/`getCode()`/`getPrevious()`, `extends Exception` para um tipo de erro de negócio próprio. |
| **Armadilhas a evitar** | Um `throw` nunca interceptado por nenhum `try`/`catch`. `catch (Exception $e)` pensando interceptar também os `Error`. Um `catch` geral colocado antes de um `catch` específico. Liberar um recurso apenas ao final do `try` sem `finally`. Relançar uma exceção sem transmitir `previous`. |
| **Boas práticas** | Interceptar onde o programa pode realmente reagir. Usar `Throwable` apenas para um ponto de entrada global. Ordenar os `catch` do mais específico ao mais geral. Sempre liberar um recurso em um `finally`. Criar uma exceção personalizada assim que um chamador precisar reagir diferentemente conforme o tipo de erro. Sempre encadear via `previous` ao relançar. |
