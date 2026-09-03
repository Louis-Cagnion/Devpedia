---
order: 15
---

# A Web Speech API: reconhecimento e síntese de voz no navegador

A **Web Speech API** é uma API do **próprio navegador** (não uma biblioteca de terceiros para instalar): ela expõe diretamente em JavaScript o **reconhecimento de voz** (transformar uma voz captada pelo microfone em texto) e a **síntese de voz** (transformar um texto em voz), sem passar por um serviço externo.

| | Reconhecimento de voz | Síntese de voz |
|---|---|---|
| Papel | Voz → texto | Texto → voz |
| Interface JavaScript | `SpeechRecognition` (`webkitSpeechRecognition` em alguns navegadores) | `speechSynthesis` |
| Exemplo de uso | Digitar uma busca por voz | Ler um texto em voz alta (a leitura em áudio deste site, por exemplo, se apoia em `speechSynthesis` como alternativa) |

## O reconhecimento de voz: um modelo orientado a eventos

Diferente do [modelo por Promise visto na programação assíncrona](/?c=langages&s=javascript&p=asynchrone), o reconhecimento de voz não retorna um único resultado esperado com `await`: ele dispara **eventos**, potencialmente várias vezes, conforme vai captando.

```javascript
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!Recognition) {
    // Alternativa obrigatoria: a API nao existe neste navegador
    mostrarBuscaClassica();
} else {
    const reconhecimento = new Recognition();
    reconhecimento.lang = "pt-BR";

    reconhecimento.onresult = (evento) => {
        const texto = evento.results[0][0].transcript;
        executarBusca(texto);
    };

    reconhecimento.onerror = (evento) => {
        console.log("Erro de reconhecimento:", evento.error);
        mostrarBuscaClassica();   // alternativa em caso de falha (microfone negado, etc.)
    };

    reconhecimento.start();
}
```

| Callback | Disparado quando |
|---|---|
| `onresult` | Um resultado (texto transcrito) está disponível |
| `onerror` | Ocorre um erro (microfone negado, rede, idioma não suportado...) |
| `onend` | A sessão de escuta termina, com ou sem resultado |

## A síntese de voz: uma fila de enunciados

```javascript
const enunciado = new SpeechSynthesisUtterance("Olá, isto é um teste.");
enunciado.lang = "pt-BR";
enunciado.rate = 1.2;   // velocidade de leitura

speechSynthesis.speak(enunciado);   // adiciona o enunciado a fila e o le
```

`speechSynthesis.speak()` empilha o enunciado em uma **fila** interna do navegador: chamar `speak()` várias vezes seguidas não os lê todos ao mesmo tempo, mas um após o outro.

## Suporte desigual entre navegadores

> **Armadilha:** usar `SpeechRecognition` sem verificar sua presença (`window.SpeechRecognition || window.webkitSpeechRecognition`). Alguns navegadores só expõem a API sob o nome com prefixo `webkitSpeechRecognition`, outros não a expõem de forma alguma: sem verificação, o script falha silenciosamente (`undefined is not a constructor`) em navegadores não suportados.
>
> **Boa prática:** sempre verificar a presença da API antes de usá-la, e prever uma alternativa funcional (um campo de busca de texto clássico) em vez de tornar o recurso de voz obrigatório.

---

## 📋 O que reter

| | |
|---|---|
| **O que reter** | A Web Speech API expõe reconhecimento (`SpeechRecognition`) e síntese (`speechSynthesis`) de voz diretamente no navegador. O reconhecimento funciona por eventos (`onresult`, `onerror`), não por Promise. |
| **Ferramentas úteis** | `SpeechRecognition`/`webkitSpeechRecognition`, `SpeechSynthesisUtterance`, `speechSynthesis.speak()`. |
| **Armadilhas a evitar** | Usar a API sem verificar sua presença (prefixo `webkit`, ou ausência total em alguns navegadores); ignorar `onerror`. |
| **Boas práticas** | Sempre prever uma alternativa funcional caso a API esteja ausente ou falhe; tratar explicitamente `onerror`, não apenas o caso de sucesso. |
