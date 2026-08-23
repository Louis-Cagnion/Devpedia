---
order: 3
---

# Os fundamentos da engenharia reversa

A **engenharia reversa** (*reverse engineering*) consiste em entender o funcionamento de um programa sem ter acesso ao seu código-fonte, partindo apenas do binário compilado. É uma etapa quase sistemática em segurança ofensiva: um atacante nunca recebe o código-fonte de seu alvo, apenas o programa que ele executa.

## Duas ferramentas complementares: desmontador e depurador

| Ferramenta | O que faz | Exemplo |
|---|---|---|
| **Desmontador** (*disassembler*) | Traduz o binário (sequência de bytes) em instruções assembly legíveis, sem nunca executar o programa | Ghidra, `objdump` |
| **Depurador** (*debugger*) | Executa de fato o programa, permitindo suspendê-lo a qualquer momento para inspecionar registradores, pilha e memória (ver [Como um programa é executado de verdade](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)) | `gdb` |

```text
Desmontador :  Binario --> leitura apenas --> "aqui estao as instrucoes que ele contem"

Depurador :    Binario --> execucao --> pausa em um ponto escolhido --> "aqui esta o estado
                                                                          REAL da memoria
                                                                          neste instante"
```

Os dois se complementam: o desmontador dá uma visão geral rápida sem executar nada (útil diante de um binário potencialmente perigoso), o depurador confirma o que realmente acontece durante a execução, incluindo comportamentos que uma simples leitura do código desmontado não revela (ex: um valor calculado dinamicamente).

## Ler o mínimo de assembly x86

O **assembly** é a representação legível por humanos das instruções que um processador executa diretamente. Algumas instruções x86 já bastam para acompanhar a lógica geral de um programa:

| Instrução | Efeito |
|---|---|
| `mov dest, src` | Copia `src` em `dest` (ex: `mov rax, rbx` copia `rbx` em `rax`) |
| `push`/`pop` | Empilha/desempilha um valor na pilha |
| `call`/`ret` | Chama uma função (empilha o endereço de retorno) / retorna ao chamador (desempilha esse endereço) |
| `cmp` | Compara dois valores (resultado usado pela instrução seguinte) |
| `jmp`/`je`/`jne` | Pula para outra instrução, incondicionalmente (`jmp`) ou conforme o resultado do `cmp` anterior (`je`: se igual, `jne`: se diferente) |

```text
Pseudocodigo :       Assembly equivalente (simplificado) :

if (a == b) {         cmp  rax, rbx      ; compara a (em rax) e b (em rbx)
    fazerX();          jne  senao         ; se diferente, pula para "senao"
} else {               call fazerX
    fazerY();           jmp  fim
}                      senao:
                        call fazerY
                       fim:
```

## Caixa-preta ou caixa-branca

| Abordagem | O que se tem disponível |
|---|---|
| **Caixa-branca** (*white-box*) | O código-fonte está disponível: lê-se diretamente a lógica de negócio |
| **Caixa-preta** (*black-box*) | Só o binário (ou o serviço exposto) está acessível: é preciso deduzir o comportamento observando-o, via desmontador/depurador ou por suas entradas/saídas |

> **Boa prática:** começar sempre pelo desmontador, para uma visão geral rápida e sem risco, antes de passar para o depurador para confirmar um detalhe preciso em execução real: inspecionar um programa inteiro passo a passo em um depurador, sem plano, leva um tempo desproporcional.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A engenharia reversa entende um programa sem seu código-fonte. O desmontador traduz o binário em assembly legível sem executá-lo; o depurador o executa e permite inspecionar seu estado real a qualquer momento. Algumas instruções x86 (`mov`, `push`/`pop`, `call`/`ret`, `cmp`, `jmp`/`je`/`jne`) já bastam para acompanhar a lógica geral de um programa. |
| **Ferramentas utilizáveis** | Ghidra ou `objdump` para desmontar; `gdb` para depurar. |
| **Armadilhas a evitar** | Partir direto para um depurador sem antes ter uma visão geral do código desmontado. |
| **Boas práticas** | Desmontar primeiro para identificar as áreas interessantes, depurar depois para confirmar um comportamento preciso. |
