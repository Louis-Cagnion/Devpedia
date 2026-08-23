---
order: 2
---

# A corrupção de memória

As grandes famílias de falhas já cobertas em [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles) (injeção, controle de acesso, configuração...) afetam sobretudo aplicações web. A **corrupção de memória** é uma família à parte, própria de programas compilados (C, C++...) que manipulam diretamente a memória vista em [Como um programa é executado de verdade](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme): ela reúne os casos em que um programa lê ou escreve em um lugar da memória diferente do previsto por seu autor.

## O buffer overflow: escrever além do espaço reservado

Um **buffer** é um espaço de memória de tamanho fixo reservado para um dado (ex: uma string de 16 bytes). Um **buffer overflow** (estouro de buffer) ocorre quando um programa escreve mais dados do que esse espaço pode conter, sem verificar, transbordando para a memória vizinha.

```text
Espaco reservado para "nome" : 8 bytes

Escrita normal :      [ L | U | I | S | \0 |   |   |   ]   -> cabe no espaco reservado

Escrita em estouro (entrada longa demais, nunca verificada) :
                      [ A | A | A | A | A | A | A | A ] [ A | A | A | A ]
                        espaco reservado para "nome"       transborda para a memoria vizinha
                                                            (potencialmente o endereco de retorno,
                                                             ver o capitulo anterior)
```

Na pilha, a memória vizinha de um buffer local costuma conter o **endereço de retorno** da função em execução (ver o capítulo anterior): um estouro suficientemente preciso pode substituí-lo por um endereço escolhido pelo atacante, desviando a execução do programa para um código de sua escolha assim que a função termina.

> **Armadilha:** achar que uma queda (*crash*) é o único sintoma possível. Um buffer overflow que sobrescreve apenas uma variável vizinha, sem derrubar o programa, pode permanecer silencioso enquanto altera seu comportamento (ex: um indicador `eh_administrador` colocado como verdadeiro por acidente).

## O use-after-free: usar uma memória já liberada

Visto no capítulo anterior, um dado no [heap](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) precisa ser explicitamente liberado quando deixa de ser útil. Um **use-after-free** ocorre quando o programa continua usando um ponteiro para essa área depois de tê-la liberado: esse espaço de memória pode, nesse meio-tempo, ter sido realocado para um dado completamente diferente, que o programa então lê ou escreve por engano achando que ainda manipula o dado antigo.

```text
1. O programa aloca memoria para um objeto A, guarda um ponteiro para ele
2. O programa libera esse espaco (A nao existe mais, mas o ponteiro continua existindo)
3. O programa aloca memoria para um objeto B : o sistema reutiliza o mesmo espaco
4. O programa, via seu antigo ponteiro (obsoleto), le/escreve -> na verdade atinge B
```

## O format string: uma entrada tratada como instrução de formatação

Algumas funções (como `printf` em C) aceitam uma **string de formato**, que descreve como exibir os valores seguintes (`%d` para um inteiro, `%s` para uma string...). Um **format string bug** ocorre quando um dado fornecido pelo usuário é usado diretamente como string de formato, em vez de ser um simples argumento a exibir:

```text
// Codigo vulneravel : o dado do usuario E a string de formato
printf(entrada_usuario);

// Se entrada_usuario for "%x %x %x %x", o printf le 4 valores
// da pilha onde nenhum argumento foi fornecido : ele exibe
// conteudo de memoria arbitrario, potencialmente sensivel.

// Codigo correto : o dado do usuario e um ARGUMENTO, nunca o formato
printf("%s", entrada_usuario);
```

A mesma armadilha já vista para a injeção de SQL em [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles): um dado externo tratado como instrução em vez de um simples valor.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A corrupção de memória reúne os casos em que um programa lê ou escreve em um local imprevisto da memória: buffer overflow (escrita além de um espaço reservado, podendo sobrescrever o endereço de retorno), use-after-free (uso de um ponteiro para uma memória já liberada e realocada), format string (dado externo usado como instrução de formatação). |
| **Ferramentas utilizáveis** | Um depurador (próximo capítulo) para observar concretamente um estouro em memória; um fuzzer (ver mais adiante nesta categoria) para descobri-los automaticamente. |
| **Armadilhas a evitar** | Verificar uma entrada apenas pela presença, nunca pelo tamanho real frente ao espaço reservado; reutilizar um ponteiro depois de liberar a memória que ele aponta. |
| **Boas práticas** | Sempre limitar explicitamente uma escrita ao tamanho realmente reservado; colocar um ponteiro em `NULL` imediatamente após liberar sua memória, para que uma reutilização acidental quebre imediatamente em vez de permanecer silenciosa. |
