---
order: 16
---

# Sobrecarga e negação de serviço em nível de aplicação

[Segurança de APIs web](/?c=securite&s=cybersecurite&p=securite-api-web) cobre o rate limiting: limitar o NÚMERO de requisições que um cliente pode enviar. Este capítulo cobre uma família diferente e complementar: requisições aparentemente legítimas e pouco numerosas, mas projetadas para custar muito mais para processar do que seu tamanho sugere. Um rate limiting bem ajustado não protege contra uma única requisição já desmedidamente cara.

## ReDoS: uma regex cujo tempo de execução explode

Alguns padrões de expressão regular, especialmente os que empilham vários grupos quantificados (`(a+)+`, `(a|a)*`), têm um tempo de execução que pode crescer de forma EXPONENCIAL com o comprimento da entrada testada, sobre uma entrada precisamente projetada para nunca encontrar correspondência.

```text
Padrao vulneravel:  ^(a+)+$
Entrada adversa  :  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                     (30-40 "a" seguidos de um caractere que nunca corresponde)

-> O motor de regex tenta TODAS as formas de dividir a string de "a" entre
   o grupo interno e o grupo externo antes de concluir que falhou:
   o numero de combinacoes dobra a cada "a" adicional

30 "a"  -> alguns milissegundos
40 "a"  -> alguns segundos
50 "a"  -> varios MINUTOS, para uma unica requisicao
```

Uma única requisição, de tamanho minúsculo, basta então para ocupar um processo inteiro por um tempo desproporcional: não é mais preciso enviar um grande volume de tráfego para saturar um serviço.

> **Boa prática:** evitar grupos quantificados aninhados em uma regex aplicada a uma entrada externa; impor um tempo máximo de execução a qualquer avaliação de regex sobre um dado não confiável; testar uma regex com uma ferramenta dedicada à detecção de padrões vulneráveis a ReDoS antes de implantá-la.

## Bombas de descompressão

Um arquivo comprimido minúsculo pode representar, depois de descomprimido, um tamanho desmedidamente maior: uma taxa de compressão extrema, alcançável repetindo deliberadamente o mesmo dado milhões de vezes antes de comprimir (o que comprime de forma muito eficiente dados repetitivos).

```text
Arquivo "zip bomb" tipico: alguns kilobytes comprimidos
  -> varios GIGAbytes depois de descomprimidos

Se a aplicacao descomprime o arquivo INTEIRAMENTE em memoria antes
de examina-lo (varredura antivirus, extracao de uma importacao), ela esgota
sua memoria disponivel com um unico arquivo de poucos KB recebido
```

Uma variante XML chama-se **ataque "billion laughs"**: um documento XML declara uma entidade que referencia várias outras, que por sua vez referenciam várias mais, ao longo de vários níveis: um documento de poucas linhas se expande em bilhões de ocorrências depois que todas as entidades são resolvidas (o mesmo mecanismo de entidade já visto para o [XXE](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql), aqui reaproveitado para esgotar recursos em vez de ler um arquivo).

> **Boa prática:** impor um tamanho máximo de descompressão ANTES de descomprimir totalmente um arquivo (a maioria das bibliotecas de (des)compressão expõe um limite configurável), e desativar a resolução de entidades XML externas/aninhadas por padrão (a mesma defesa usada para o XXE).

## Paginação e consultas sem limite

Um endpoint que devolve uma coleção inteira por falta de um `LIMIT`/paginação imposta NO SERVIDOR permite extrair uma tabela inteira em uma única requisição. Um parâmetro de paginação deixado à escolha do cliente (`?limit=`), sem teto, resulta no mesmo problema sob outra forma.

```text
GET /api/clientes            -> sem limite no servidor, devolve TODOS os clientes em uma chamada

GET /api/clientes?limit=999999999
                             -> se o parametro do cliente nunca e limitado no servidor,
                                resulta exatamente no mesmo resultado
```

