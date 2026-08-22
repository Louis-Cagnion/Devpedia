---
order: 4
---

# Traitement de documents

Esta seção cobre a extração de informação a partir de documentos existentes (PDF, imagens escaneadas): extrair o texto, reconstruir tabelas, escolher onde rodar os modelos de visão que tornam tudo isso possível. Ela se apoia em [Python](/?c=langages-de-programmation&s=python) para a implementação e nas [redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)/[arquiteturas de visão](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) da seção [IA](/?c=ia) para o funcionamento dos modelos subjacentes.

O fio condutor é que um documento nunca é uma coisa só: uma página de PDF mistura texto realmente armazenado como tal (nativo, confiável de extrair) e conteúdo que só existe em forma de imagem (scan, tabela complexa), que precisa ser interpretado visualmente antes de se tornar utilizável. Distinguir os dois, e saber quando alternar de um para o outro, é a questão que se repete em cada capítulo desta seção.

Você vai encontrar os diferentes conceitos abaixo:
