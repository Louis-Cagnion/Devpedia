---
order: 2
---

# Controlar a prosódia

Um modelo que produz um áudio inteligível não basta: o mesmo texto pode ser lido de forma monótona e robótica, ou com uma intonação natural. Este capítulo cobre a **prosódia**: o que, em uma voz, não depende da escolha das próprias palavras.

## Os três componentes da prosódia

| Componente | O que controla | Exemplo |
|---|---|---|
| **Altura** (*pitch*, ou F0) | A frequência fundamental da voz, percebida como "grave" ou "aguda" | Uma intonação ascendente no final da frase sinaliza uma pergunta |
| **Duração** | A velocidade de fala, e o alongamento de certos sons | Uma sílaba acentuada dura mais que as outras |
| **Energia** | O volume, e sua evolução ao longo de uma frase | Uma sílaba acentuada também é mais forte |

```text
"Voce vem?"            vs        "Voce vem."
       ↗                                ↘
   altura que sobe             altura que desce
   no final da frase           no final da frase
   -> percebido como pergunta  -> percebido como afirmacao
```

O mesmo texto, com uma prosódia diferente, muda o sentido percebido pelo ouvinte, mesmo que as próprias palavras não mudem.

## Onde a prosódia se decide, de acordo com a arquitetura

O [Tacotron](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) controla a prosódia apenas **implicitamente**: o modelo aprendeu, a partir dos exemplos de treinamento, uma prosódia plausível para um texto dado, sem que nenhum parâmetro explícito do modelo represente "a altura" ou "a duração" separadamente. Arquiteturas mais recentes adicionam um controle **explícito**:

```text
Tacotron (controle implicito):
Texto -> [modelo] -> espectrograma (prosodia deduzida automaticamente)

Modelo com controle explicito de prosodia:
Texto + parametros de prosodia desejados (altura, duracao, energia)
     -> [modelo] -> espectrograma que respeita esses parametros
```

> **Cuidado:** esperar de um modelo com controle implícito (como um Tacotron padrão) que ele produza uma prosódia precisa e reproduzível sob comando (por exemplo, "insistir nesta palavra específica"). Sem parâmetro explícito para isso, o resultado depende unicamente do que o modelo aprendeu a associar a um texto dessa forma, não de uma instrução direta.
>
> **Boa prática:** usar uma arquitetura com controle explícito de prosódia sempre que o caso de uso exigir uma intonação precisa (dar ênfase a uma palavra, marcar uma pausa intencional), em vez de esperar obtê-la indiretamente só pelo texto de entrada.

## Um controle grosseiro existe até em uma API simples

A [Web Speech API](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) do navegador, muito mais simples que um modelo neural com controle explícito, já expõe os três componentes acima, em uma forma reduzida a um único ajuste global por frase em vez de uma curva detalhada:

```javascript
const enunciado = new SpeechSynthesisUtterance("Ola pessoal");
enunciado.pitch = 1.2;   // altura: 0 (grave) a 2 (aguda), 1 por padrao
enunciado.rate = 0.9;    // duracao/velocidade: 0.1 (lento) a 10 (rapido), 1 por padrao
enunciado.volume = 1.0;  // energia/volume: 0 (silencioso) a 1 (alto)
```

Diferente de um modelo neural com controle explícito, esses três ajustes se aplicam uniformemente a toda a frase: impossível aumentar a altura em apenas uma palavra específica sem dividir a frase em vários enunciados sucessivos.

> **Cuidado:** ajustar `pitch`/`rate`/`volume` de ouvido, frase por frase, sem método. Esses ajustes agem globalmente sobre todo o enunciado: querer dar ênfase a uma única palavra exige dividir o texto em vários `SpeechSynthesisUtterance` distintos, um por segmento com seu próprio valor, não um único ajuste na frase inteira.
>
> **Boa prática:** dividir explicitamente um texto em segmentos sempre que um controle de prosódia diferenciado for buscado, mesmo com uma API tão simples quanto a Web Speech API.

Veja também [Modelos modernos de síntese](/?c=ia&s=voix-ia&p=modeles-modernes-synthese) para arquiteturas que vão além desse controle explícito básico.

## O que reter

| | |
|---|---|
| **O que reter** | A prosódia (altura, duração, energia) carrega parte do sentido percebido, independentemente das próprias palavras. Um modelo como o Tacotron a controla implicitamente, deduzida do treinamento; arquiteturas mais recentes expõem um controle explícito. Até uma API simples como a Web Speech API expõe essas três alavancas, mas globalmente por enunciado. |
| **Ferramentas úteis** | `pitch`/`rate`/`volume` de `SpeechSynthesisUtterance` para um controle básico. Uma arquitetura com controle explícito para uma necessidade mais precisa. |
| **Armadilhas a evitar** | Esperar uma prosódia precisa e reproduzível de um modelo com controle implícito. Ajustar os controles de uma API simples de ouvido sem dividir o texto por segmento. |
| **Boas práticas** | Usar um modelo com controle explícito sempre que uma intonação precisa for necessária. Dividir o texto em segmentos para diferenciar a prosódia, mesmo com uma API simples. |
