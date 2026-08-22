---
order: 3
---

# PHP

Uma [linguagem de programação](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) é um conjunto de regras que permite escrever instruções que um computador pode executar. PHP é uma delas, projetada especificamente para rodar em um servidor web e gerar páginas sob demanda.

```php
<?php
$nome = "Devpedia";      // uma variavel, veja o capitulo dedicado
echo "Ola, $nome";       // exibe: Ola, Devpedia
```

| Termo | O que significa |
|---|---|
| Alto nível | Esconde grande parte dos detalhes técnicos ligados à máquina, ao contrário de uma linguagem de baixo nível como o [C](/?c=langages-de-programmation&s=c&p=c) |
| Coletor de lixo (*garbage collector*) | Como em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), a memória dos valores que se tornaram inutilizados é liberada automaticamente |
| Requisição HTTP | A mensagem que um navegador envia a um servidor para solicitar uma página (veja [As trocas de dados: API e HTTP](/?c=infrastructure&p=api-et-http)). PHP executa do lado do servidor, precisamente para responder a essas requisições |

Aprender PHP permite entender como um servidor web processa uma requisição e interage com um banco de dados (veja [SQL](/?c=domain-specific-languages-dsl&p=sql)) para gerar uma resposta. Ele continua amplamente usado para sites dinâmicos, CMS ([WordPress](https://wordpress.org), [Drupal](https://www.drupal.org)) e frameworks como [Laravel](https://laravel.com) ou [Symfony](https://symfony.com).
