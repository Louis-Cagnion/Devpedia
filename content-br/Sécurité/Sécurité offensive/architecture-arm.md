---
order: 8
---

# A arquitetura ARM

Os capítulos anteriores desta categoria se apoiam em x86-64, a arquitetura mais comum em PCs. **ARM** é uma arquitetura diferente, hoje onipresente em outros lugares: praticamente todos os smartphones, os chips Apple Silicon (M1 e seguintes) nos Macs, boa parte dos dispositivos conectados. Entender suas diferenças é necessário assim que um alvo deixa de ser um PC comum.

## RISC contra CISC

| | x86 (CISC) | ARM (RISC) |
|---|---|---|
| Filosofia | *Complex Instruction Set Computer*: instruções ricas, que às vezes fazem várias operações de uma vez | *Reduced Instruction Set Computer*: instruções propositalmente simples e uniformes |
| Consequência | Um programa pode caber em menos instruções, cada uma mais complexa de decodificar para o processador | Um programa precisa de mais instruções, mas cada uma executa mais rápido e de forma mais previsível |

Essa diferença de filosofia explica boa parte de por que o ARM domina em dispositivos com bateria (mobile, embarcado): instruções mais simples consomem menos energia por instrução executada.

## Registradores renomeados, os mesmos papéis

Os registradores vistos em [Como um programa é executado de verdade](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) também existem no ARM, com outros nomes:

| Papel | x86-64 | ARM (64 bits) |
|---|---|---|
| Próxima instrução | `rip` | `pc` |
| Topo da pilha | `rsp` | `sp` |
| Endereço de retorno | Salvo na pilha pelo `call` | Salvo diretamente em um registrador dedicado, `lr` (*link register*), antes de ser copiado para a pilha se necessário |
| Registradores gerais | `rax`, `rbx`, `rcx`... | `x0` a `x30` |

A diferença mais notável para exploração: no x86, o endereço de retorno vai direto para a pilha no momento da chamada (`call`), portanto diretamente exposto a um [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) vizinho. No ARM, ele passa primeiro por `lr`, um registrador separado da pilha: um estouro de buffer simples não o atinge automaticamente, o que muda a forma de construir uma exploração, sem tornar o princípio de fundo diferente.

## Por que isso importa cada vez mais

Um binário compilado para x86 não roda como está no ARM (e vice-versa): cada arquitetura tem seu próprio conjunto de instruções, portanto seu próprio assembly a ser lido durante uma [engenharia reversa](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie). Com o espaço crescente do ARM (mobile, Apple Silicon, cloud de baixo custo), um alvo real hoje tem uma chance significativa de não ser x86 de jeito nenhum.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | ARM (RISC, instruções simples e uniformes) difere do x86 (CISC, instruções ricas) e domina em dispositivos com bateria. Os registradores mudam de nome (`pc`/`sp`/`lr`/`x0`-`x30` contra `rip`/`rsp`/`rax`...) e o endereço de retorno passa por um registrador dedicado (`lr`) em vez de ir direto para a pilha. |
| **Ferramentas utilizáveis** | Ghidra e `gdb` (capítulo de engenharia reversa) suportam ambos o ARM, com o mesmo fluxo de trabalho que no x86. |
| **Armadilhas a evitar** | Supor que uma técnica de exploração do x86 funciona do mesmo jeito no ARM sem levar em conta o `lr`. |
| **Boas práticas** | Identificar a arquitetura alvo antes de qualquer análise (`file` em um binário Linux já indica isso diretamente), para escolher desde o início a referência de assembly correta. |
