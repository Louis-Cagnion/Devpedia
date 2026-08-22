---
order: 10
---

# As pull requests no GitHub

A **pull request** (PR) é o mecanismo central de colaboração no [GitHub](/?c=git&p=github-et-plateformes): um pedido explícito, "aqui estão commits na minha branch, por favor revise-os e integre-os à sua." Ela se apoia inteiramente nas [branches](/?c=git&p=branches) Git comuns, sem adicionar nada do lado do próprio Git.

## O fluxo básico

```text
1. Criar uma branch dedicada a mudanca (veja As branches)
2. Commitar e enviar essa branch para o GitHub
3. Abrir uma pull request: branch de origem -> branch de destino (frequentemente main)
4. Uma ou mais pessoas revisam, comentam, pedem mudancas
5. Uma vez aprovada: a pull request e mesclada (merge)
```

```bash
git checkout -b correcao-de-exibicao
# ... modificacoes, commits ...
git push -u origin correcao-de-exibicao
# -> a abertura da pull request e feita depois no site do GitHub, nao pela linha de comando
```

> **Nota:** uma pull request não é um objeto Git: ela só existe no banco de dados do GitHub (metadados, comentários, histórico de revisão). O único objeto Git envolvido é a própria branch; remover a pull request no GitHub não apaga nenhum commit.

## O fork: contribuir com um repositório que você não controla

Abrir uma pull request supõe poder enviar uma branch para o repositório de destino. Para um repositório pertencente a outra pessoa, um **fork** primeiro cria uma cópia completa na sua própria conta, com direitos totais:

```text
Repositorio original (ex. github.com/projeto/ferramenta)
       │  botao "Fork"
       ▼
Sua copia (ex. github.com/voce/ferramenta)  <-- voce tem direitos totais aqui
       │  git clone
       ▼
Copia local na sua maquina
```

| | `fork` | `clone` |
|---|---|---|
| Onde | No GitHub (cria um novo repositório remoto, na sua conta) | Na sua máquina (cria uma cópia local) |
| Necessário para | Contribuir com um repositório onde você não tem direitos de escrita | Trabalhar localmente em qualquer repositório, incluindo o seu |
| Ligação com o original | Mantém uma ligação (`upstream`) com o repositório de origem | Nenhuma ligação particular: é apenas uma cópia |

Uma vez o fork clonado, a pull request é feita a partir de uma branch do fork para o repositório de origem: o GitHub reconhece a ligação entre os dois e sugere esse destino automaticamente.

> **Armadilha:** achar que um fork se atualiza automaticamente quando o repositório de origem evolui. Um fork é uma cópia congelada no momento em que é criado: sem ação explícita, ele fica atrasado em relação ao original.
>
> **Boa prática:** adicionar o repositório de origem como um segundo [remote](/?c=git&p=remotes) (convencionalmente chamado `upstream`) e ressincronizá-lo regularmente: `git remote add upstream https://github.com/projeto/ferramenta.git`, depois `git fetch upstream` e mesclar suas mudanças, **antes** de criar uma nova branch de trabalho.

## Pull request em rascunho (*draft*)

Uma pull request pode ser aberta em modo **rascunho** (*draft*): visível e discutível, mas explicitamente marcada como ainda não pronta para ser mesclada, nem mesmo totalmente revisada. Útil para compartilhar um trabalho em andamento (obter um retorno cedo, rodar as verificações automáticas) sem dar a entender que está terminado.

## Pedir uma revisão

Uma pull request pode designar explicitamente uma ou várias pessoas como **reviewers**. Cada revisão resulta em um status:

| Status de revisão | Significado |
|---|---|
| *Approve* | A mudança é validada, pronta para ser mesclada (sujeita às outras regras em vigor) |
| *Request changes* | Modificações são pedidas antes da mesclagem; bloqueia a mesclagem se regras de proteção o exigirem (seção seguinte) |
| *Comment* | Observações sem validação nem bloqueio explícito |

## Proteger uma branch: só aceitar mudanças revisadas

Uma **regra de proteção de branch** (*branch protection rule*) impede enviar diretamente para uma branch sensível (tipicamente `main`), e impõe condições antes que uma pull request possa ser mesclada:

