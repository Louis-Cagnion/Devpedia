---
order: 4
---

# A completação avançada

O Bash completa nomes de arquivos e, para alguns comandos, oferece uma lista simples via a tecla Tab. O sistema de completação do zsh (`compsys`) é um motor à parte, sensível ao **contexto**: ele sabe que depois de `git checkout` deve sugerir nomes de branches, e que depois de `kill`, PIDs de processos em execução, não apenas nomes de arquivos.

## Ativar o sistema de completação

```bash
autoload -Uz compinit
compinit
```

Essas duas linhas, colocadas em `~/.zshrc` (veja [Os arquivos de inicialização](/?c=shells&s=zsh&p=fichiers-de-demarrage)), carregam o `compsys`. Sem elas, o zsh se limita a uma completação básica próxima da do Bash.

> **Nota:** `compinit` reconstrói um cache de definições de completação a cada inicialização, o que pode atrasar perceptivelmente a abertura de um novo terminal; daí o uso comum de `compinit -C` (sem revalidar o cache) depois que a configuração estabiliza, ou de uma chamada condicionada à data do cache.

## O que isso muda na prática

```bash
git checkout <Tab>  # sugere as branches locais, nao os arquivos do diretorio
kill -9 <Tab>       # sugere os PIDs de processos em execucao, com seu nome
ssh <Tab>           # sugere os hosts conhecidos (~/.ssh/config, ~/.ssh/known_hosts)
```

Sem o `compsys`, cada um desses comandos se limitaria a completar nomes de arquivos do diretório atual, raramente o que se quer nesses casos específicos.

## O menu de completação navegável

Quando vários resultados são possíveis, o zsh pode exibir um **menu** navegável pelas setas em vez de simplesmente listar as possibilidades:

```bash
zstyle ':completion:*' menu select
```

Uma vez essa linha adicionada em `~/.zshrc`, apertar Tab com vários resultados possíveis abre um menu onde as setas direcionais movem a seleção, e Enter confirma: mais rápido do que redigitar caracteres para desambiguar.

## Completação insensível a maiúsculas/minúsculas

```bash
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
```

Permite digitar `desk<Tab>` e completar para `Desktop` apesar da maiúscula, útil principalmente no macOS/Windows onde a caixa dos nomes de arquivo é menos rigorosamente respeitada do que no Bash sob Linux.

## `zstyle`: o mecanismo de configuração por trás de tudo isso

Os exemplos acima usam `zstyle`, o comando genérico de configuração do `compsys`: cada regra associa um contexto (`':completion:*'` = em qualquer lugar) a um comportamento. É um mecanismo próprio do zsh, sem equivalente direto em Bash, cuja completação não expõe esse nível de personalização.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O `compsys` é um motor de completação sensível ao contexto: depois de `git checkout`, sugere branches, não nomes de arquivos. Precisa ser ativado explicitamente (`compinit`). |
| **Ferramentas utilizáveis** | `autoload -Uz compinit`/`compinit`, `zstyle` para personalizar (menu navegável, insensibilidade a maiúsculas). |
| **Armadilhas a evitar** | `compinit` reconstrói seu cache a cada inicialização: pode atrasar perceptivelmente a abertura de um terminal. |
| **Boas práticas** | Usar `compinit -C` depois que a configuração estabiliza, para evitar a revalidação sistemática do cache. |
