---
order: 1
---

# Sessões e cookies

O capítulo sobre [APIs e HTTP](/?c=infrastructure&p=api-et-http) apresenta como um cliente envia uma requisição e recebe uma resposta. O que ele ainda não conta: HTTP é um protocolo **sem estado** (*stateless*), cada requisição é tratada independentemente das anteriores, como se o servidor tivesse uma amnésia total entre duas requisições. Sem um mecanismo adicional, um site precisaria pedir de novo o usuário e a senha a cada nova página acessada.

```text
Requisicao 1 : POST /login (email + senha)  -> o servidor verifica, responde "conexao bem-sucedida"
Requisicao 2 : GET /perfil                   -> o servidor nao sabe NADA da requisicao 1 :
                                                 para ele, e um visitante anonimo
```

## A solução: um identificador que o cliente devolve a cada requisição

Após uma conexão bem-sucedida, o servidor cria uma **sessão**: um espaço de armazenamento mantido do seu lado, associado a esse visitante específico (seu identificador de usuário, seus direitos...). Ele devolve ao cliente um **identificador de sessão**, um valor único que o cliente enviará de volta a cada requisição, para que o servidor saiba a qual sessão se vincular:

```text
Cliente                                    Servidor
-------                                    --------
POST /login (email + senha)          ->    verifica, cria uma sessao,
                                            responde com o identificador
                                      <-    Set-Cookie: session_id=a8f3d9...

GET /perfil
Cookie: session_id=a8f3d9...         ->    encontra a sessao a8f3d9...,
                                            sabe que e esse usuario
                                      <-    responde com seu perfil
```

## O cookie: o que transporta o identificador

Um **cookie** é um pequeno dado que o servidor pede ao navegador para guardar, e que este devolve automaticamente a cada requisição para o mesmo site: é o veículo mais comum para transportar o identificador de sessão de uma requisição para outra, sem que o desenvolvedor precise cuidar disso manualmente a cada chamada.

Este capítulo permanece deliberadamente independente da linguagem utilizada: veja [Gerenciar conexões](/?c=langages-de-programmation&s=php&p=connexions) para a implementação concreta em [PHP](/?c=langages-de-programmation&s=php&p=php) (`setcookie()`, `$_SESSION`, o identificador `PHPSESSID` gerado automaticamente).

## Por que o identificador de sessão deve ser imprevisível

Se um atacante conseguisse adivinhar um identificador de sessão válido (por exemplo, um simples contador: `1`, `2`, `3`...), ele obteria acesso à conta correspondente sem conhecer nem o email nem a senha da vítima. O identificador de sessão é um caso de uso citado diretamente no capítulo sobre [pseudoaleatoriedade e geradores](/?c=representation-des-donnees&p=aleatoire-et-generateurs): ele deve ser gerado por um gerador aleatório **criptográfico**, nunca por um simples contador ou um gerador clássico.

## O roubo de sessão: o verdadeiro risco do dia a dia

Mesmo com um identificador perfeitamente imprevisível, um atacante que consegue **roubar** o cookie de um usuário já conectado (rede não criptografada, [falha XSS](/?c=langages-de-programmation&s=php&p=securite#htmlspecialchars-se-proteger-des-failles-xss) que lê `document.cookie`, dispositivo compartilhado mal protegido) obtém um acesso completo e imediato à conta, sem nunca precisar da senha: é o **roubo de sessão** (*session hijacking*).

| Risco | O que ele permite a um atacante |
|---|---|
| Identificador de sessão previsível | Adivinhar um identificador válido sem roubar nada |
| Roubo do cookie de sessão | Reutilizar um identificador já válido, sem adivinhá-lo nem conhecer a senha |

> **Cuidado:** supor que um identificador de sessão imprevisível basta para proteger uma sessão. Um identificador imprevisível impede que ele seja *adivinhado*, mas não protege contra o fato de ser *roubado* uma vez que já existe.
>
> **Boa prática:** transmitir o cookie de sessão apenas por HTTPS, proibir seu acesso ao [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), e limitar seu envio às requisições que realmente vêm do site (veja as opções `secure`/`httponly`/`samesite` detalhadas em [Gerenciar conexões](/?c=langages-de-programmation&s=php&p=connexions)).

---

## O que reter

| | |
|---|---|
| **O que reter** | HTTP é sem estado: sem um mecanismo adicional, o servidor não lembra de nada entre duas requisições. Uma sessão (do lado do servidor) associada a um identificador transmitido via cookie resolve esse problema: o cliente devolve o identificador a cada requisição, o servidor encontra a sessão correspondente. |
| **Ferramentas úteis** | Um gerador aleatório criptográfico para o identificador de sessão; as opções `secure`/`httponly`/`samesite` de um cookie para limitar o risco de roubo. |
| **Armadilhas a evitar** | Um identificador de sessão previsível (contador, valor adivinhável). Achar que um identificador imprevisível basta, sem se proteger contra o roubo do próprio cookie. |
| **Boas práticas** | Gerar o identificador de sessão com um CSPRNG. Proteger o cookie de sessão (somente HTTPS, inacessível ao JavaScript, limitado às requisições do site). |
