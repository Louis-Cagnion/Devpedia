---
order: 6
---

# Os argumentos da linha de comando (`argc`, `argv`)

`main` pode receber dois parâmetros opcionais que dão acesso aos argumentos passados ao programa no momento de seu lançamento a partir do terminal, além da forma `int main(void)` já vista.

## A assinatura completa de `main`

```c
int main(int argc, char *argv[])
{
    // ...
}
```

- `argc` (*argument count*): o número de argumentos recebidos, sempre pelo menos `1`.
- `argv` (*argument vector*): um array de strings, um elemento por argumento.

## Exibir todos os argumentos recebidos

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}
```

Executado como `./programa oi 42`, esse programa exibe:

```text
argv[0] = ./programa
argv[1] = oi
argv[2] = 42
```

`argc` vale então `3`: o próprio nome do programa conta como um argumento.

## `argv[0]`: o nome do programa, não o primeiro argumento útil

`argv[0]` sempre contém o caminho usado para lançar o programa (não necessariamente só o nome dele), nunca o primeiro argumento fornecido pelo usuário: esse é `argv[1]`.

## A sentinela `argv[argc]`

O padrão C garante que `argv[argc]` sempre vale `NULL`: isso permite percorrer `argv` sem conhecer `argc` de antemão (`while (argv[i] != NULL)`), mas nada garante o que existe **além** de `argv[argc]`.

> **Armadilha:** ler `argv[i]` sem antes verificar que `i < argc`. Um usuário que executa o programa sem fornecer o argumento esperado provoca então um acesso fora do array: um dos bugs mais comuns para quem está começando com `argc`/`argv`.

```c
if (argc < 2) {
    fprintf(stderr, "Uso: %s <argumento>\n", argv[0]);
    return 1;
}
printf("Argumento recebido: %s\n", argv[1]);   // so alcancado se argc >= 2
```

## Converter um argumento em número

Um argumento sempre chega como uma string, mesmo que pareça um número na linha de comando: `atoi()`/`strtol()` (veja [Converter uma string em número](/?c=langages-de-programmation&s=c&p=variables#converter-uma-string-em-numero-atof-atoi), já visto em *As variáveis*) o convertem explicitamente em um inteiro.

```c
int limite = atoi(argv[1]);   // "42" (string) -> 42 (int)
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `int main(int argc, char *argv[])` dá acesso aos argumentos da linha de comando: `argc` seu número (sempre ≥ 1), `argv` o array de strings correspondente. `argv[0]` é o nome do programa, não o primeiro argumento útil. |
| **Ferramentas utilizáveis** | `argc`, `argv[i]`, a sentinela `argv[argc] == NULL`, `atoi()`/`strtol()` para converter um argumento em número. |
| **Armadilhas a evitar** | Ler `argv[i]` sem verificar antes `i < argc`: acesso fora do array se o usuário não fornecer o argumento esperado. Confundir `argv[0]` (o nome do programa) com o primeiro argumento real (`argv[1]`). |
| **Boas práticas** | Sempre verificar `argc` antes de acessar um `argv[i]` dado, e exibir uma mensagem de uso clara (via `argv[0]`) quando `argc` não corresponde ao esperado. |