> **Boa prática:** impor um limite máximo no servidor sobre qualquer coleção retornada, independentemente do que o cliente pedir; limitar explicitamente qualquer valor de `limit`/`per_page` fornecido pelo cliente a um máximo razoável, nunca transmiti-lo tal qual à consulta.

## Esgotamento de recursos locais

Abrir uma conexão, um processo ou uma thread por requisição, sem limite ou reutilização, permite saturar o servidor com um número de requisições que continuaria razoável para uma aplicação que gerencia esse recurso corretamente.

| Recurso | Risco sem limite | Mitigação |
|---|---|---|
| Conexões de rede/banco de dados | Cada requisição abre uma nova conexão sem nunca reutilizá-la ou fechá-la | Pool de conexões de tamanho fixo, reutilizadas entre requisições |
| Processos/subprocessos lançados por requisição | Um servidor que lança um novo processo pesado (navegador pilotado, conversão de arquivo) por requisição do usuário, sem fila nem limite de paralelismo | Fila com um número máximo de tarefas simultâneas, o resto espera em vez de tudo ser lançado ao mesmo tempo |
| Upload de arquivo | Ausência de limite de tamanho em um arquivo enviado | Limite de tamanho imposto no servidor, não apenas no formulário |

## Amplificação de custo via uma API de terceiros

Uma funcionalidade que dispara uma chamada a uma API de terceiros PAGA ou COM COTA (um LLM, um serviço de envio de SMS, uma API de geocodificação) para cada requisição do usuário, sem limite nem cache, desloca o risco: o recurso esgotado nem é mais local (CPU, memória), é diretamente o orçamento ou a cota da conta.

```text
Funcionalidade: "Resuma este texto com IA" -> 1 chamada ao LLM por clique do usuario,
                                                sem limite nem cache

Atacante: script que dispara essa acao milhares de vezes
          -> a fatura explode, ou a cota mensal se esgota em minutos,
             sem que nenhum recurso LOCAL chegue a saturar
```

> **Boa prática:** aplicar um rate limiting específico a qualquer funcionalidade que dispare uma chamada de terceiros cobrada, independentemente do rate limiting geral da API; armazenar em cache um resultado idêntico já obtido em vez de chamar o serviço de terceiros novamente a cada vez.

## Email/notification bombing

Um formulário (contato, cadastro, redefinição de senha) que envia um email ou SMS a um endereço/número FORNECIDO PELO USUÁRIO, sem limite de frequência, pode ser desviado para enviar spam a um terceiro cujo endereço simplesmente se conhece, sem nunca precisar acessar sua conta.

> **Boa prática:** limitar o número de envios por destinatário (não apenas por IP/conta remetente) em qualquer funcionalidade que envie uma comunicação a um endereço fornecido por um terceiro.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Além do simples rate limiting (número de requisições), uma requisição individual pode custar desmedidamente mais do que seu tamanho sugere: ReDoS (tempo de cálculo), bomba de descompressão (memória), paginação sem limite (banco de dados), esgotamento de conexões/processos, amplificação de custo via uma API de terceiros cobrada, ou email bombing contra um terceiro. |
| **Ferramentas utilizáveis** | Tempo máximo de execução em uma regex; limite de tamanho de descompressão; teto no servidor sobre qualquer paginação; pool de conexões/fila de tamanho fixo; cache para uma chamada de terceiros repetida. |
| **Armadilhas a evitar** | Uma regex com grupos quantificados aninhados sobre uma entrada externa. Descomprimir um arquivo inteiramente antes de verificar seu tamanho. Confiar em um parâmetro `limit` fornecido pelo cliente sem teto no servidor. Chamar uma API de terceiros cobrada sem limite nem cache. Enviar um email/SMS a um endereço de terceiro sem limite de frequência. |
| **Boas práticas** | Testar uma regex contra ReDoS antes da implantação. Limitar o tamanho de descompressão de antemão. Limitar qualquer coleção retornada no servidor. Armazenar em cache e limitar especificamente qualquer chamada de terceiros cobrada. Limitar os envios por destinatário, não apenas por remetente. |
