---
order: 5
---

# Segredos esquecidos em produção

[Gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) cobre onde armazenar corretamente um segredo (variável de ambiente, cofre dedicado) e como injetá-lo em um pipeline CI/CD sem escrevê-lo direto no código. Este capítulo cobre duas formas pelas quais um segredo bem gerenciado no início termina, ainda assim, exposto: um arquivo que ficou acessível publicamente, e um segredo presente no histórico do Git depois que o arquivo que o continha foi apagado.

## Um arquivo de configuração que ficou acessível em uma URL adivinhável

Um arquivo `.env` (variáveis de ambiente, frequentemente segredos) ou um backup (`.bak`, `.sql`, um `.zip` do site inteiro) depositado por erro na pasta servida publicamente pelo servidor web permanece acessível a qualquer um que adivinhe ou tente seu endereço, exatamente como qualquer outra página do site:

```text
https://site.example/index.php    -> a pagina normal do site
https://site.example/.env          -> se o arquivo esta na pasta publica: TODO O CONTEUDO,
                                       segredos inclusos, e exibido tal qual no navegador
https://site.example/backup.sql    -> um dump de banco de dados inteiro, se esquecido no mesmo lugar
```

Esse risco nunca vem de uma falha da aplicação (nenhum código é explorado): é um simples erro de posicionamento de arquivo, combinado com a ausência de restrição do servidor web sobre esse tipo de extensão.

| | |
|---|---|
| **Armadilha** | Depositar um `.env`, um backup, ou qualquer arquivo de trabalho (`.git/`, uma exportação de banco) na mesma pasta dos arquivos realmente destinados a serem servidos ao público, supondo que "não há nenhum link para esse arquivo então ninguém vai encontrá-lo": uma varredura automatizada testa caminhos conhecidos (`.env`, `.git/config`, `backup.zip`...) em milhões de sites, sem precisar de nenhum link |
| **Boa prática** | Armazenar qualquer arquivo sensível FORA da pasta servida publicamente pelo servidor web (`public/` ou equivalente); configurar o servidor para recusar explicitamente qualquer requisição a um `.env`/`.git`/arquivo de backup, como defesa adicional mesmo quando o posicionamento já está correto |

## Um segredo que ficou no histórico do Git após sua exclusão

Excluir um arquivo que contém um segredo (ou substituir seu valor em um commit posterior) não o remove do histórico: cada versão antiga de um arquivo permanece consultável nos commits anteriores, enquanto o próprio histórico não for reescrito.

```text
Commit 1: adiciona config.php com API_KEY="sk_live_abc123..."
Commit 2: remove a linha API_KEY (ou o arquivo inteiro)

git log -p -- config.php   -> AINDA mostra o commit 1, chave em texto puro inclusa
```

Qualquer pessoa com acesso ao repositório (inclusive depois de um repositório privado se tornar público por erro, ou um fork já feito antes da exclusão) pode recuperar esse segredo consultando o histórico, mesmo que o arquivo atual não contenha mais nenhum rastro dele.

> **Cuidado:** achar que um `git commit` de exclusão "apaga" um segredo já commitado. A simples remoção do arquivo atual não tem nenhum efeito sobre as versões já registradas no histórico.
>
> **Boa prática:** em caso de um segredo commitado por erro, considerá-lo definitivamente comprometido e REVOGÁ-LO/regenerá-lo imediatamente (nova chave de API, nova senha): é a única proteção confiável, já que uma reescrita do histórico (`git filter-repo`, BFG Repo-Cleaner) não impede que uma cópia já clonada/forkada antes da reescrita mantenha o histórico antigo intacto.

## Uma única página que expõe os segredos de TODAS as contas

Uma variante mais grave que uma vazamento comum: uma página de administração/configuração que exibe, em uma única visão, a lista completa dos tokens de acesso de TODAS as contas/clientes de um sistema (em vez de apenas a da pessoa conectada). Um único acesso não previsto a essa página (controle de acesso ausente, link compartilhado por erro) compromete então todo o escopo de uma vez, não apenas uma conta.

> **Cuidado:** agrupar os segredos de todos os inquilinos/contas na mesma tela por conveniência administrativa ("é mais prático gerenciar tudo no mesmo lugar"), sem medir que isso transforma um controle de acesso ausente NESSA ÚNICA PÁGINA em um comprometimento total em vez de parcial.
>
> **Boa prática:** nunca exibir um segredo em texto puro depois de gerado (apenas no momento de sua criação, depois mascarado ou regenerável mas não mais consultável); se uma visão geral ainda for necessária para a administração, exibir nela apenas metadados (data de criação, último uso), nunca o valor do segredo em si.

## Segredos e pipeline CI/CD aberto a contribuições externas

[Gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) mostra como declarar corretamente um segredo de CI (espaço dedicado, injetado como variável de ambiente). O risco adicional aparece quando esse pipeline pode ser disparado por uma contribuição externa não confiável (um *pull request* vindo de uma conta externa ao projeto):

```text
1. O pipeline de CI esta configurado para rodar automaticamente em cada pull request,
   com os segredos do projeto injetados como de costume (deploy, chave de API...)
2. Um atacante abre um pull request a partir do seu proprio fork, modificando
   o script de build para que ele exfiltre as variaveis de ambiente
   (ex.: enviando-as a um servidor externo que ele controla)
3. Se o pipeline executa esse script COM os segredos do projeto injetados,
   o atacante recupera esses segredos sem nunca ter tido acesso ao repositorio em si
```

| | |
|---|---|
| **Armadilha** | Injetar os segredos do repositório principal na execução de CI disparada por um pull request vindo de um fork externo, tratando essa execução como se fosse tão confiável quanto um commit direto da equipe |
| **Boa prática** | Configurar a plataforma de CI para NÃO expor os segredos do repositório principal aos pipelines disparados por um pull request externo (opção já oferecida pela maioria das plataformas, ex. `pull_request_target` a evitar no GitHub Actions sem uma revisão manual prévia), ou exigir uma aprovação manual antes de executar uma PR externa |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um segredo corretamente armazenado no início pode ainda assim se expor: um arquivo `.env`/backup que ficou na pasta pública do servidor, um segredo ainda legível no histórico do Git após a exclusão do arquivo, uma página de administração que agrupa os segredos de todas as contas em uma única visão, ou um pipeline de CI que injeta os segredos do projeto na execução de um pull request externo não confiável. |
| **Ferramentas utilizáveis** | Configuração do servidor para bloquear o acesso a arquivos sensíveis; `git filter-repo`/BFG Repo-Cleaner para reescrever um histórico (como complemento da revogação, nunca em seu lugar); opção da plataforma de CI para restringir os segredos às execuções internas. |
| **Armadilhas a evitar** | Colocar um arquivo sensível na pasta servida publicamente. Achar que um commit de exclusão retira um segredo do histórico. Agrupar os segredos de todas as contas na mesma página de administração. Expor os segredos do projeto a uma execução de CI disparada por um pull request externo. |
| **Boas práticas** | Armazenar qualquer arquivo sensível fora da pasta pública, com um bloqueio no servidor como defesa adicional. Revogar imediatamente qualquer segredo commitado por erro, independentemente de uma eventual reescrita do histórico. Nunca exibir de novo um segredo em texto puro após sua criação. Restringir os segredos de CI às execuções internas, nunca a pull requests externos. |
