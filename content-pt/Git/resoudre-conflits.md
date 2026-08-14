---
order: 9
---

# Resolver um conflito de fusão

Ocorre um **conflito** quando o Git não consegue fundir automaticamente duas versões do mesmo arquivo — normalmente, quando as **mesmas linhas** foram alteradas de forma diferente em cada uma das versões (durante um «`merge`», um «`rebase`» ou um «`pull`»).

## O que o Git escreve no arquivo em conflito

```
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Tudo o que se encontra entre `<<<<<<< HEAD` e `=======` corresponde à **sua** versão (o ramo em que se encontra).
- Tudo o que se encontra entre `=======` e `>>>>>>> feature` corresponde à versão do outro ramo (fusionado).
- Estes marcadores (`<<<<<<<`, `=======`, `>>>>>>>`) são inseridos **diretamente no arquivo** — o arquivo deixa de compilar/executar tal como está enquanto estes marcadores estiverem presentes.

## Resolver o conflito

1. Abrir o arquivo, decidir qual das versões manter (ou combinar as duas manualmente).
2. Eliminar completamente os marcadores `<<<<<<<`, `=======`, `>>>>>>>` — estes **nunca** devem permanecer no arquivo final.
3. Marcar o arquivo como resolvido e, em seguida, prosseguir com a operação em curso:

```bash
git add fichier_en_conflit.js

git commit                # se o conflito resultasse de uma «fusão»
git rebase --continue     # se o conflito resultasse de um «rebase»
```

## Ver quais são os arquivos em conflito

```bash
git status
# exibe explicitamente a lista de arquivos «both modified» (modificados em ambos os lados)
```

## Anular a fusão/rebase em curso

Se a resolução se revelar demasiado complexa ou se se preferir começar do zero:

```bash
git merge --abort     # anula uma fusão em curso, restaura o estado anterior à tentativa
git rebase --abort    # anula um rebase em curso
```

## Reduzir o risco de conflitos

- Incorporar frequentemente as alterações dos outros (`git pull` / `git fetch` regularmente), em vez de deixar um ramo divergir durante muito tempo.
- Manter os ramos de funcionalidades curtos e específicos.
- Comunicar com a equipa quando várias pessoas estão trabalhando nos mesmos arquivos em simultâneo.

Consulte também os capítulos sobre ramos e rebase, as duas operações que mais frequentemente provocam conflitos.
