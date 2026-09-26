---
order: 14
---

# Falhas do lado do navegador

Alguns ataques não exploram nenhuma falha de código no sentido clássico (injeção, controle de acesso): eles desviam comportamentos padrão do próprio navegador, ou aproveitam a ausência de uma instrução explícita que o servidor deveria ter dado a ele. Este capítulo cobre os mais comuns.

## Clickjacking: clicar em outra coisa que não a que se vê

Um site atacante pode carregar o SEU site em um `iframe` invisível (opacidade próxima de zero), sobreposto com precisão a um botão falso atraente exibido por cima. A vítima acha que clica no botão falso; na verdade clica em um botão real do seu site, escondido embaixo.

```text
Página do atacante (o que a vítima vê):
  ┌─────────────────────────┐
  │   "Ganhe um presente!"  │   <- o que a vítima ACHA que clica
  │     [ Clique aqui ]     │
  └─────────────────────────┘

Realidade sobreposta (invisível):
  ┌─────────────────────────┐
  │  iframe do seu site     │   <- o que recebe DE VERDADE o clique
  │  [Confirmar pagamento]  │      (botão sensível, posicionado bem
  └─────────────────────────┘       embaixo do botão falso visível)
```

| | |
|---|---|
| **Armadilha** | Não indicar nada ao navegador sobre o direito ou não de exibir o seu site em um `iframe`: por padrão, qualquer site pode fazer isso |
| **Boa prática** | Enviar o cabeçalho `Content-Security-Policy: frame-ancestors 'none'` (ou `'self'` se o seu próprio site precisar se enquadrar) em toda página que dispara uma ação sensível, para que o navegador simplesmente se recuse a exibi-la em um iframe em outro lugar |

## Open redirect: um redirecionamento desviado para phishing

Um parâmetro de redirecionamento (`?next=`, `?redirect=`, muito usado para "voltar à página pedida depois do login") que aceita qualquer URL externa transforma o seu próprio domínio, normalmente confiável, em trampolim para um site de phishing.

```text
Link enviado pelo atacante, com o domínio VERDADEIRO do site confiável:
  https://site-confiavel.example/login?next=https://site-pirata.example/formulario-falso

A vítima vê "site-confiavel.example" no navegador (tranquilizador),
clica, faz login normalmente... e depois é redirecionada para o site pirata
logo em seguida, em um domínio para o qual ela já não está olhando
```

> **Armadilha:** validar o parâmetro de redirecionamento verificando só que ele SE PARECE com uma URL (presença de `http`), sem verificar o domínio.
>
> **Boa prática:** aceitar só um caminho relativo interno do site (`/perfil`, nunca uma URL completa) para esse tipo de parâmetro, ou verificar explicitamente o domínio contra uma lista branca se um redirecionamento externo for realmente necessário.

## Reverse tabnabbing: a página aberta retoma o controle da aba de origem

Um link `target="_blank"` (abertura em uma nova aba) dá por padrão à página aberta acesso a `window.opener`, uma referência para a aba de ORIGEM. Uma página maliciosa aberta assim pode então redirecionar em silêncio essa aba de origem (que continua aberta atrás, fora do campo de visão imediato da vítima) para uma página de login falsa.

```javascript
// Na página aberta com target="_blank", sem defesa do site de origem:
window.opener.location = "https://site-pirata.example/pagina-login-falsa";
// A aba de ORIGEM (aquela que a vítima ainda acha que é o site verdadeiro)
// acaba redirecionada, sem que a vítima tenha clicado em nada dentro dela
```

> **Armadilha:** usar `target="_blank"` em um link para um conteúdo externo (gerado por um usuário, ou para um site de terceiros) sem restringir esse acesso.
>
> **Boa prática:** acrescentar sistematicamente `rel="noopener noreferrer"` a todo `target="_blank"`, sobretudo quando a URL vem de um dado externo. `noopener` corta o acesso a `window.opener`; `noreferrer` impede também que o site aberto saiba de onde veio o clique.

## HTTP Parameter Pollution: o mesmo parâmetro enviado duas vezes

Nada impede que uma requisição HTTP traga duas vezes o mesmo nome de parâmetro (`?id=1&id=2`). O problema: cada camada que trata essa requisição (servidor web, framework, código da aplicação) pode escolher uma convenção DIFERENTE para resolver essa duplicata (ficar com o primeiro, ficar com o último, juntá-los em um array), sem que isso seja necessariamente documentado nem coerente entre elas.

| Camada | Comportamento possível diante de `?id=1&id=2` |
|---|---|
| Uma camada de validação | Só olha o PRIMEIRO `id` (`1`) e o considera válido |
| O código de negócio que trata de fato a requisição | Usa o ÚLTIMO `id` (`2`) |

Se o atacante conhece essa divergência, ele pode fazer a camada de controle validar um parâmetro inofensivo enquanto faz o código de negócio AGIR sobre um segundo parâmetro nunca verificado.

> **Boa prática:** nunca supor que um parâmetro aparece uma única vez em uma requisição; verificar explicitamente, no framework usado, qual convenção se aplica em caso de duplicata, e garantir que a camada de validação e a de execução usam o MESMO valor.

## Cabeçalhos de segurança ausentes

Vários cabeçalhos de resposta HTTP, ausentes por padrão, indicam explicitamente ao navegador como se comportar de forma defensiva diante dessa página. O [CORS](/?c=securite&s=cybersecurite&p=securite-api-web) já é tratado separadamente; estes são os outros:

