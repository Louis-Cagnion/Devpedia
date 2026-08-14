---
order: 1
---

# HTML

O HTML (*HyperText Markup Language*) não é uma linguagem de programação: é uma linguagem de **marcação**, que descreve a estrutura e o sentido de um conteúdo (um título, um parágrafo, uma imagem, um link...), não instruções executadas sequencialmente. Um navegador lê um documento HTML e constrói uma representação em memória dessa estrutura, o DOM (*Document Object Model*, veja [O DOM e os eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements)), que depois exibe na tela.

Entre os conceitos essenciais do HTML, destacam-se:

- As tags e atributos, que estruturam e enriquecem o conteúdo
- Os elementos semânticos (HTML5), que dão um sentido explícito a cada parte da página
- Os formulários, para coletar dados do usuário
- A acessibilidade, para que o conteúdo continue utilizável por tecnologias assistivas (leitores de tela...)

O HTML não cuida **nem** da aparência visual (o papel do [CSS](/?c=langages-de-balisage&s=css&p=css)), **nem** do comportamento interativo (o papel do [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)): sua única responsabilidade é descrever o que **é** cada parte do conteúdo. Essa separação de responsabilidades (estrutura / apresentação / comportamento) é um princípio central do desenvolvimento web moderno.

> **Nota:** ao contrário de uma linguagem de programação, um erro de sintaxe HTML quase nunca provoca um "crash": os navegadores são deliberadamente tolerantes (tag não fechada, atributo mal escrito...) e tentam corrigir silenciosamente, o que pode mascarar erros por muito tempo se você não validar seu HTML com uma ferramenta dedicada.
