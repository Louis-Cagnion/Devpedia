---
order: 12
---

# Resolver um conflito de mesclagem

Um **conflito** ocorre quando o Git não consegue mesclar automaticamente duas versões de um mesmo arquivo, tipicamente quando as **mesmas linhas** foram modificadas de forma diferente nos dois lados (durante um `merge`, um `rebase`, ou um `pull`).

## O que o Git escreve no arquivo em conflito

```text
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Tudo que está entre `<<<<<<< HEAD` e `=======` corresponde à **sua** versão (a branch em que você está).
- Tudo que está entre `=======` e `>>>>>>> feature` corresponde à versão da **outra** branch (mesclada).
- Esses marcadores (`<<<<<<<`, `=======`, `>>>>>>>`) são inseridos **diretamente no arquivo**: o arquivo não compila/executa mais tal como está enquanto eles estiverem presentes.

## Resolver o conflito

1. Abrir o arquivo, decidir qual versão manter (ou combinar as duas manualmente).
2. Remover inteiramente os marcadores `<<<<<<<`, `=======`, `>>>>>>>`: eles **nunca** devem permanecer no arquivo final.
3. Marcar o arquivo como resolvido, e depois continuar a operação em andamento:

```bash
git add arquivo_em_conflito.js

git commit             # se o conflito veio de um "merge"
git rebase --continue  # se o conflito veio de um "rebase"
```

## Ver quais arquivos estão em conflito

```bash
git status
# exibe explicitamente a lista de arquivos "both modified" (modificados dos dois lados)
```

## Abandonar a mesclagem/o rebase em andamento

Se a resolução se mostrar complexa demais ou se preferir recomeçar do zero:

```bash
git merge --abort   # cancela um merge em andamento, restaura o estado anterior a tentativa
git rebase --abort  # cancela um rebase em andamento
```

## Reduzir o risco de conflitos

- Integrar frequentemente as mudanças dos outros (`git pull`/`git fetch` regular) em vez de deixar uma branch divergir por muito tempo.
- Manter branches de funcionalidade curtas e focadas.
- Comunicar-se com a equipe quando várias pessoas trabalham nos mesmos arquivos em paralelo.

Veja também [As branches](/?c=git&p=branches) e [O rebase](/?c=git&p=rebase), as duas operações que mais frequentemente provocam conflitos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um conflito aparece quando o Git não consegue mesclar automaticamente duas versões das mesmas linhas. Os marcadores `<<<<<<<`/`=======`/`>>>>>>>` precisam ser removidos manualmente antes de continuar. |
| **Ferramentas utilizáveis** | `git status` (arquivos em conflito), `git add` + `git commit`/`git rebase --continue`, `git merge --abort`/`git rebase --abort`. |
| **Armadilhas a evitar** | Esquecer de remover um marcador de conflito: o arquivo continua inválido (não compila/executa mais) enquanto ele estiver lá. |
| **Boas práticas** | Integrar frequentemente as mudanças dos outros para limitar a divergência; manter branches de funcionalidade curtas e focadas. |
