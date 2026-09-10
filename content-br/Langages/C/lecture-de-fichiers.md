---
order: 22
---

# Ler um arquivo linha por linha: `fopen`, `fgets`, `getline`

O capítulo sobre [as chamadas de sistema](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) apresenta `open()`/`read()`/`close()`: chamadas brutas, sem formatação, que exigem uma ida e volta ao kernel a cada leitura. A biblioteca padrão C (*libc*) propõe uma camada acima delas, os **fluxos** (*streams*, tipo `FILE *`), que adiciona um buffer interno: ela lê um grande bloco de uma vez, e depois distribui os dados aos poucos, sem refazer uma chamada de sistema a cada pequena leitura.

| | Chamadas de sistema brutas | Fluxos com buffer (libc) |
|---|---|---|
| Funções | `open()`, `read()`, `close()` | `fopen()`, `fgets()`/`getline()`, `fclose()` |
| Tipo manipulado | Um inteiro (descritor de arquivo) | Um `FILE *` (fluxo) |
| Divisão em linhas | Fica a cargo do programa | Feita por `fgets()`/`getline()` |
| Página de manual | Seção 2 (`man 2 open`) | Seção 3 (`man 3 fopen`) |

## Abrir um fluxo: `fopen()`

```c
FILE *fp = fopen("arquivo.txt", "r");
if (!fp) {
    perror("fopen");
    return 1;
}
```

`fopen()` retorna `NULL` em caso de falha (arquivo ausente, permissões insuficientes...): como qualquer chamada que pode falhar, o valor de retorno deve ser verificado antes de qualquer uso do fluxo.

## `fgets()`: um buffer de tamanho fixo fornecido pelo chamador

```c
char buf[256];

while (fgets(buf, sizeof(buf), fp) != NULL) {
    printf("linha lida: %s", buf);
}
fclose(fp);
```

Assinatura: `char *fgets(char *s, int size, FILE *stream)`.

| Parâmetro | Papel |
|---|---|
| `s` | O buffer de destino, já alocado pelo chamador |
| `size` | O tamanho desse buffer (sempre `sizeof(buf)`, nunca uma constante copiada à mão) |
| `stream` | O fluxo aberto por `fopen()` |

`fgets()` retorna `s` se uma linha foi lida, `NULL` no fim do arquivo ou em caso de erro.

> **Armadilha:** se uma linha do arquivo ultrapassar `size - 1` caracteres, `fgets()` para no limite do buffer **sem ler o resto da linha**: a próxima chamada retoma de onde parou. Uma "linha lógica" longa demais pode, assim, acabar dividida em várias chamadas se o buffer for pequeno demais.

## `getline()`: um buffer que a própria função aloca

```c
char *line = NULL;
size_t capacity = 0;
ssize_t len;

while ((len = getline(&line, &capacity, fp)) != -1) {
    printf("linha lida (%zd caracteres): %s", len, line);
}
free(line);
fclose(fp);
```

Assinatura (POSIX): `ssize_t getline(char **lineptr, size_t *n, FILE *stream)`.

| Parâmetro | Papel |
|---|---|
| `lineptr` | Endereço de um `char *`, inicializado com `NULL` antes da primeira chamada: `getline()` o aloca/realoca sozinha |
| `n` | Endereço de um `size_t`, inicializado com `0`: `getline()` mantém ali a capacidade atualmente alocada |
| `stream` | O fluxo aberto por `fopen()` |

`getline()` retorna o número de caracteres lidos (sem contar o `'\0'` final) se uma linha foi lida, `-1` no fim do arquivo ou em caso de erro. Ao contrário de `fgets()`, ela **realoca** enquanto a linha não estiver totalmente lida: nenhuma truncagem é possível, seja qual for o tamanho da linha.

> **Nota:** em ambos os casos, o caractere `'\n'` de fim de linha é **preservado** no buffer (exceto, possivelmente, na última linha do arquivo, se ela não tiver uma quebra de linha final). É importante levar isso em conta antes de comparar o conteúdo lido com um valor esperado.

> **Boa prática:** o buffer alocado por `getline()` deve ser liberado pelo chamador com `free()`, mesmo que tenha sido realocado várias vezes internamente ao longo das chamadas.

## Fechar o fluxo: `fclose()`

```c
fclose(fp);
```

Cada `fopen()` bem-sucedido deve corresponder a exatamente um `fclose()`, seguindo o mesmo princípio de um `malloc()`/`free()` (veja [A gestão de memória](/?c=langages-de-programmation&s=c&p=memoire)) ou de um `open()`/`close()`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `fopen`/`fgets`/`getline`/`fclose` são funções da libc, que adicionam uma camada de buffer (`FILE *`) acima das chamadas de sistema brutas (`open`/`read`/`close`). `fgets` usa um buffer de tamanho fixo fornecido pelo chamador (risco de truncagem); `getline` aloca e realoca sozinha seu buffer (nunca há truncagem). |
| **Ferramentas utilizáveis** | `fopen`, `fgets`, `getline`, `fclose`, `perror` para diagnosticar uma falha de abertura. |
| **Armadilhas a evitar** | Não verificar o retorno de `fopen()` (`NULL`) antes de usar. Uma linha mais longa que o buffer de `fgets()` é dividida em várias chamadas. Esquecer de dar `free()` no buffer alocado por `getline()`. Esquecer que o `'\n'` permanece na linha lida. |
| **Boas práticas** | Sempre verificar `fopen()` antes de usar. Preferir `getline()` a `fgets()` sempre que o tamanho das linhas não for garantidamente limitado. Um `fclose()` para cada `fopen()` bem-sucedido. |
