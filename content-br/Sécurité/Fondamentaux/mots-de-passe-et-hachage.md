---
order: 2
---

# Senhas e hash seguro

Uma senha nunca deve ser armazenada tal como é (em texto puro) em um [banco de dados](/?c=domain-specific-languages-dsl&p=sql): se esse banco vazar algum dia (invasão, backup mal protegido, funcionário mal-intencionado), todas as senhas se tornam imediatamente legíveis, para todas as contas, em todos os sites onde o usuário as reutilizou. O **hash** é a técnica que evita esse cenário.

## O hash: uma função de mão única

Uma **função de hash** transforma uma entrada (a senha) em uma saída de tamanho fixo (o *hash*), com duas propriedades: a mesma entrada sempre produz a mesma saída, e na prática é impossível recuperar a entrada a partir apenas da saída.

```text
"senha123"  ->  hash  ->  ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94
```

> **Não confundir:** uma *tabela hash* (veja [o capítulo dedicado em C](/?c=langages-de-programmation&s=c&p=tables-de-hachage)) é uma estrutura de dados que acelera a busca de um elemento; uma *função de hash criptográfica*, aqui, serve para tornar um segredo ilegível. As duas usam a palavra "hash" para uma operação matemática próxima (transformar uma entrada em uma saída de tamanho fixo), mas com objetivos totalmente diferentes.

Armazenar o hash em vez da senha muda a consequência de um vazamento:

| | Senha armazenada em texto puro | Senha armazenada com hash |
|---|---|---|
| Vazamento do banco de dados | Todas as senhas ficam imediatamente legíveis | Um atacante recupera hashes, não as senhas em si |
| Conexão de um usuário legítimo | Comparação direta do texto informado | O texto informado é hasheado por sua vez, e comparado ao hash |

## Por que um hash "rápido" é perigoso para uma senha

Funções de hash como [SHA-256](https://en.wikipedia.org/wiki/SHA-2) existem há muito tempo e são deliberadamente **rápidas**: ideal para verificar que um arquivo baixado não foi corrompido, catastrófico para uma senha. Um atacante que recupera um banco de hashes não precisa "quebrar" o hash em si: ele testa senhas candidatas (um **ataque de dicionário**), hasheando cada uma e comparando com o resultado roubado. Quanto mais rápido o hash, mais ele consegue testar por segundo.

| Função | Projetada para | Velocidade | Adequada para senhas? |
|---|---|---|---|
| [MD5](https://en.wikipedia.org/wiki/MD5), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), SHA-256 | Verificar a integridade de um arquivo, indexar rapidamente | Bilhões de hashes por segundo em hardware dedicado | Não |
| [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [scrypt](https://en.wikipedia.org/wiki/Scrypt), [Argon2](https://en.wikipedia.org/wiki/Argon2) | Hashear especificamente senhas | Deliberadamente lenta, ajustável | Sim |

> **Cuidado:** usar SHA-256 (ou pior, MD5) para hashear uma senha, pensando que um hash criptográfico "robusto" basta. Essas funções são robustas para seu uso previsto (integridade), mas sua própria rapidez é o que as torna inadequadas aqui: um atacante equipado com hardware especializado pode testar bilhões de combinações por segundo.
>
> **Boa prática:** usar uma função especificamente projetada para senhas (bcrypt, Argon2), cuja lentidão é uma escolha de design deliberada, ajustável para continuar custosa mesmo à medida que o hardware avança.

## O sal: impedir os ataques por pré-cálculo

Sem precaução adicional, um atacante pode pré-calcular de uma vez por todas o hash de milhões de senhas comuns (uma [**rainbow table**](https://en.wikipedia.org/wiki/Rainbow_table)), e então buscar uma correspondência instantânea em um banco roubado. O **sal** (*salt*) combate essa estratégia: um valor aleatório, único para cada senha, combinado a ela antes do hash.

```text
Sem sal  :  hash("senha123")                    -> sempre o mesmo resultado
Com sal  :  hash("senha123" + "a8f3...")         -> resultado diferente para cada usuario
            hash("senha123" + "9c21...")         -> mesma senha, hash diferente
```

Dois usuários com a mesma senha obtêm assim hashes diferentes, e uma rainbow table pré-calculada sem conhecer o sal se torna inútil. O sal não precisa permanecer secreto: geralmente é armazenado ao lado do próprio hash, só a senha original deve permanecer impossível de recuperar.

> **Boa prática:** gerar o sal com um gerador aleatório criptográfico em vez de um gerador clássico (veja [Pseudoaleatoriedade e geradores](/?c=representation-des-donnees&p=aleatoire-et-generateurs), que cita justamente o sal de senha como caso de uso que exige um CSPRNG), para que continue imprevisível.

## Passando para a implementação

Na prática, escolher o algoritmo, gerar o sal e gerenciar sua integração ao hash final fica a cargo de uma função dedicada da linguagem utilizada, nunca a ser reimplementada por conta própria: veja [`password_hash()` e `password_verify()`](/?c=langages-de-programmation&s=php&p=securite) para a implementação concreta em [PHP](/?c=langages-de-programmation&s=php&p=php), que usa bcrypt por padrão e detalha como o sal é integrado ao hash armazenado.

---

## O que reter

| | |
|---|---|
| **O que reter** | Uma senha sempre é hasheada antes de ser armazenada, nunca em texto puro. Uma função de hash rápida (SHA-256, MD5) facilita ataques de dicionário; uma função lenta e ajustável dedicada (bcrypt, Argon2) os retarda deliberadamente. O sal impede os ataques por pré-cálculo (rainbow tables) e garante um hash diferente para uma mesma senha entre dois usuários. |
| **Ferramentas úteis** | bcrypt, Argon2, scrypt para o hash; um gerador aleatório criptográfico para o sal. |
| **Armadilhas a evitar** | Usar SHA-256/MD5 para hashear uma senha. Reimplementar por conta própria a geração do sal ou a comparação de hashes em vez de usar as funções dedicadas da linguagem. |
| **Boas práticas** | Sempre usar uma função de hash projetada para senhas, nunca uma função de hash geral. Deixar a geração do sal a cargo de uma função dedicada em vez de programá-la manualmente. |
