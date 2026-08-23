---
order: 1
---

# Como um programa é executado de verdade

Escrever uma função, chamar outra função, declarar uma variável: esses gestos são familiares em qualquer linguagem. Este capítulo olha para o que realmente acontece, depois que o código é compilado, no processador e na memória do computador. É a base indispensável para entender como uma falha de segurança de baixo nível (tratada nos capítulos seguintes) se torna explorável.

## O processador só trabalha com registradores

Um **registrador** é um pequeno espaço de armazenamento diretamente integrado ao processador, com acesso muito mais rápido que a RAM. Um processador x86-64 (a arquitetura mais comum em PCs) expõe vários, cada um com um papel habitual:

| Registrador | Papel habitual |
|---|---|
| `rip` | Endereço da **próxima instrução** a ser executada (*instruction pointer*) |
| `rsp` | Endereço do **topo da pilha** (*stack pointer*), detalhado mais abaixo |
| `rbp` | Endereço de **referência da função em execução** (*base pointer*), para localizar suas variáveis locais |
| `rax`, `rbx`, `rcx`, ... | Registradores gerais: cálculos, valores temporários, valor de retorno de uma função (`rax`) |

Um programa compilado é, no fundo, apenas uma longa sequência de instruções muito simples ("copie este valor neste registrador", "some estes dois registradores", "pule para este endereço se esta condição for verdadeira") que `rip` percorre uma a uma.

## A pilha (stack): onde vivem as chamadas de função

A **pilha** (*stack*) é uma área de memória que armazena, para cada função em execução, tudo o que ela precisa: suas variáveis locais e o endereço para onde voltar quando terminar. Cada chamada de função empilha um novo bloco, chamado **frame**, no topo da pilha; cada retorno de função o desempilha.

```text
chamarA() chama chamarB() que chama chamarC() :

Topo da pilha (rsp)  -->  [ Frame de C : variaveis locais de C, endereco de retorno para B ]
                          [ Frame de B : variaveis locais de B, endereco de retorno para A ]
                          [ Frame de A : variaveis locais de A, endereco de retorno para main ]
Base da pilha              [ ... ]
```

O **endereço de retorno**, salvo automaticamente a cada chamada, é o que permite ao programa saber onde retomar quando a função termina: é exatamente esse valor que uma corrupção de memória (próximo capítulo) pode tentar sobrescrever.

## O heap: a memória alocada sob demanda

Ao contrário da pilha, que se enche e se esvazia automaticamente no ritmo das chamadas de função, o **heap** é uma área de memória que o programa reserva e libera explicitamente, quando precisa (ex: `malloc`/`free` em C), para um dado cujo tempo de vida não corresponde a nenhuma chamada de função específica (ex: o conteúdo de um arquivo carregado em memória, usado bem depois da função que o leu).

| | Pilha (stack) | Heap |
|---|---|---|
| Gerenciamento | Automático, ligado às chamadas de função | Manual ou semiautomático (alocação/liberação explícitas) |
| Velocidade | Muito rápida (basta mover `rsp`) | Mais lenta (o sistema precisa encontrar um espaço livre) |
| Tempo de vida de um dado | Enquanto durar a função que o criou | Até sua liberação explícita, independente da função |
| Erro típico | Escrever além do espaço reservado (ver corrupção de memória) | Usar um dado já liberado (*use-after-free*) |

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um programa compilado é apenas uma sequência de instruções que `rip` percorre, manipulando registradores. A pilha armazena automaticamente as variáveis locais e o endereço de retorno de cada chamada de função; o heap armazena um dado alocado e liberado explicitamente, com tempo de vida independente de uma chamada de função específica. |
| **Ferramentas utilizáveis** | Um depurador (coberto no capítulo de engenharia reversa) para observar registradores e pilha ao vivo durante a execução. |
| **Armadilhas a evitar** | Confundir a pilha (rápida, automática, tamanho limitado) e o heap (flexível, gerenciamento manual): a escolha errada, ou um erro em seu gerenciamento, abre caminho para as falhas do próximo capítulo. |
| **Boas práticas** | Ter sempre em mente que o endereço de retorno salvo na pilha é um dado como qualquer outro em memória: se um programa puder ser levado a sobrescrevê-lo, ele pode ser sequestrado. |
