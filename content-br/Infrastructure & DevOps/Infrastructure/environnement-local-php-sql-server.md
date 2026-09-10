---
order: 9
---

# Configurar um ambiente local para uma aplicação PHP conectada ao SQL Server

Desenvolver uma aplicação que conversa com um banco de dados que vive em outro lugar (um servidor da empresa, um ambiente de produção) traz um problema recorrente: trabalhar diretamente nesse banco remoto é arriscado (um erro atinge os dados reais) e muitas vezes impossível (acesso de rede restrito). A solução habitual é restaurar uma cópia do banco **localmente**, e então rodar a aplicação sobre ela durante o desenvolvimento. Este capítulo cobre as armadilhas encontradas nessa configuração, usando o [Microsoft SQL Server](/?c=langages-de-programmation&s=domain-specific-languages-dsl&p=sql) como exemplo concreto.

## Restaurar um backup `.bak` localmente

O SQL Server exporta um banco de dados como um arquivo **`.bak`**, um backup completo (esquema + dados) em um determinado instante. O **SSMS** (*SQL Server Management Studio*, a ferramenta gráfica oficial de administração do SQL Server) permite restaurá-lo em uma instância local: *Restore Database* > *Device*, apontando para o arquivo `.bak` recebido. Uma vez restaurado, o banco tem o mesmo nome e a mesma estrutura do original, mas vive inteiramente na máquina local.

## Criar um usuário dedicado em vez de usar `sa`

`sa` (*system administrator*) é a conta administradora integrada do SQL Server, com todos os direitos sobre a instância inteira (todos os bancos, não apenas o restaurado). Uma aplicação nunca deveria se conectar com ela:

```sql
CREATE LOGIN app_backoffice WITH PASSWORD = 'uma-senha-forte';

USE MeuBancoRestaurado;
CREATE USER app_backoffice FOR LOGIN app_backoffice;
ALTER ROLE db_owner ADD MEMBER app_backoffice;
```

Assim, `app_backoffice` obtém todos os direitos (`db_owner`) apenas sobre o banco `MeuBancoRestaurado`, sem poder tocar nos outros bancos nem na configuração da instância.

> **Boa prática:** um login de aplicação precisa apenas dos direitos sobre os bancos que ele realmente usa, nunca dos direitos de administração da instância inteira. Um vazamento dessas credenciais (arquivo de configuração commitado por engano, log que as exibe) tem impacto limitado a esses bancos específicos, em vez de a todo o servidor.

## Iniciar o servidor de desenvolvimento do PHP no endereço certo

`php -S` inicia um servidor HTTP embutido, prático para desenvolver sem configurar um servidor web de verdade:

```bash
php -S localhost:8000
```

> **Cuidado (Windows):** `localhost` pode resolver para IPv6 (`[::1]`) em vez de IPv4 (`127.0.0.1`), e o servidor embutido do PHP então se vincula apenas ao endereço resolvido. Um navegador ou uma ferramenta que insiste em `127.0.0.1:8000` não encontra ninguém nesse endereço, mesmo que o servidor esteja rodando normalmente em `[::1]:8000`. Correção: vincular explicitamente o endereço desejado em vez do nome genérico `localhost`:
> ```bash
> php -S 127.0.0.1:8000
> ```

## Extensões PHP faltando: um bloqueio de cada vez

`composer install` baixa e instala as dependências declaradas de um projeto PHP. Se faltar uma extensão PHP exigida por alguma delas, a instalação falha -- mas apenas na **primeira** extensão faltante encontrada, não na lista completa:

```text
1a tentativa: composer install
  -> erro: a extensao "openssl" e necessaria

(openssl ativada)

2a tentativa: composer install
  -> erro: a extensao "gd" e necessaria

(gd ativada, depois zip, depois sodium...)
```

Cada extensão é reativada no arquivo `php.ini` (descubra qual está em uso com `php --ini`) removendo o `;` que comenta a linha (`;extension=gd` vira `extension=gd`), desde que o arquivo `.dll`/`.so` correspondente exista de fato na pasta `ext/` da instalação do PHP.

