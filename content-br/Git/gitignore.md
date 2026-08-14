---
order: 3
---

# O arquivo .gitignore

`.gitignore` Enumera os arquivos e pastas que o Git deve **ignorar**: nunca propor para adição, nunca acompanhar, mesmo com um `git add .`. Indispensável para não poluir o histórico com arquivos gerados, dependências ou segredos.

## Sintaxe básica

```
# Commentaire
*.log              # ignore tous les fichiers se terminant par .log, où qu'ils soient
node_modules/       # ignore ce dossier entier, à la racine ou ailleurs
/build              # le '/' en préfixe restreint à la racine du dépôt uniquement
.env                # ignore ce fichier précis
!important.log      # exception : NE PAS ignorer ce fichier précis, malgré la règle *.log au-dessus
```

| Motivo | Significado |
|---|---|
| `*.ext` | Qualquer arquivo com esta extensão, a qualquer nível |
| `pasta/` | Esta pasta e todo o seu conteúdo |
| `/caminho` | Apenas na raiz do repositório (não numa subpasta com o mesmo nome) |
| `!motif` | Exceção a uma regra anterior |

## O que normalmente deve ser ignorado

- As dependências instaladas (`node_modules/`, `vendor/`), que podem ser recompiladas a partir de um arquivo de dependências (`package.json`, `composer.json`...).
- Os arquivos de configuração que contêm informações confidenciais (`.env`, chaves de API...).
- Os arquivos gerados pela compilação ou pelo build (`*.o`, `dist/`, `build/`).
- Arquivos específicos de um editor ou de um sistema operativo (`.DS_Store`, `.vscode/`, `*.swp`).

## `.gitignore` aplica-se apenas aos arquivos que **nunca foram acompanhados**

```bash
git rm --cached fichier_deja_suivi.txt
```

> **Nota:** adicionar um arquivo a `.gitignore` não tem **qualquer efeito** se este já estiver a ser acompanhado pelo Git (já tiver sido submetido pelo menos uma vez): o Git continua a acompanhar as suas alterações como antes. É necessário, primeiro, removê-lo explicitamente do acompanhamento com o comando «`git rm --cached`» (que o deixa intacto no disco, mas deixa de o acompanhar), antes que a regra «`.gitignore`» entre em vigor.

## Âmbito do `.gitignore`

Um repositório pode conter vários arquivos «`.gitignore`», cada um dos quais se aplica à pasta onde se encontra e às suas subpastas, útil para regras específicas de um subprojeto, para além das regras globais na raiz.

Um arquivo «`~/.gitignore_global`» (configurado através de `git config --global core.excludesfile ~/.gitignore_global`) permite também definir regras pessoais (por exemplo, arquivos específicos do seu próprio editor), sem as impor aos outros colaboradores de um projeto partilhado.
