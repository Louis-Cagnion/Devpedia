# HTML

O HTML (*HyperText Markup Language*) não é uma linguagem de programação: é uma linguagem de **marcação**, que descreve a estrutura e o significado de um conteúdo (um título, um parágrafo, uma imagem, um link...), e não instruções executadas sequencialmente. Um navegador lê um documento HTML e constrói uma representação dessa estrutura na memória, o DOM (*Document Object Model*, ver capítulo dedicado em JavaScript), que depois exibe no ecrã.

Entre os conceitos essenciais do HTML, destacam-se, nomeadamente:

- As etiquetas e os atributos, que estruturam e enriquecem o conteúdo
- Os elementos semânticos (HTML5), que conferem um significado explícito a cada parte da página
- Os formulários, para recolher dados junto do utilizador
- Acessibilidade, para que o conteúdo continue a ser utilizável por tecnologias de assistência (leitores de ecrã, etc.)

O HTML não se ocupa **nem** da aparência visual (função do CSS, ver capítulo dedicado), **nem** do comportamento interativo (função do JavaScript) — a sua única responsabilidade é descrever o que é cada parte do conteúdo. Esta separação de responsabilidades (estrutura / apresentação / comportamento) é um princípio central do desenvolvimento web moderno.

> **Nota:** ao contrário do que acontece com uma linguagem de programação, um erro de sintaxe HTML quase nunca provoca uma «falha» — os navegadores são deliberadamente tolerantes (etiqueta não fechada, atributo mal escrito...) e tentam corrigi-los silenciosamente, o que pode ocultar erros durante muito tempo se o HTML não for validado com uma ferramenta específica.