| Condição comum | Efeito |
|---|---|
| Exigir pelo menos uma revisão aprovada | A mesclagem fica bloqueada enquanto nenhum *Approve* foi dado |
| Exigir que as verificações automáticas passem | A mesclagem fica bloqueada enquanto a [CI/CD](/?c=ci-cd&p=pipeline-cicd) (testes, build) não teve sucesso na última versão da branch |
| Proibir o push direto | Toda mudança nessa branch precisa obrigatoriamente passar por uma pull request, sem exceção |

> **Armadilha:** contar apenas com a disciplina da equipe ("a gente nunca envia direto para `main`") sem regra de proteção técnica. Nada impede então um push direto acidental, nem uma mesclagem prematura de uma pull request ainda não aprovada.
>
> **Boa prática:** ativar uma regra de proteção em toda branch destinada a permanecer estável, em vez de se apoiar apenas em uma convenção de equipe não técnica.

## As três formas de mesclar uma pull request

O GitHub oferece três estratégias de mesclagem, com um efeito diferente sobre o histórico final:

| Estratégia | Efeito sobre o histórico |
|---|---|
| **Merge commit** | Um [commit de mesclagem com dois pais](/?c=git&p=branches), que mantém todos os commits individuais da branch, com seu detalhe |
| **Squash and merge** | Todos os commits da branch são agrupados em **um único** commit na branch de destino: histórico de destino linear, mas o detalhe dos commits individuais da pull request se perde |
| **Rebase and merge** | Cada commit da branch é [reaplicado](/?c=git&p=rebase) individualmente no topo da branch de destino: histórico linear, sem commit de mesclagem, mas cada commit original permanece distinto |

> **Armadilha:** escolher "Squash and merge" para uma pull request que contém várias mudanças logicamente independentes (ex. uma correção de bug **e** uma nova funcionalidade, misturadas na mesma branch): o squash as funde em um único commit, tornando impossível reverter uma sem a outra depois.
>
> **Boa prática:** reservar "Squash and merge" a uma pull request cujos commits individuais não têm valor próprio (correções sucessivas da mesma mudança, por exemplo); preferir "Merge commit" ou "Rebase and merge" quando o histórico detalhado da pull request merece ser mantido.

## Ligar uma pull request a uma issue

Incluir `closes #12` (o número da [issue](/?c=git&p=issues-et-projets-github)) na descrição de uma pull request a fecha automaticamente assim que a pull request é mesclada, sem ação manual adicional.

## A armadilha do force-push durante uma revisão

Reescrever o histórico de uma branch já enviada (`git commit --amend`, [rebase](/?c=git&p=rebase)) exige um [`git push --force`](/?c=git&p=remotes) para atualizá-la do lado do GitHub.

> **Armadilha:** fazer um `push --force` em uma branch já revisada por outra pessoa. Os comentários de revisão continuam presos às linhas de código antigas, potencialmente desaparecidas ou deslocadas: um reviewer que volta à pull request pode se deparar com um diff completamente diferente do que já havia aprovado, sem saber disso.
>
> **Boa prática:** evitar reescrever o histórico de uma branch já em revisão ativa; se for necessário, avisar explicitamente os reviewers em um comentário da pull request.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma pull request propõe uma branch para revisão antes da mesclagem. Um fork permite contribuir com um repositório externo. As regras de proteção de branch impõem condições (revisão, CI) antes da mesclagem. Três estratégias de mesclagem (merge commit, squash, rebase) dão um histórico final diferente. |
| **Ferramentas utilizáveis** | Pull request em rascunho (*draft*), reviewers designados, regras de proteção de branch, `closes #12` para ligar uma issue. |
| **Armadilhas a evitar** | Achar que um fork se atualiza sozinho. Contar com a disciplina em vez de uma regra de proteção técnica. Fazer squash de uma pull request com commits logicamente independentes. Force-pushar uma branch já em revisão ativa. |
| **Boas práticas** | Ressincronizar um fork com `upstream` antes de cada nova branch. Ativar uma proteção de branch em toda branch estável. Escolher a estratégia de mesclagem conforme o valor do histórico detalhado. Avisar os reviewers antes de um force-push. |
