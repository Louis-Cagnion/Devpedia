---
order: 1
---

# Autenticação multifator

O capítulo [Autenticação vs autorização](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation) distingue três famílias de provas de identidade: algo que você sabe, que você tem, ou que você é. A maioria das contas depende de apenas uma delas (a senha): um segredo único, que basta para comprometer tudo caso vaze. A **autenticação multifator** (MFA, *Multi-Factor Authentication*) consiste em exigir pelo menos duas provas **de famílias diferentes** antes de conceder o acesso.

> **Cuidado:** confundir "duas verificações" com "dois fatores". Uma senha seguida de uma pergunta secreta ("qual o nome do seu primeiro animal de estimação?") continua sendo um único fator (algo que você sabe) repetido duas vezes: ambas as provas pertencem à mesma família, e um atacante capaz de adivinhar ou descobrir uma tem boas chances de descobrir a outra pelo mesmo meio (uma busca em redes sociais, por exemplo).
>
> **Boa prática:** combinar dois fatores de famílias realmente diferentes (uma senha + um código gerado por um aplicativo, por exemplo), nunca duas variantes do mesmo tipo de prova.

## Por que combinar dois fatores reduz drasticamente o risco

Vazamentos de senhas são massivos e frequentes: bancos inteiros de senhas roubadas circulam por aí, e uma senha reutilizada em vários sites pode ser testada automaticamente em todos os lugares onde foi usada. Sem um segundo fator, uma senha comprometida basta para abrir a conta. Com um segundo fator de outra família, o atacante precisa também possuir fisicamente o objeto (telefone, chave de segurança) ou a característica biológica da vítima: um obstáculo bem mais difícil de superar remotamente.

## Os métodos comuns de segundo fator

| Método | Princípio | Ponto fraco principal |
|---|---|---|
| Código por SMS | Um código enviado por mensagem ao telefone do usuário | Vulnerável ao [*SIM swapping*](https://en.wikipedia.org/wiki/SIM_swap_scam) (transferir o número de telefone para um chip SIM controlado pelo atacante) |
| Aplicativo de autenticação ([TOTP](https://en.wikipedia.org/wiki/Time-based_one-time_password)) | Um código gerado localmente, que muda a cada 30 segundos | Continua utilizável se o usuário o digitar em um site falso ([phishing](https://en.wikipedia.org/wiki/Phishing)) |
| Chave de segurança física ([FIDO2](https://en.wikipedia.org/wiki/FIDO2_Project)/[WebAuthn](https://en.wikipedia.org/wiki/WebAuthn)) | Um objeto físico que responde criptograficamente a uma solicitação do site | Custo do objeto, precisa estar fisicamente presente |

## TOTP: gerar um código sem conexão de rede

Um código **TOTP** (*Time-based One-Time Password*) funciona sem que o aplicativo e o servidor se comuniquem no momento da geração: os dois compartilham um segredo, estabelecido uma única vez (tipicamente via um QR code escaneado na ativação), e depois cada um calcula por si só um código a partir desse segredo e do horário atual, arredondado para uma janela de 30 segundos:

```text
Segredo compartilhado (estabelecido uma unica vez, na ativacao)
        |
        +-- Aplicativo : calcula um codigo a partir do segredo + o horario atual
        +-- Servidor   : calcula o mesmo codigo, de forma independente, com o
                          mesmo segredo + o mesmo horario

Os dois codigos coincidem sem que nenhuma mensagem tenha transitado entre os dois
```

É isso que permite a um aplicativo de autenticação funcionar mesmo sem conexão com a internet: ele só precisa de um relógio mais ou menos sincronizado, não de uma troca em rede.

## A chave de segurança física: a proteção mais robusta contra phishing

Um código TOTP continua vulnerável se o próprio usuário o digitar em um site falso que imita o verdadeiro (um ataque de [phishing](https://en.wikipedia.org/wiki/Phishing)): nada impede tecnicamente digitar o código certo no lugar errado. Uma chave de segurança física (FIDO2/WebAuthn) elimina esse risco de outra forma: ela verifica criptograficamente o endereço exato do site que a solicita, e recusa responder se o endereço não corresponder ao registrado originalmente, mesmo que o site falso seja visualmente idêntico ao verdadeiro.

> **Cuidado:** implementar uma autenticação multifator robusta, mas deixar um meio de recuperação de conta permissivo demais ("perdeu o segundo fator? responda estas perguntas de segurança"). Um atacante então mira nesse caminho de recuperação mais fraco em vez de atacar o segundo fator em si, o que anula todo o benefício do MFA.
>
> **Boa prática:** aplicar ao processo de recuperação do segundo fator o mesmo nível de exigência que à própria autenticação, em vez de tratá-lo como uma simples rede de segurança secundária.

---

## O que reter

| | |
|---|---|
| **O que reter** | A autenticação multifator exige pelo menos duas provas de identidade de famílias diferentes (saber/ter/ser), não duas variantes do mesmo tipo. Uma senha comprometida deixa então de ser suficiente sozinha, o atacante também precisa possuir o segundo fator. |
| **Ferramentas úteis** | Um aplicativo TOTP (código gerado localmente, sem rede); uma chave de segurança física FIDO2/WebAuthn para a proteção mais robusta contra phishing. |
| **Armadilhas a evitar** | Confundir duas verificações do mesmo fator com um verdadeiro segundo fator. Deixar um caminho de recuperação de conta permissivo demais, que contorna o MFA. |
| **Boas práticas** | Combinar dois fatores de famílias realmente diferentes. Aplicar o mesmo nível de exigência ao processo de recuperação que à própria autenticação. |
