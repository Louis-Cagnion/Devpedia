---
order: 8
---

# Bancos de dados de alto tráfego: nunca bloquear o usuário em um recálculo custoso

Uma consulta que responde em milissegundos em uma tabela pequena pode se tornar um gargalo assim que os dados e o tráfego se multiplicam: se cada visita a uma página relança essa mesma consulta custosa ao vivo, o tempo de resposta do usuário depende diretamente da lentidão dela. Este capítulo cobre as técnicas que evitam esse bloqueio, já anunciadas no princípio geral de [nunca recalcular um resultado que nada pôde mudar desde então](/?c=performance&p=eviter-le-recalcul-redondant), aplicadas aqui especificamente a um banco de dados de alto tráfego.

## Caso concreto: uma consulta de vários minutos atrás de um simples filtro

Uma página exibe uma lista de opções de filtro (as regiões disponíveis, as categorias de produto...), calculada por uma consulta que percorre toda uma tabela de vários milhões de linhas, sem filtro de data. Em um conjunto de dados pequeno, essa consulta responde em menos de um segundo; assim que a tabela se torna volumosa, a mesma consulta pode levar vários **minutos**. Se ela roda a cada carregamento de página, cada usuário espera esses minutos ao vivo por uma informação que, no entanto, muda raramente.

> **Cuidado:** recalcular um dado custoso a cada requisição de usuário simplesmente porque a consulta está correta e dá o resultado certo. Uma consulta correta ainda pode ser uma má ideia se seu custo for desproporcional à atualidade realmente necessária de seu resultado.
>
> **Boa prática:** antes de otimizar a própria consulta (índices, reescrita [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)), perguntar-se primeiro se o resultado realmente precisa ser recalculado a cada visita, ou se pode ser armazenado em cache.

## Cache e stale-while-revalidate

A técnica mais direta: calcular o resultado uma vez, armazená-lo, e depois servir esse valor em cache em vez de relançar o cálculo a cada requisição.

```text
Sem cache:                            Com cache + TTL de 6h:

Requisicao de usuario                 Requisicao de usuario
  -> recalculo completo (minutos)       -> leitura do cache (milissegundos)
  -> resposta                           -> resposta imediata
                                       A cada 6h: recalculo em segundo plano
```

O **TTL** (*Time To Live*) fixa a duração durante a qual um valor em cache é considerado válido antes de ser recalculado. A escolha do TTL depende da frequência real de mudança do dado: opções de filtro que mudam raramente suportam um TTL de várias horas, um dado que muda a cada minuto precisa de um TTL bem mais curto.

O **stale-while-revalidate** («expirado durante a atualização») vai além de um cache simples: ao expirar o TTL, o valor expirado ainda é servido imediatamente ao usuário, enquanto uma tarefa em segundo plano recalcula o novo valor para as requisições seguintes.

| | Cache simples (TTL estrito) | Stale-while-revalidate |
|---|---|---|
| Ao expirar o TTL | A próxima requisição espera o recálculo completo | A próxima requisição recebe o valor antigo imediatamente |
| Atualidade percebida | Sempre atualizada ao custo de lentidões periódicas | Ocasionalmente um pouco desatualizada, nunca lenta |

> **Boa prática:** usar stale-while-revalidate quando um dado ligeiramente desatualizado (de alguns minutos a algumas horas conforme o caso) continua aceitável para o usuário, o que vale para a maioria dos dados que não representam um estado financeiro ou de segurança em tempo real.

## Réplicas de leitura

Uma **réplica de leitura** (*read replica*) é uma cópia do banco de dados, sincronizada continuamente a partir do banco principal, dedicada exclusivamente às consultas de leitura. As escritas continuam indo para o banco principal; as leituras, muitas vezes bem mais numerosas, se distribuem por uma ou várias réplicas:

```text
Escritas   ->  Banco principal
                    |
                    | sincronizacao continua
                    v
Leituras   ->  Replica 1, Replica 2, Replica 3...
```

Isso evita que uma leitura custosa deixe as escritas mais lentas (e vice-versa), e permite adicionar réplicas adicionais à medida que o volume de leituras aumenta, sem tocar no banco principal.

