---
order: 5
---

# Criptografia aplicada para desenvolvedores

A criptografia reúne as técnicas que protegem um dado contra a leitura ou modificação por alguém que não deveria ter acesso a ele. Este capítulo cobre o vocabulário e os erros mais comuns; o hashing específico de senhas, já detalhado em profundidade, é tratado em [Senhas e hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage).

## Hashing versus criptografia: uma confusão frequente

Ambos transformam um dado, mas com objetivos opostos:

| | Hashing | Criptografia |
|---|---|---|
| Sentido da operação | Unidirecional: é impossível recuperar a entrada | Reversível: o dado original é recuperado com a chave correta |
| Objetivo | Verificar que um dado não mudou, ou compará-lo sem armazená-lo em texto puro | Tornar um dado ilegível sem a chave, podendo lê-lo novamente depois |
| Exemplo de uso | Armazenar uma senha, verificar a integridade de um arquivo baixado | Proteger um arquivo confidencial, proteger uma conexão de rede (TLS) |

> **Armadilha:** falar em "descriptografar" uma senha com hash para recuperá-la. Um hash não tem nenhuma chave associada que permita revertê-lo: é exatamente isso que o torna adequado para senhas (ver [Senhas e hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), e inadequado para qualquer dado que precise ser lido novamente algum dia (caso em que a criptografia é a ferramenta certa).

## Criptografia simétrica e assimétrica

| | Simétrica | Assimétrica |
|---|---|---|
| Chave(s) | Uma única chave, usada para criptografar **e** descriptografar | Um par: uma chave pública (criptografar, ou verificar uma assinatura) e uma chave privada (descriptografar, ou assinar) |
| Velocidade | Rápida | Muito mais lenta |
| Principal desafio | Fazer a chave secreta chegar à outra parte sem ser interceptada | Nenhum segredo a transmitir: a chave pública pode circular livremente |
| Exemplo de algoritmo | [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) | [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem), curvas elípticas (ECC) |

```text
Simetrica                               Assimetrica

  Remetente          Destinatario         Remetente             Destinatario
  chave secreta K    chave secreta K      chave publica do      chave privada do
       |                   |              destinatario          destinatario
       v                   v                   |                     |
  criptografa com K  descriptografa com K       v                     v
                                          criptografa com a      descriptografa com
                                          chave publica          a chave privada
                                          (qualquer um pode        (so o
                                           criptografar)            destinatario le)
```

Na prática, os dois costumam se combinar: o TLS (ver o panorama de ataques de rede em [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite)) usa criptografia assimétrica para trocar uma chave de sessão, e depois passa para a simétrica (mais rápida) no resto da conexão.

## A assinatura digital: o inverso da criptografia assimétrica

Uma **assinatura digital** prova que um dado realmente vem do remetente esperado, e que não foi alterado desde então: o remetente assina com sua chave **privada**, e qualquer um pode verificar com a chave **pública** (o inverso da criptografia, em que se criptografa com a chave pública do destinatário). O princípio é o mesmo da assinatura de um [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens): garantir a integridade, nunca a confidencialidade por si só.

## Erros comuns a evitar

| Erro | Por que é perigoso | Boa prática |
|---|---|---|
| Implementar seu próprio algoritmo de criptografia | Um algoritmo caseiro nunca passou pela análise profunda que os algoritmos padrão, publicados e testados por toda a comunidade de criptografia por anos, já passaram | Sempre usar uma biblioteca de criptografia reconhecida, nunca uma implementação caseira |
| Gerar uma chave ou salt com um gerador aleatório comum | Um gerador não criptográfico é previsível (ver [Aleatoriedade e geradores](/?c=representation-des-donnees&p=aleatoire-et-generateurs)) | Sempre usar um CSPRNG para tudo que precise permanecer secreto |
| Reutilizar a mesma chave para tudo | Uma chave comprometida em um contexto compromete então todos os usos que a compartilham | Uma chave dedicada por uso, com rotação regular (ver [Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets)) |
| Armazenar a chave de criptografia junto ao dado criptografado | Equivale a deixar a chave de casa debaixo do tapete: quem acessa os dados também acessa a chave | Armazenar a chave separadamente (ver [Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets)) |
| Usar um algoritmo obsoleto (DES, RC4) | Quebrável com poder computacional moderno, às vezes em poucas horas | Usar os padrões atuais (AES, curvas elípticas modernas) |

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O hashing é unidirecional (verificar/comparar); a criptografia é reversível (proteger e depois ler novamente). A criptografia simétrica usa uma única chave compartilhada; a assimétrica, um par de chaves pública/privada. Uma assinatura digital garante integridade, não confidencialidade. |
| **Ferramentas utilizáveis** | AES (simétrica), RSA/ECC (assimétrica), uma biblioteca de criptografia padrão da linguagem usada em vez de uma implementação caseira. |
| **Armadilhas a evitar** | Confundir hashing e criptografia; implementar seu próprio algoritmo; reutilizar a mesma chave em todo lugar; usar um gerador aleatório não criptográfico para uma chave ou salt. |
| **Boas práticas** | Uma chave dedicada por uso; um CSPRNG para tudo que for secreto; algoritmos padrão, nunca caseiros; uma chave armazenada separadamente dos dados que protege. |
