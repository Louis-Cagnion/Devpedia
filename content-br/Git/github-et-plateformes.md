---
order: 9
---

# GitHub e as plataformas de hospedagem Git

O [Git](/?c=git&p=concepts-de-base) é um software, instalado localmente, que gerencia o histórico de um projeto. O **GitHub** é um **serviço online** (um site, com servidores por trás) que hospeda repositórios Git e adiciona por cima ferramentas de colaboração que o Git sozinho nunca forneceu: este capítulo cobre especificamente esses adicionais, não o Git em si.

| | Git | GitHub |
|---|---|---|
| Natureza | Um software instalado na sua máquina | Um serviço web, operado por uma empresa (Microsoft) |
| Papel | Gerencia o histórico, as branches, os commits **localmente** | Hospeda uma cópia do repositório online, acessível a várias pessoas |
| Funciona sem o outro? | Sim: o Git funciona muito bem sem nunca tocar no GitHub | Não: o GitHub hospeda repositórios **Git**, ele não substitui a ferramenta |
| Concorrentes | (o Git não tem concorrente: é o padrão) | [GitLab](https://gitlab.com), [Bitbucket](https://bitbucket.org), Azure Repos (veja [Azure DevOps](/?c=ci-cd&p=azure-devops-plateforme)): plataformas diferentes, todas construídas sobre o Git |

> **Armadilha:** usar "Git" e "GitHub" como sinônimos. Um repositório Git puramente local (nunca enviado a lugar nenhum) é um repositório Git perfeitamente válido, sem nenhuma relação com o GitHub. Inversamente, um repositório hospedado no GitHub continua sendo um repositório Git comum; todos os comandos do capítulo [Os repositórios remotos](/?c=git&p=remotes) (`push`, `pull`, `fetch`, `clone`) se aplicam da mesma forma.

## Um repositório no GitHub: um remote, mais uma página web

Adicionar o GitHub como [remote](/?c=git&p=remotes) de um repositório local não difere em nada tecnicamente de adicionar qualquer outro remote:

```bash
git remote add origin https://github.com/usuario/projeto.git
git push -u origin main
```

O que o GitHub adiciona por cima desse simples armazenamento: uma **página web** para o repositório (arquivos navegáveis, `README.md` exibido automaticamente como página inicial do projeto), um histórico consultável sem terminal, e as ferramentas de colaboração detalhadas mais abaixo.

> **Nota (autenticação):** o GitHub não aceita mais uma senha comum para `git push` em HTTPS. É preciso ou um **token de acesso pessoal** (*Personal Access Token*, gerado nas configurações da conta, usado no lugar da senha), ou uma **chave SSH**: um par de dois arquivos gerados juntos (uma chave privada, mantida secreta na sua máquina, e uma chave pública, registrada na sua conta GitHub) que permitem provar sua identidade sem nunca transmitir uma senha. Sem um dos dois, `git push` falha com um erro de autenticação, mesmo com o nome de usuário e senha corretos da conta.

## As ferramentas de colaboração adicionadas pelo GitHub

Além da hospedagem, o GitHub adiciona três famílias de ferramentas, cada uma detalhada em seu próprio capítulo em vez de resumida aqui:

| Ferramenta | Papel | Capítulo dedicado |
|---|---|---|
| **Pull request** | Propor uma mudança (uma branch) para revisão antes de integrá-la | [As pull requests no GitHub](/?c=git&p=pull-requests-github) |
| **Fork** | Copiar um repositório que você não controla, para poder contribuir com ele via uma pull request | [As pull requests no GitHub](/?c=git&p=pull-requests-github) (o fork só faz sentido para esse caso de uso) |
| **Issue** | Acompanhar um bug, uma tarefa, uma discussão, sem código associado | [Issues e gestão de projeto no GitHub](/?c=git&p=issues-et-projets-github) |
| **GitHub Actions** | Automatizar build/testes/implantação | [Azure Pipelines contra GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions) (comparação detalhada já disponível) |

## Visibilidade: repositório público ou privado

Um repositório **público** é visível e clonável por qualquer pessoa na internet, com ou sem conta GitHub. Um repositório **privado** só é visível pelas contas explicitamente autorizadas.

> **Armadilha:** enviar um segredo (chave de API, senha, arquivo `.env`) para um repositório público, mesmo que brevemente e depois removido em um commit seguinte: o commit contendo o segredo continua consultável no histórico Git enquanto não for explicitamente reescrito (veja [A arquitetura interna do Git](/?c=git&p=architecture-interne)), e um repositório público pode ter sido clonado por qualquer um nesse meio tempo.
>
> **Boa prática:** excluir os segredos via [`.gitignore`](/?c=git&p=gitignore) antes do primeiríssimo commit que os envolve; se um segredo já foi enviado, considerá-lo comprometido e revogá-lo/regenerá-lo do lado do serviço envolvido, não apenas removê-lo do repositório.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O GitHub é um serviço que hospeda repositórios Git (um remote como qualquer outro, mais uma página web) e adiciona ferramentas de colaboração detalhadas em seus próprios capítulos: pull requests e forks, issues, GitHub Actions. O Git funciona independentemente do GitHub. |
| **Ferramentas utilizáveis** | Token de acesso pessoal ou chave SSH para a autenticação. |
| **Armadilhas a evitar** | Confundir Git e GitHub. Enviar um segredo para um repositório público. |
| **Boas práticas** | Excluir os segredos via `.gitignore` antes do primeiro commit que os envolve. |
