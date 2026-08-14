---
order: 1
---

# Os conceitos básicos do Git

O Git acompanha a evolução de um projeto, gravando, em cada momento escolhido, um **instantâneo** (snapshot) completo do estado dos arquivos — ao contrário do que se pensa, não se trata de uma simples lista de diferenças linha a linha, embora seja frequentemente assim que se visualiza (`git diff`).

## As três áreas de trabalho

```
Dossier de travail  -->  Zone de staging  -->  Dépôt (historique)
(working directory)      (index)               (commits)

git add                  git commit
```

| Zona | Função |
|---|---|
| **Pasta de trabalho** | Os arquivos tal como existem realmente no disco, que podem ser modificados livremente |
| **Área de staging** (*índice*) | Uma área intermédia: as alterações que se optou explicitamente por incluir no **próximo** commit |
| **Repositório** | O histórico completo, sendo cada commit um instantâneo permanente |

> **Nota:** esta etapa intermédia de staging é uma característica distintiva do Git em relação a outros sistemas mais antigos (como o SVN): permite escolher com precisão **quais** as alterações que fazem parte de um commit, mesmo que vários arquivos tenham sido alterados ao mesmo tempo.

## Um commit: um instantâneo, não uma diferença

Cada commit faz referência a:
- Um instantâneo completo dos arquivos monitorizados neste momento.
- Um ou mais commits **pais** (o(s) commit(s) anterior(es)).
- Um autor, uma data e uma mensagem a descrever a alteração.
- Um identificador único: um **hash SHA-1** (por exemplo, `a3f9c1d...`), calculado a partir do conteúdo — dois commits idênticos teriam o mesmo hash, e a alteração de um commit anterior altera o seu hash (e o de todos os seus descendentes).

```
commit A <-- commit B <-- commit C (HEAD)
```

Cada commit aponta para o seu pai, formando uma cadeia: é essa cadeia que constitui o histórico do projeto.

## `HEAD` : onde se encontra atualmente

`HEAD` é um ponteiro que indica o commit em que está trabalhando atualmente — na maioria das vezes, aponta para o último commit do ramo atual (ver capítulo sobre ramos) e avança automaticamente a cada novo commit.

## Arquivos controlados, não controlados, modificados

```bash
git status
```

`git status` classifica os arquivos da pasta de trabalho em várias categorias: acompanhados e inalterados (nada a assinalar), acompanhados e modificados (ainda não adicionados ao staging), em espera no staging (prontos para o próximo commit) ou não acompanhados (nunca adicionados ao Git, ver capítulo sobre «`.gitignore`»).

Consulte também o capítulo sobre os comandos essenciais para a prática concreta deste ciclo `add` → `commit`.
