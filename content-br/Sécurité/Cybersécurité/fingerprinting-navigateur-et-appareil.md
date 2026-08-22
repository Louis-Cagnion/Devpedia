---
order: 12
---

# O fingerprinting: reconhecer um aparelho sem armazenar nada nele

Um site normalmente reconhece um visitante ao depositar um identificador em um [cookie](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) no aparelho dele, e depois relê-lo a cada visita. O **fingerprinting** (ou "coleta de impressão digital") alcança um objetivo parecido — reconhecer o mesmo aparelho de uma visita para outra — mas sem armazenar nada: ele combina uma série de detalhes técnicos já expostos pelo navegador para formar uma assinatura quase única.

## O princípio: combinar detalhes anódinos, individualmente pouco únicos

Tomado isoladamente, nenhum dos detalhes abaixo identifica ninguém: milhões de pessoas compartilham a mesma resolução de tela, ou o mesmo fuso horário. Mas a **combinação** deles rapidamente se torna única:

| Detalhe coletado | Exemplo de valor |
|---|---|
| Resolução de tela | 1920×1080 |
| Fuso horário | Europe/Paris |
| Idioma do navegador | pt-BR |
| Versão do navegador e do SO | Chrome 128 no Windows 11 |
| Fontes instaladas | Lista de 340 fontes detectadas |
| Renderização gráfica (Canvas/WebGL) | Impressão de pixels própria da placa gráfica |

```text
Resolucao + Fuso + Idioma + Navegador + Fontes + Renderizacao grafica
        ↓ (combinados e reduzidos a um valor unico, por hash)
                    "impressao digital" quase unica do aparelho
```

> **Analogia:** nenhuma das medidas de uma pessoa (altura, número do calçado, cor dos olhos) a identifica sozinha entre milhões de indivíduos, mas a combinação precisa delas reduz o campo a pouquíssimas pessoas. O fingerprinting faz a mesma coisa com características técnicas do navegador.

## O canvas fingerprinting: um exemplo concreto

Uma técnica muito usada consiste em fazer o navegador desenhar, em um elemento invisível da página, um texto ou uma forma geométrica precisa, e depois reler os pixels obtidos. O resultado exato depende da placa gráfica, do driver e do motor de renderização de fontes instalados, de modo que duas máquinas diferentes produzem quase sempre um resultado ligeiramente diferente, mesmo a partir do mesmo código:

```text
1. O site pede ao navegador: "desenhe este texto em uma area oculta"
2. O navegador desenha, usando sua placa grafica e suas fontes
3. O site rele os pixels obtidos, pixel por pixel
4. Esses pixels sao reduzidos a uma impressao unica (hash)
5. Essa impressao identifica a maquina, sem ter armazenado nada nela
```

## Por que essa técnica existe

| Uso | Explicação |
|---|---|
| Combate a fraudes | Reconhecer um aparelho já banido mesmo após a exclusão de seus cookies ou o uso de navegação privada |
| Detecção de bots | Um navegador de verdade produz uma impressão coerente e estável; um robô de automação costuma produzir uma impressão incoerente ou ausente |
| Publicidade direcionada | Continuar rastreando um visitante de um site para outro, mesmo que ele recuse ou apague os cookies |

> **Cuidado:** achar que recusar cookies ou navegar em modo privado impede qualquer rastreamento. O fingerprinting não depende de nenhum cookie: ele não armazena nada no aparelho, portanto não há nada para excluir nem para recusar por meio de um simples banner de consentimento de cookies.
>
> **Boa prática (desenvolvedor):** reservar o fingerprinting a usos defensivos justificados (antifraude, antibot) e documentados, nunca como contorno discreto de uma recusa de rastreamento expressa por outro meio (cookies recusados). Um uso publicitário disfarçado se expõe ao mesmo enquadramento legal do rastreamento por cookie, com um rastro muito mais difícil de justificar a posteriori diante de um usuário ou um regulador.
>
> **Boa prática (usuário):** alguns navegadores (Firefox, Safari) reduzem ativamente a precisão da impressão disponível (resultados de canvas levemente randomizados, menos detalhes expostos por padrão); uma extensão de bloqueio de fingerprinting pode complementar essa proteção.

## O que reter

| | |
|---|---|
| **O que reter** | O fingerprinting reconhece um aparelho combinando detalhes técnicos já expostos pelo navegador (tela, fuso, fontes, renderização gráfica), sem armazenar nada nele — ao contrário de um cookie. |
| **Ferramentas úteis** | As proteções antifingerprinting integradas ao Firefox/Safari, ou uma extensão dedicada. |
| **Armadilhas a evitar** | Achar que excluir os cookies ou navegar em modo privado impede qualquer rastreamento. |
| **Boas práticas** | Reservar o fingerprinting a usos defensivos justificados (fraude, bots) em vez do contorno discreto de uma recusa de rastreamento. |