> **Cuidado:** ler imediatamente após uma escrita a partir de uma réplica que ainda não recebeu a sincronização mais recente (*replication lag*): o usuário pode então não ver o dado que ele mesmo acabou de salvar.
>
> **Boa prática:** ler a partir do banco principal logo após uma escrita que precisa ser visível imediatamente para esse mesmo usuário, e reservar as réplicas para leituras que toleram um pequeno atraso.

## Filas e processamento assíncrono

Para uma escrita ou um recálculo pesado (gerar um relatório, redimensionar uma imagem, enviar um lote de e-mails), fazer o usuário esperar até o fim do processamento bloqueia sua requisição sem necessidade. Uma **fila** (*queue*) desacopla a requisição do seu processamento: a requisição do usuário deposita uma tarefa na fila e recebe uma resposta imediata, enquanto um processo separado (um *worker*) processa as tarefas da fila em seu próprio ritmo.

```text
Requisicao de usuario -> deposita uma tarefa na fila -> resposta imediata
                                    |
                                    v
                        Worker processa a tarefa em segundo plano
                                    |
                                    v
                        Usuario notificado ao terminar (ou consulta o status)
```

## Paginação e streaming em vez de um resultado completo

Carregar de uma vez a totalidade de um resultado volumoso (dezenas de milhares de linhas) consome memória e tempo de transferência proporcionais a esse volume, mesmo que o usuário consulte apenas uma fração dele. Duas técnicas evitam esse custo:

| Técnica | Princípio |
|---|---|
| **Paginação** | Dividir o resultado em páginas de tamanho fixo, carregando apenas uma de cada vez |
| **Streaming** | Enviar o resultado à medida que é produzido, em vez de esperar que esteja completo antes de começar a transmiti-lo |

## Connection pooling

Abrir uma conexão com um banco de dados tem um custo nada desprezível (autenticação, estabelecimento do link de rede). Um **pool de conexões** (*connection pool*) mantém um conjunto de conexões já abertas e prontas para uso, reutilizadas de uma requisição para outra em vez de recriadas a cada vez.

> **Cuidado:** abrir uma nova conexão a cada requisição sob alto tráfego. O custo de abertura, insignificante isolado, torna-se significativo ao ser multiplicado por um grande número de requisições simultâneas, e pode até esgotar o número máximo de conexões que o banco aceita.
>
> **Boa prática:** configurar um pool de conexões dimensionado ao tráfego real, em vez de deixar cada requisição gerenciar sua própria conexão.

## Sharding e particionamento

O **particionamento** divide uma tabela volumosa em vários segmentos menores segundo um critério (uma faixa de datas, uma zona geográfica...), mantendo-a no mesmo servidor de banco de dados. O **sharding** vai além: distribui esses segmentos entre servidores fisicamente diferentes, permitindo superar a capacidade de uma única máquina.

```text
Particionamento (1 servidor):          Sharding (varios servidores):

Tabela                                  Servidor A: shard 1 (clientes A-M)
  - Particao 2024                       Servidor B: shard 2 (clientes N-Z)
  - Particao 2025
  - Particao 2026
```

Essas duas técnicas só valem a pena depois que as abordagens anteriores (cache, réplicas, filas) já não bastam: elas adicionam uma complexidade real (uma consulta que atravessa várias partições ou vários shards se torna mais difícil de escrever e otimizar).

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma consulta correta ainda pode ser uma má ideia se for recalculada ao vivo a cada visita enquanto seu resultado muda raramente. Cache/stale-while-revalidate, réplicas de leitura, filas, paginação/streaming, connection pooling e sharding são respostas complementares, não concorrentes, a esse problema. |
| **Ferramentas utilizáveis** | Um cache com TTL e stale-while-revalidate para um dado que tolera uma leve desatualização. Uma fila para um processamento pesado que não deve bloquear a requisição do usuário. Um pool de conexões dimensionado ao tráfego real. |
| **Armadilhas a evitar** | Recalcular um dado custoso a cada requisição por simples hábito. Ler uma réplica logo após uma escrita que precisa ser visível imediatamente. Abrir uma nova conexão a cada requisição sob alto tráfego. |
| **Boas práticas** | Colocar em cache todo resultado custoso cuja atualidade perfeita não seja indispensável. Reservar o sharding/particionamento para os casos em que cache, réplicas e filas já não bastam. |
