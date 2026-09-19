---
order: 15
---

# Responder ao cliente e continuar trabalhando (PHP-FPM)

Às vezes uma requisição precisa responder imediatamente enquanto dispara um cálculo pesado por trás (atualizar um [cache expirado](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant), por exemplo). O **PHP-FPM**, o motor de execução mais comum em produção, permite justamente isso: cortar a conexão com o cliente sem parar o script. A resposta sai imediatamente, o resto do código continua rodando, invisível para o usuário. Este capítulo explica como, e onde estão as armadilhas.

## PHP-FPM: um pool de processos, cada um com uma requisição por vez

Um script PHP precisa de um programa para executá-lo. Esse programa é chamado de **SAPI** (*Server API*): dependendo de qual é usada, o PHP se comporta de forma diferente.

| SAPI | O que é | Uso típico |
|---|---|---|
| CLI | Executa um script pela linha de comando, sem requisição HTTP | Tarefas agendadas, ferramentas de linha de comando |
| Servidor embutido (`php -S`) | Um pequeno servidor HTTP incluído no PHP, um único processo | Apenas desenvolvimento local (veja [configurar um ambiente local](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) |
| **PHP-FPM** (*FastCGI Process Manager*) | Um grupo (*pool*) de processos PHP já iniciados, cada um recebendo uma requisição por vez via o protocolo **FastCGI** | Produção, atrás de um servidor web como Nginx ou Apache |

Cada processo do pool (um **worker**, a mesma noção do capítulo sobre [paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) atende uma requisição, e volta a ficar disponível para a próxima assim que seu script termina:

```text
Nginx (recebe a requisicao HTTP)
        |
        v  (protocolo FastCGI)
   Pool PHP-FPM
   +---------+  +---------+  +---------+
   | worker1 |  | worker2 |  | worker3 |   <- N processos, iniciados com antecedencia
   | ocupado |  | livre   |  | ocupado |
   +---------+  +---------+  +---------+
```

Um worker ocupado só atende uma requisição até seu script terminar: exatamente o detalhe que a técnica deste capítulo contorna.

## O CGI clássico, o ancestral do FastCGI

Antes do FastCGI (usado pelo PHP-FPM acima), a norma **CGI** (*Common Gateway Interface*, anos 1990) resolvia a mesma necessidade de outra forma: um processo **inteiramente novo** lançado para **cada** requisição, via `fork()`/`execve()` (veja [Os processos](/?c=langages-de-programmation&s=c&p=processus)), em vez de um pool de processos já em execução.

```text
FastCGI (PHP-FPM):                     CGI classico:

Pool de workers ja iniciados           Um fork()/execve() POR requisicao
   |                                       |
Requisicao -> worker livre a atende       Requisicao -> novo processo
   |                                       |             lancado, atende,
Continua disponivel para a proxima        |             e termina
                                       Proxima requisicao -> novo
                                       processo, de novo
```

O script CGI não recebe nem o método HTTP nem os parâmetros por meio de uma função: essa informação é transmitida a ele como **variáveis de ambiente**, normalizadas pelo padrão CGI/1.1:

| Variável de ambiente | Conteúdo |
|---|---|
| `REQUEST_METHOD` | O método HTTP (`GET`, `POST`...) |
| `QUERY_STRING` | Os parâmetros depois do `?` da URL |
| `CONTENT_LENGTH` | O tamanho do corpo da requisição, se houver |
| `HTTP_<NOME_CABECALHO>` | Cada cabeçalho HTTP recebido, em maiúsculas com `_` |

O corpo da requisição (para um `POST`) é fornecido na entrada padrão do processo (`stdin`), e sua resposta é lida na saída padrão (`stdout`), reanalisada como um minicabeçalho HTTP seguido do corpo, separados por uma linha em branco (o mesmo formato `\r\n\r\n` de uma requisição HTTP em si).

> **Boa prática:** um processo inteiramente novo por requisição é caro (tempo de inicialização); é exatamente isso que o FastCGI (e o PHP-FPM) foi projetado para evitar, reaproveitando um pool de processos já em execução em vez de lançar um novo a cada vez. O CGI clássico continua relevante para um uso pontual ou pouco frequente (um script executado raramente), onde o custo de inicialização importa menos que a simplicidade.

## `register_shutdown_function()`: executar código bem no final do script

Essa função registra um callback executado logo após o fim do script: seja um final normal, um `exit()`/`die()`, ou a maioria dos erros fatais. Funciona em qualquer SAPI, não só no PHP-FPM.

```php
<?php
register_shutdown_function(function () {
    error_log('Script terminado às ' . date('H:i:s'));
});

echo 'Olá';   // a mensagem de log só aparece depois desta linha, bem no final do script
```

> **Nota:** um callback registrado assim não recebe nenhum parâmetro automaticamente; para passar dados do contexto ao redor, usa-se uma função anônima com `use (...)`, como no exemplo acima.

## `fastcgi_finish_request()`: fechar a conexão sem parar o script

Específica do PHP-FPM (ausente nas outras SAPIs), essa função envia imediatamente ao cliente tudo o que já foi produzido (`echo`...) e fecha a conexão, sem por isso parar o script: o worker continua executando o resto do código, mas o cliente em si já foi embora.

```text
Sem fastcgi_finish_request() :         Com fastcgi_finish_request() :

requisicao -> calculo (6 min) -> resposta  requisicao -> resposta imediata
   o cliente espera 6 minutos                  |
                                                v
                                        calculo (6 min), invisivel para
                                        um cliente que ja foi embora
```

```php
<?php
echo 'Processamento iniciado, volte mais tarde.';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

gerarRelatorioCaro();
```

> **Armadilha:** tudo o que é escrito depois de `fastcgi_finish_request()` (`echo`, cabeçalho HTTP) vai parar no vazio, sem o menor erro: a conexão já está fechada, essa saída é simplesmente perdida.

> **Armadilha:** chamar `fastcgi_finish_request()` sem verificar `function_exists()` antes. O mesmo código executado em CLI ou pelo servidor embutido (`php -S`) lança um erro fatal, já que a função simplesmente não existe nessas SAPIs.

## Combinando as duas: responder e depois atualizar um cache expirado em segundo plano

O caso de uso típico: servir imediatamente um cache em disco expirado, e agendar sua atualização para depois da resposta.

```php
<?php
public function obterCatalogo(): array
{
    $fresco = $this->lerCache();
    if ($fresco !== null) return $fresco;   // cache ainda válido: nada mais a fazer

    $expirado = $this->lerCache(ignorarTtl: true);
    if ($expirado !== null) {
        $this->agendarAtualizacaoEmSegundoPlano($this->arquivoCache);
        return $expirado;                   // responde com o valor expirado enquanto recalcula
    }

    return $this->atualizarAgora($this->arquivoCache);   // primeira chamada: só resta esperar
}

private function agendarAtualizacaoEmSegundoPlano(string $arquivo): void
{
    $bloqueio = $arquivo . '.em_andamento';

    if (is_file($bloqueio) && (time() - (int) @filemtime($bloqueio)) < 600) {
        // uma atualização já está em andamento, não precisa de outra
        return;
    }

    // 'x': falha se o arquivo já existe (criação atômica)
    $identificador = @fopen($bloqueio, 'x');
    if ($identificador === false) return;      // outro worker já ganhou a corrida
    fclose($identificador);

    ignore_user_abort(true);              // vai até o fim mesmo se o cliente já tiver saído

    register_shutdown_function(function () use ($arquivo, $bloqueio) {
        if (function_exists('fastcgi_finish_request')) {
            // o cliente recebe sua resposta aqui, a conexão se fecha
            fastcgi_finish_request();
        }
        try {
            $this->atualizarAgora($arquivo);
        } finally {
            // sempre liberado, mesmo se o cálculo lançou uma exceção
            @unlink($bloqueio);
        }
    });
}
```

- O arquivo `.em_andamento` funciona como trava anticoncorrência: sem ela, cada requisição que vê o cache expirado dispararia seu próprio recálculo em paralelo (a mesma armadilha já detalhada em [stale-while-revalidate](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).
- `fopen(..., 'x')` cria o arquivo de forma atômica: se dois workers chegam ao mesmo tempo, só um obtém um identificador de verdade, o outro recebe `false`.
- O `finally` (veja [tratar erros em PHP](/?c=langages&s=php&p=exceptions)) garante que a trava é liberada mesmo se `atualizarAgora()` lançar uma exceção; caso contrário, a trava ficaria presa até expirar a margem de 10 minutos.

## `ignore_user_abort()`: não depender de um cliente que já foi embora

Por padrão, se o cliente se desconecta (fecha a aba, derruba a conexão) antes do script terminar, o PHP pode interromper a execução no meio do caminho. `ignore_user_abort(true)` desativa essa interrupção: o script vai até o fim aconteça o que acontecer do lado do cliente, algo indispensável aqui já que todo o sentido da técnica é justamente o cliente não esperar o final.

> **Armadilha:** esquecer `ignore_user_abort(true)` antes de registrar o callback. O trabalho em segundo plano pode então parar no meio se o cliente já fechou a página, algo que a essa altura já não tem mais nada a ver com ele.

## Um limite a ter em mente

Essa técnica acelera a resposta percebida pelo cliente, não a capacidade total do pool: o worker permanece ocupado até o script realmente terminar, trabalho em segundo plano incluído. Uma atualização frequente ou pesada pode portanto saturar o pool do mesmo jeito, exatamente como se tivesse bloqueado a resposta. Para um processamento assíncrono de verdade, desacoplado do pool de workers, a resposta certa é uma [fila de mensagens](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=system-design-lexercice) dedicada, não esse truque, reservado a um trabalho de fundo ocasional e razoavelmente curto.

---

## 📋 Resumo

| | |
|---|---|
| **Para lembrar** | O PHP-FPM atende cada requisição em um worker dedicado, liberado ao final do script. `fastcgi_finish_request()` fecha a conexão do cliente sem parar o script; `register_shutdown_function()` executa código logo após o fim normal do script, em qualquer SAPI. O CGI clássico (antes do FastCGI) lançava um processo inteiramente novo por requisição. |
| **Ferramentas utilizáveis** | `register_shutdown_function()`, `fastcgi_finish_request()`, `ignore_user_abort()`, `function_exists()` para checar a disponibilidade de uma função específica de uma SAPI. |
| **Armadilhas a evitar** | Chamar `fastcgi_finish_request()` sem `function_exists()` (erro fatal fora do PHP-FPM); escrever depois dessa chamada achando que vai chegar ao cliente; esquecer `ignore_user_abort(true)`; esquecer a trava anticoncorrência em um cache compartilhado; achar que essa técnica aumenta a capacidade do pool em vez da latência percebida. |
| **Boas práticas** | Checar `function_exists('fastcgi_finish_request')` antes de qualquer chamada; liberar um recurso (trava, arquivo) em um `finally` dentro do callback de encerramento; reservar a técnica para um trabalho de fundo ocasional e curto, uma fila de verdade para o resto. |
