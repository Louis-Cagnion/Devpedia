---
order: 7
---

# O hash perceptual: reconhecer imagens semelhantes, não idênticas

Uma [função de hash criptográfica](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) tem uma propriedade precisa: mudar um único pixel de uma imagem muda completamente seu resultado. Perfeito para detectar que um arquivo foi alterado até o bit, inútil para responder a uma pergunta diferente: "essas duas fotos mostram a mesma coisa, mesmo que uma tenha sido recortada, recomprimida ou levemente retocada?" Esse é o papel do **hash perceptual** (*perceptual hashing*, muitas vezes abreviado como pHash): uma função de hash projetada para produzir resultados **próximos** quando as imagens são visualmente próximas, ao contrário de uma função criptográfica ou de uma [tabela de hash](/?c=langages&s=c&p=tables-de-hachage) comum.

| | Hash criptográfico | Hash perceptual |
|---|---|---|
| Objetivo | Detectar a menor alteração | Detectar uma semelhança visual |
| Um pixel muda | Resultado totalmente diferente | Resultado quase idêntico |
| Duas imagens visualmente próximas | Resultados sem relação | Resultados próximos (poucos bits diferentes) |
| Uso típico | Verificar a integridade de um arquivo | Detectar duplicatas, uma imagem já vista em outro lugar |

## O princípio, versão simplificada: o *average hash* (aHash)

Um dos métodos mais simples reduz uma imagem a uma impressão de 64 bits em quatro etapas:

```text
1. Reduzir a imagem a uma grade minuscula (8x8 pixels), em escala de cinza
2. Calcular o brilho medio desses 64 pixels
3. Para cada pixel: 1 se mais claro que a media, 0 se mais escuro
4. Concatenar esses 64 bits: essa e a impressao perceptual da imagem
```

Reduzir a imagem a uma grade tão grosseira elimina propositalmente os detalhes finos (compressão, leve recorte, filtro de cor) enquanto preserva a estrutura geral clara/escura da imagem: duas fotos do mesmo assunto produzem então uma impressão quase idêntica, mesmo depois dessas modificações.

## Comparar duas impressões: a distância de Hamming

Duas impressões perceptuais se comparam contando o número de bits diferentes entre elas (a **distância de Hamming**):

```text
Imagem A : 1 0 1 1 0 0 1 0 ...
Imagem B : 1 0 1 1 0 1 1 0 ...
                    ↑
         1 unico bit diferente → imagens quase identicas

Imagem C : 0 1 0 0 1 1 0 1 ...
         → quase todos os bits diferentes → imagens sem relacao
```

Quanto menor a distância, mais próximas visualmente as duas imagens são; um limiar (por exemplo, menos de 10 bits diferentes em 64) permite decidir automaticamente se duas imagens contam como "a mesma", sem nunca compará-las pixel por pixel.

## Para que serve

| Uso | Explicação |
|---|---|
| Detecção de duplicatas | Encontrar fotos já presentes em uma biblioteca, mesmo recomprimidas ou redimensionadas |
| Busca reversa de imagem | Encontrar a origem de uma imagem encontrada on-line |
| Moderação de conteúdo | Bloquear automaticamente uma imagem já sinalizada, mesmo repostada em um formato ligeiramente diferente |

> **Cuidado:** usar o hash perceptual como mecanismo de segurança (autenticação, prova de integridade). Ele é projetado para tolerar pequenas variações, não para resistir a uma manipulação intencional: alguém que conhece o algoritmo pode modificar levemente uma imagem para fazê-la produzir uma impressão diferente (ou, ao contrário, fazer coincidir a impressão de duas imagens diferentes), algo que um hash criptográfico torna inviável por projeto.
>
> **Boa prática:** reservar o hash perceptual a usos de similaridade e deduplicação, nunca a um uso de segurança; para verificar se um arquivo não foi alterado, usar um hash criptográfico como SHA-256, que responde a uma necessidade diferente.

## O que reter

| | |
|---|---|
| **O que reter** | O hash perceptual produz impressões próximas para imagens visualmente próximas, ao contrário de um hash criptográfico que muda radicalmente à menor alteração de pixel. A distância de Hamming entre duas impressões mede sua semelhança. |
| **Ferramentas úteis** | Bibliotecas de imagem já implementam aHash/pHash/dHash, sem precisar reescrever o algoritmo você mesmo. |
| **Armadilhas a evitar** | Usar um hash perceptual como mecanismo de segurança ou de prova de integridade. |
| **Boas práticas** | Reservar o hash perceptual à similaridade/deduplicação; manter um hash criptográfico para a integridade. |
