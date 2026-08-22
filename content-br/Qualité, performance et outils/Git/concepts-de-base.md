---
order: 1
---

# Os conceitos básicos do Git

O **Git** é um software de *controle de versão*: ele mantém em memória o histórico completo das modificações de um projeto, para poder voltar a um estado anterior, entender quem mudou o quê e por quê, ou fazer várias pessoas trabalharem no mesmo código sem sobrescrever o trabalho umas das outras. Os comandos a seguir se executam em um [terminal](/?c=bases-de-l-informatique&p=le-terminal).

O Git acompanha a evolução de um projeto registrando, a cada momento escolhido, um **instantâneo** (snapshot) completo do estado dos arquivos: ao contrário do que se pensa, não é uma simples lista de diferenças linha por linha, mesmo que seja frequentemente assim que se visualiza (`git diff`).

## As três áreas de trabalho

```text
Diretorio de trabalho  -->  Area de staging  -->  Repositorio (historico)
(working directory)         (index)               (commits)

git add                     git commit
```

| Área | Papel |
|---|---|
| **Diretório de trabalho** | Os arquivos tal como existem de fato no disco, modificáveis livremente |
| **Área de staging** (*index*) | Uma área intermediária: as modificações que você escolheu explicitamente incluir no **próximo** commit |
| **Repositório** (*repository*) | O histórico completo, cada commit sendo um instantâneo permanente |

> **Nota:** essa etapa intermediária de staging é uma particularidade do Git em relação a outros sistemas mais antigos (como o [SVN](https://en.wikipedia.org/wiki/Apache_Subversion), não coberto neste site): ela permite escolher precisamente **quais** modificações entram em um commit, mesmo que vários arquivos tenham sido modificados ao mesmo tempo.

## Um commit: um instantâneo, não uma diferença

Cada commit referencia:
- Um instantâneo completo dos arquivos rastreados nesse momento.
- Um ou vários commits **pais** (o(s) commit(s) anterior(es)).
- Um autor, uma data, e uma mensagem descrevendo a mudança.
- Um identificador único: um **hash SHA-1** (ex. `a3f9c1d...`), calculado a partir do conteúdo: dois commits idênticos teriam o mesmo hash, e modificar um commit passado muda seu hash (e o de todos os seus descendentes).

> **SHA-1** (*Secure Hash Algorithm 1*) é uma função de hash: ela transforma um dado de tamanho qualquer em uma impressão digital de tamanho fixo (40 caracteres hexadecimais aqui). Duas propriedades a tornam útil para o Git: a mesma entrada sempre dá a mesma impressão digital, e a menor mudança na entrada produz uma impressão digital totalmente diferente. É isso que permite identificar um conteúdo pela sua impressão digital, e detectar qualquer alteração do histórico.

```text
commit A <-- commit B <-- commit C (HEAD)
```

Cada commit aponta para seu pai, formando uma cadeia: é essa cadeia que constitui o histórico do projeto.

## `HEAD`: onde você está atualmente

`HEAD` é um ponteiro que designa o commit no qual você está trabalhando atualmente; na maior parte do tempo, ele aponta para o último commit da [branch](/?c=git&p=branches) atual, e avança automaticamente a cada novo commit.

## Arquivos rastreados, não rastreados, modificados

```bash
git status
```

`git status` classifica os arquivos do diretório de trabalho em várias categorias: rastreados e inalterados (nada a relatar), rastreados e modificados (ainda não adicionados ao staging), aguardando no staging (prontos para o próximo commit), ou não rastreados, nunca adicionados ao Git (veja o capítulo [O arquivo .gitignore](/?c=git&p=gitignore)) para excluir voluntariamente certos arquivos desse rastreamento.

Veja também [Os comandos essenciais](/?c=git&p=commandes-essentielles) para a prática concreta desse ciclo `add` → `commit`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Git registra instantâneos completos (não diferenças) em três áreas sucessivas: diretório de trabalho → staging (`git add`) → repositório (`git commit`). Cada commit tem um hash SHA-1 único e aponta para seu commit pai, formando o histórico. `HEAD` designa o commit atualmente ativo. |
| **Ferramentas utilizáveis** | `git status` para ver o estado dos arquivos; `git add`/`git commit` para fazer uma mudança avançar do diretório de trabalho para o repositório. |
| **Armadilhas a evitar** | Confundir o staging com um simples rascunho: enquanto um arquivo modificado não é adicionado (`git add`), ele não fará parte do próximo commit, mesmo que o commit seja feito logo em seguida. |
| **Boas práticas** | Verificar `git status` antes de cada commit para nunca incluir um arquivo por engano (ou esquecer um). |