> **Cuidado:** parar depois de corrigir o primeiro erro e concluir que "ainda não funciona" no segundo fracasso, sem perceber que se trata de uma extensão **diferente** da anterior. A mensagem de erro sempre nomeia a extensão faltante: releia-a a cada novo fracasso em vez de supor que é sempre a mesma.

## O arquivo hosts: dar um nome a `127.0.0.1`

O arquivo **hosts** do sistema associa manualmente um nome de domínio a um endereço IP, antes mesmo de qualquer resolução DNS de rede:

| Sistema | Localização |
|---|---|
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| Linux/macOS | `/etc/hosts` |

```text
127.0.0.1   meudominio.local
```

Uma vez adicionada essa linha, `http://meudominio.local:8000` designa o servidor local, exatamente como `http://127.0.0.1:8000`, mas com um nome estável e legível.

> **Cuidado:** esse arquivo só pode ser modificado com direitos de administrador (acesso negado do contrário, mesmo para uma ferramenta que tenta editá-lo automaticamente). No Windows, abra o próprio editor de texto como administrador antes de acessá-lo.

## Por que um hostname estável importa: o `redirect_uri` do OAuth

Um fluxo [OAuth 2.0](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (usado, por exemplo, para "Entrar com o Google") exige declarar antecipadamente, no console de administração do provedor (Google Cloud Console, admin do Okta...), a URL exata para a qual ele redirecionará o usuário após o login: o **`redirect_uri`**.

> **Cuidado:** o provedor OAuth recusa qualquer requisição cujo `redirect_uri` não corresponda **exatamente, caractere por caractere**, a uma URL já declarada do lado dele. Um simples `localhost:8000` raramente funciona na prática (muitos provedores o proíbem, ou a aplicação muda de porta a cada execução): dar um nome estável ao servidor local pelo arquivo hosts (`meudominio.local`) e depois declarar `http://meudominio.local:8000/callback` no lado do provedor resolve o problema -- mas as duas etapas são necessárias, adicionar o hostname ao arquivo hosts sem também declará-lo no provedor não basta.

## Nota: um proxy corporativo pode deixar o Composer lento sem bloqueá-lo

Em uma rede corporativa filtrada por um proxy TLS (que inspeciona o tráfego criptografado reemitindo seus próprios certificados), cada pacote do Composer pode falhar uma primeira vez no download direto (`SSL routines::certificate verify failed`, pois o certificado do proxy não é reconhecido pela configuração OpenSSL do PHP) antes de ter sucesso via um clone Git como recurso automático. Isso deixa `composer install` lento sem bloqueá-lo completamente -- uma lentidão incomum vale a pena ser verificada nos logs do Composer em vez de ser ignorada.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Restaurar uma cópia local (`.bak` via SSMS) em vez de desenvolver em um banco remoto. Criar um usuário de aplicação dedicado (`db_owner` apenas no banco em questão), nunca `sa`. `php -S localhost` pode se vincular apenas ao IPv6 no Windows. `composer install` falha uma extensão PHP faltante de cada vez, não todas de uma vez. O arquivo hosts (direitos de administrador necessários) dá um nome estável a `127.0.0.1`, útil especialmente para um `redirect_uri` OAuth que precisa corresponder exatamente ao que está declarado no lado do provedor. |
| **Ferramentas utilizáveis** | SSMS (*Restore Database* > *Device*) para restaurar um `.bak`. `CREATE LOGIN`/`CREATE USER`/`ALTER ROLE db_owner` para um usuário de aplicação dedicado. `php --ini` para localizar o `php.ini` ativo. O arquivo hosts para um hostname local estável. |
| **Armadilhas a evitar** | Conectar-se como `sa` a partir de uma aplicação. Vincular `php -S` a `localhost` em vez de um endereço IPv4 explícito. Corrigir apenas uma extensão PHP faltante e supor que o problema está resolvido. Modificar o arquivo hosts sem direitos de administrador. Adicionar um hostname local sem também declará-lo como `redirect_uri` no lado do provedor OAuth. |
| **Boas práticas** | Sempre restaurar uma cópia local em vez de desenvolver com dados de produção. Limitar os direitos de uma conta de aplicação apenas aos bancos que ela usa. Reler o nome exato da extensão faltante a cada novo fracasso de `composer install`. Verificar os logs do Composer em caso de lentidão incomum em vez de ignorá-la. |
