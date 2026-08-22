---
order: 3
---

# Sessions et tokens

Uma vez a identidade verificada (veja [Fundamentos](/?c=authentification&s=fondamentaux&p=fondamentaux)), surge um problema concreto: como o servidor lembra que um usuário permanece conectado de uma requisição HTTP para outra? Este subject cobre as duas respostas clássicas a essa pergunta: a **sessão**, em que o servidor mantém o estado de conexão do seu lado, e o **token**, em que esse estado é carregado diretamente pelo cliente a cada requisição.

Você encontrará os diferentes conceitos abaixo:
