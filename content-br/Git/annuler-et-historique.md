---
order: 5
---

# Desfazer mudanças e navegar no histórico

O Git oferece vários comandos para voltar atrás, em níveis diferentes: desfazer uma modificação não commitada, um commit já feito, ou até recuperar um commit que parece ter desaparecido.

## Desfazer modificações não commitadas

```bash
git checkout -- arquivo.txt  # restaura um arquivo ao seu ultimo estado commitado, sobrescreve as modificacoes locais
git restore arquivo.txt      # equivalente moderno do comando acima

git restore --staged arquivo.txt  # retira um arquivo do staging, SEM tocar em suas modificacoes no diretorio de trabalho
```

> **Nota:** `git checkout -- arquivo.txt` e `git restore arquivo.txt` são **irreversíveis**: as modificações não commitadas são perdidas definitivamente, ao contrário de um commit que sempre se pode recuperar (cf. `git reflog` mais abaixo).

## `git reset`: mover a branch atual para trás

```bash
git reset --soft HEAD~1   # desfaz o ultimo commit, mas mantem tudo em staging (pronto para recommitar)
git reset --mixed HEAD~1  # desfaz o ultimo commit E o staging, mantem as modificacoes no diretorio de trabalho (padrao)
git reset --hard HEAD~1   # desfaz o ultimo commit, o staging, E as proprias modificacoes -> perda definitiva
```

| Opção | Commit desfeito | Staging | Diretório de trabalho |
|---|---|---|---|
| `--soft` | Sim | Mantido | Mantido |
| `--mixed` (padrão) | Sim | Reiniciado | Mantido |
| `--hard` | Sim | Reiniciado | **Reiniciado (perda de dados)** |

> **Nota:** `git reset --hard` é um dos comandos mais destrutivos do Git: ele sobrescreve silenciosamente qualquer modificação não commitada, sem possibilidade de recuperação simples. Usar apenas tendo certeza do que se está abandonando.

## `git revert`: desfazer um commit já compartilhado

Ao contrário de `reset` (que reescreve o histórico removendo commits), `revert` cria um **novo** commit que aplica o inverso de um commit anterior; o histórico original permanece intacto, o que o torna seguro mesmo em commits já enviados e compartilhados:

```bash
git revert a3f9c1d
```

## `git reflog`: recuperar um commit "perdido"

Mesmo depois de um `reset --hard` ou uma manipulação malsucedida, o Git na verdade mantém um registro de todos os deslocamentos de `HEAD` por um certo tempo:

```bash
git reflog
# a3f9c1d HEAD@{0}: reset: moving to HEAD~1
# e4f5g6h HEAD@{1}: commit: Corrige o calculo de desconto
```

```bash
git checkout e4f5g6h              # recupera o estado de um commit "perdido" encontrado via reflog
git branch recuperacao e4f5g6h    # ou cria diretamente uma branch a partir desse commit
```

> **Nota:** `git reflog` costuma ser a solução de emergência depois de uma manipulação do Git que deu errado: enquanto um commit existiu localmente em algum momento, ele geralmente continua recuperável por várias semanas, mesmo que não seja mais referenciado por nenhuma branch.

Veja também [As branches](/?c=git&p=branches) e [O rebase](/?c=git&p=rebase), cujas manipulações são as mais envolvidas neste capítulo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `restore`/`checkout --` desfazem modificações não commitadas (irreversível); `reset` move a branch para trás (`--soft`/`--mixed`/`--hard`); `revert` cria um commit inverso, seguro em um histórico já compartilhado; `reflog` recupera um commit "perdido". |
| **Ferramentas utilizáveis** | `git restore`, `git reset --soft/--mixed/--hard`, `git revert`, `git reflog`. |
| **Armadilhas a evitar** | `git reset --hard` sobrescreve silenciosamente qualquer modificação não commitada, sem recuperação simples. |
| **Boas práticas** | Preferir `revert` a `reset` em um histórico já compartilhado; verificar `git reflog` antes de achar um commit definitivamente perdido. |
