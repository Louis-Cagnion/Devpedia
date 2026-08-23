---
order: 5
---

# O CTF: Capture The Flag

Um **CTF** (*Capture The Flag*) é uma competição de segurança da informação em que cada desafio resolvido rende uma **flag**: uma string que prova que o desafio foi realmente resolvido (ex: `FLAG{est0ur0_d3_buff3r}`), a ser enviada em uma plataforma para marcar pontos. É o formato de treinamento mais comum para praticar legalmente as técnicas vistas nesta categoria, em programas feitos de propósito para serem atacados, em vez de em um sistema real.

## Dois grandes formatos

| Formato | Princípio |
|---|---|
| **Jeopardy** | Desafios independentes, organizados por categoria, cada um com sua própria pontuação; os participantes escolhem livremente quais resolver |
| **Attack-defense** | Cada equipe recebe os mesmos serviços para rodar: precisa ao mesmo tempo defendê-los (corrigir suas falhas) e atacar os das outras equipes para roubar suas flags, em tempo real |

O formato jeopardy, mais simples de organizar e de acompanhar sozinho, é de longe o mais comum para o aprendizado individual; o attack-defense se aproxima mais de um exercício de equipe em condições quase reais.

## As categorias clássicas de um CTF jeopardy

| Categoria | O que cobre |
|---|---|
| **Pwn** | Exploração binária: [corrupção de memória](/?c=securite&s=securite-offensive&p=corruption-memoire) em um programa fornecido |
| **Rev** | Engenharia reversa ([desmontador/depurador](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie)): entender um binário para extrair uma informação escondida |
| **Web** | Falhas web clássicas, ver [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10) |
| **Crypto** | Atacar uma implementação criptográfica mal feita |
| **Forensics** | Encontrar uma informação escondida em um arquivo, uma captura de rede, uma imagem de disco |
| **Misc** | Tudo o que não se encaixa em outra categoria (geralmente enigmas de lógica ou programação) |

## A ligação com o pentest e o bug bounty

Um CTF compartilha o espírito do [pentest](/?c=cybersecurite&p=tests-et-audit-de-securite) (atacar um sistema com as técnicas de um atacante real), mas em um contexto totalmente fictício e propositalmente vulnerável, em vez de um sistema real com um mandato por escrito: é o lugar para praticar sem precisar se preocupar com o marco legal a cada etapa, já que o marco já é o da própria competição.

> **Boa prática:** começar por CTFs voltados ao aprendizado (com correção/redação detalhada disponível depois, chamada de *write-up*) em vez de competitivos, para progredir no próprio ritmo sem a pressão do ranking.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um CTF é uma competição em que cada desafio resolvido rende uma flag. O formato jeopardy (desafios independentes por categoria) domina o aprendizado individual; o attack-defense (defender seus serviços, atacar os dos outros em tempo real) se aproxima de um exercício de equipe. As categorias clássicas correspondem aos capítulos desta seção (pwn, rev, web, crypto), além de forensics e misc. |
| **Ferramentas utilizáveis** | Uma plataforma de CTF de treinamento com write-ups disponíveis para progredir após um desafio não resolvido. |
| **Armadilhas a evitar** | Se lançar em um CTF competitivo antes de ter praticado os fundamentos de cada categoria visada. |
| **Boas práticas** | Ler o write-up de um desafio não resolvido depois da competição em vez de desistir: costuma ser a forma mais rápida de progredir. |