| Cabeçalho | O que ele impede |
|---|---|
| `Content-Security-Policy: frame-ancestors` | O clickjacking (visto acima) |
| `X-Content-Type-Options: nosniff` | O navegador às vezes adivinha (*sniff*) o tipo de um arquivo servido em vez de confiar no `Content-Type` declarado; um arquivo enviado por um usuário e tomado por HTML/JS executável, em vez do tipo inofensivo declarado, pode então ser executado |
| `Strict-Transport-Security` | O navegador força toda conexão futura com esse domínio em HTTPS, mesmo que um link aponte explicitamente para HTTP |
| `Referrer-Policy: strict-origin-when-cross-origin` (ou `no-referrer`) | O vazamento do endereço da página no cabeçalho `Referer` enviado a outros sites: com esse valor, outro site só recebe o nome de domínio, nunca o caminho nem os parâmetros |

> **Boa prática:** definir esses cabeçalhos no nível do servidor web ou do framework para o site inteiro, em vez de caso a caso em cada rota.

> **Armadilha:** mesmo com essa política (aplicada por padrão pelos navegadores recentes, mas não pelos antigos), um dado sensível colocado no endereço (`?email=...`, `?token=...`) continua visível no histórico do navegador, nos logs do servidor e no `Referer` enviado aos recursos do próprio site: é a fraqueza [CWE-598](https://cwe.mitre.org/data/definitions/598.html). Um dado sensível vai no corpo de uma requisição `POST`, nunca na URL.

## Formulários em um aparelho compartilhado: `autocomplete="off"`

Um navegador memoriza o que é digitado nos campos de um formulário e o propõe de novo no preenchimento seguinte (nome, telefone, e-mail...). Em um computador pessoal, isso é prático; em um **aparelho compartilhado** (terminal de autoatendimento, quiosque, computador de recepção), o usuário seguinte vê os dados pessoais do anterior.

```html
<input type="email" name="email" autocomplete="off">   <!-- nenhuma sugestão memorizada -->
```

| Situação | Ajuste |
|---|---|
| Computador pessoal | Deixar o preenchimento automático: ele ajuda o usuário |
| Terminal ou aparelho compartilhado | `autocomplete="off"` em cada campo de dados pessoais, e apagar os dados do navegador entre duas sessões (o mais seguro: um perfil de navegação privada reiniciado a cada usuário) |

> **Armadilha:** os navegadores podem ignorar `autocomplete="off"` nos campos de login (usuário, senha), para deixar o gerenciador de senhas funcionar. Em um terminal, nunca contar só com esse atributo.

## Armazenamento de um token no cliente: `localStorage` contra cookie `HttpOnly`

[Sessões e cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) explica por que um cookie `HttpOnly` protege o identificador de sessão de uma leitura por JavaScript. Uma aplicação que gerencia ela mesma um token (JWT, chave de API no cliente) pode escolher onde guardá-lo no navegador, com propriedades opostas:

| | Cookie `HttpOnly` | `localStorage`/`sessionStorage` |
|---|---|---|
| Legível por um script JavaScript da página | Não | Sim |
| Pode ser roubado por uma falha [XSS](/?c=securite&s=cybersecurite&p=xss-en-detail) em outro ponto do site | Não (o cookie continua invisível para o script injetado) | Sim (`localStorage.getItem(...)` basta) |
| Enviado automaticamente a cada requisição para o domínio | Sim | Não (precisa ser acrescentado à mão a cada chamada) |
| Prático para uma API chamada a partir de outro domínio | Mais complexo (restrições entre domínios nos cookies) | Mais simples |

> **Armadilha:** guardar um token sensível em `localStorage` pela facilidade de implementação, sem ter medido que uma única falha XSS em outro ponto do site basta então para roubá-lo por inteiro.
>
> **Boa prática:** preferir um cookie `HttpOnly` para todo token cujo roubo teria um impacto significativo, e reservar o `localStorage` aos dados cuja exposição não traz risco real, mesmo em caso de XSS.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Vários ataques exploram comportamentos padrão do navegador em vez de uma falha de código: exibição em iframe sem restrição (clickjacking), redirecionamento para um domínio externo não verificado (open redirect), acesso a `window.opener` a partir de um `target="_blank"` (reverse tabnabbing), tratamento incoerente de um parâmetro duplicado (HPP), cabeçalhos de segurança ausentes, ou escolha do armazenamento de um token no cliente. |
| **Ferramentas utilizáveis** | `Content-Security-Policy: frame-ancestors`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `rel="noopener noreferrer"`, `autocomplete="off"` em um aparelho compartilhado. |
| **Armadilhas a evitar** | Não restringir a exibição em iframe. Aceitar qualquer URL completa como destino de redirecionamento. `target="_blank"` sem `rel="noopener noreferrer"`. Supor que um parâmetro HTTP aparece uma única vez. Guardar um token sensível em `localStorage` sem medir o risco de XSS. |
| **Boas práticas** | Definir os cabeçalhos de segurança pertinentes para o site inteiro. Aceitar só um caminho relativo interno para um redirecionamento depois do login. Sistematizar `rel="noopener noreferrer"`. Verificar a convenção do framework diante de um parâmetro duplicado. Preferir um cookie `HttpOnly` para um token sensível. |
