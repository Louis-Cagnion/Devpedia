---
order: 10
---

# Tecla travada: o teclado virtual XTEST e o `xdotool`

Para testar uma aplicação gráfica (um jogo, um programa 3D como o do [capítulo sobre o loop de renderização](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), um script pode « pressionar » teclas no lugar de uma pessoa: manter uma seta por um segundo e medir até onde o objeto foi, por exemplo. No Linux, a ferramenta que faz isso se apoia em um **teclado virtual**. Este capítulo explica como ele funciona, a armadilha que deixa uma tecla **pressionada para a máquina inteira**, como reconhecê-la e como se proteger.

## Um teclado invisível: XTEST e `xdotool`

No Linux, o **servidor de exibição** é o programa que gerencia a tela, o teclado e o mouse, e que distribui teclado e mouse às janelas ([X11](https://www.x.org/wiki/) é o mais difundido). Ele prevê **extensões** (funções opcionais do protocolo que os programas usam para falar com ele). O **XTEST** ([especificação](https://www.x.org/releases/current/doc/xextproto/xtest.html)) é uma delas: permite a um programa **injetar eventos** como se viessem de um teclado real, por meio de um **teclado virtual**. O [`xdotool`](https://github.com/jordansissel/xdotool) é o comando que a utiliza.

Uma digitação se compõe de **dois eventos**: a **pressão** (*keydown*) e depois a **liberação** (*keyup*). Enquanto a liberação não chegou, o servidor considera a tecla **mantida**.

| Comando | Eventos enviados | Efeito |
|---|---|---|
| `xdotool key Escape` | pressão e depois liberação | uma digitação completa |
| `xdotool keydown Left` | apenas pressão | a seta esquerda **continua pressionada** |
| `xdotool keyup Left` | apenas liberação | a seta esquerda é liberada |

Manter uma tecla por um tempo dado se escreve, portanto, em três passos:

```bash
xdotool keydown Left   # a tecla está pressionada
sleep 1                # a aplicação a vê mantida por 1 segundo
xdotool keyup Left     # liberação: sem esta linha, a tecla continua pressionada
```

## A armadilha: uma tecla pressionada para a máquina inteira

Se o script parar **entre** `keydown` e `keyup`, a liberação nunca é enviada:

```
tempo  ──────────────────────────────────────────────────────►
script   keydown ─── trabalho ─── ✕ interrompido    keyup (nunca executado)
servidor tecla pressionada ──────────────────────────────────────► ainda pressionada
```

O servidor então repete a tecla **automaticamente** (a **autorrepetição**: uma tecla mantida produz digitações em série, como quando se deixa o dedo em cima) e a envia à janela que tem o **foco** (a que recebe o teclado naquele instante). Não é mais a aplicação testada: é o editor, o terminal, o que estiver em primeiro plano, mesmo depois de o teste terminar.

| O que interrompe o script | Por que o `keyup` se perde |
|---|---|
| `Ctrl-C` | o script recebe o **sinal** `SIGINT` (uma mensagem que o sistema envia a um programa) e para |
| `timeout` | envia o sinal `SIGTERM` ao fim do prazo |
| `kill PID` | sinal `SIGTERM` |
| `kill -9 PID`, memória esgotada (o sistema mata o programa) | sinal `SIGKILL`: o programa **não** tem nenhuma chance de reagir |
| Falha do script ou erro de sintaxe entre as duas linhas | a linha `keyup` nunca é alcançada |

## Reconhecer uma tecla travada

Os sintomas: uma letra ou uma seta que se repete sem fim numa janela sem relação, caracteres que se escrevem sozinhos. Duas formas de verificar:

| Método | O que mostra |
|---|---|
| `xinput query-state ID` | o **`xinput`** lista (`xinput list`) e consulta os dispositivos de entrada; no teclado virtual (chamado « Virtual core XTEST keyboard »), uma tecla travada aparece como `key[9]=down` |
| `XQueryKeymap` | função da **Xlib** (a biblioteca C que fala com o servidor X): preenche um vetor de 32 bytes, ou seja **256 casas com 0 ou 1**, uma por **código de tecla** (o número que o servidor dá a cada tecla física; 9 para Esc num teclado padrão) |

```c
/* Devolve 1 se a tecla de codigo « keycode » esta pressionada segundo o servidor X, 0 se nao. */
static int key_is_down(Display *display, unsigned int keycode)
{
	char keys[32];                      /* 32 bytes = 256 casas, uma por codigo de tecla */

	XQueryKeymap(display, keys);        /* o servidor preenche o vetor */
	return ((unsigned char)keys[keycode / 8] >> (keycode % 8)) & 1;   /* byte keycode/8, bit keycode%8 */
}
```

O código de uma tecla depende do teclado e do seu layout: pergunta-se à Xlib (`XKeysymToKeycode`, que converte o **símbolo** de uma tecla, por exemplo o de Esc, em um código) em vez de escrevê-lo fixo.

## Liberá-la

O mais simples, à mão: `xdotool keyup Escape`. Em um programa C, envia-se o mesmo evento pelo XTEST:

```c
/* Libera a tecla se estiver travada. Devolve 1 se estava, 0 se nao, -1 em caso de erro. */
int release_if_stuck(unsigned int keycode)
{
	Display *display = XOpenDisplay(NULL);   /* NULL: servidor designado pela variavel DISPLAY */
	const char *shown = getenv("DISPLAY");   /* apenas para a mensagem de erro */
	int stuck;

	if (!display)
	{
		fprintf(stderr, "servidor X inacessivel (variavel DISPLAY: %s)\n", shown ? shown : "ausente");
		return -1;
	}
	stuck = key_is_down(display, keycode);
	if (stuck && !XTestFakeKeyEvent(display, keycode, 0, 0))   /* 0: liberacao (keyup) */
	{
		fprintf(stderr, "extensao XTEST indisponivel: tecla %u nao liberada\n", keycode);
		XCloseDisplay(display);
		return -1;
	}
	XFlush(display);                         /* envia a ordem sem esperar */
	XCloseDisplay(display);
	return stuck;
}
```

Testada sob o **Xvfb** (um servidor X sem tela, que permite testar sem exibição real): antes da pressão, `key_is_down` devolve 0; depois de um `keydown` sozinho, 1; `release_if_stuck` devolve então 1 e, logo em seguida, a tecla volta a 0; uma segunda chamada devolve 0 (nada a fazer).

## Garantir a liberação: `trap`

O remédio é prever a liberação **antes** de pressionar. O comando `trap` ([veja o capítulo sobre processos](/?c=shells&s=bash&p=gestion-des-processus)) registra uma ação que o script executará ao sair, qualquer que seja o motivo:

```bash
release() { xdotool keyup Left; }   # inofensivo se a tecla ja estiver liberada
trap release EXIT                   # EXIT: a cada saida do script, normal ou causada por um sinal

xdotool keydown Left
sleep 30 &                          # o comando longo (aqui sleep, na pratica a aplicacao testada)...
wait $!                             # ...e aguardado pelo « wait » ($!: numero do ultimo processo lancado)
```

Testado com a liberação substituída por uma linha escrita em um arquivo (o `xdotool` não está instalado na máquina de teste):

| Interrupção | Resultado com `trap release EXIT` |
|---|---|
| `kill` (sinal `SIGTERM`) | liberada **uma vez**, em 1 s |
| `timeout 2 comando` | liberada **uma vez** |
| `kill -9` (sinal `SIGKILL`) | **nunca** liberada |

> **Armadilha (o `trap` é adiado):** o bash só executa o `trap` **depois que o comando em andamento termina**. Com um simples `sleep 30` no lugar de `sleep 30 & wait $!`, cada teste esperou os 30 segundos antes de liberar (a série completa durou mais de 4 minutos). O `wait`, ao contrário, é interrompido imediatamente por um sinal: lança-se então o comando longo em segundo plano e depois o aguarda com `wait`.

> **Armadilha (executado duas vezes):** `trap release EXIT INT TERM` libera **duas vezes** num `SIGTERM` (uma pelo sinal, outra pela saída que se segue). Basta `trap release EXIT`, e o tratador deve ser **inofensivo se rodar duas vezes** (liberar uma tecla já liberada não faz nada).

> **Armadilha (`SIGKILL`):** nenhum `trap` captura `kill -9` nem uma parada forçada por falta de memória. Nunca matar um teste assim enquanto uma tecla estiver pressionada; e **ao iniciar** o teste seguinte, chamar `release_if_stuck` (acima) ou `xdotool keyup` em cada tecla usada, para reparar uma parada brusca anterior.

## Em outras máquinas

| Situação | Comportamento |
|---|---|
| Servidor X11 (o caso comum) | `xdotool` e XTEST funcionam |
| Wayland (outro servidor de exibição, cada vez mais comum) | o `xdotool` só alcança as aplicações lançadas pelo **XWayland** (a camada de compatibilidade com o X11); as demais exigem outra ferramenta |
| Máquina sem tela (servidor, contêiner, integração contínua) | `xvfb-run comando` inicia um servidor X virtual (Xvfb) durante o comando |
| Variável `DISPLAY` ausente ou errada | `xdotool` e `XOpenDisplay` falham: a mensagem deve nomear a variável, como em `release_if_stuck` |

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O `xdotool` injeta teclas pela extensão XTEST do servidor X, por meio de um teclado virtual. Uma digitação é uma pressão e depois uma liberação; se o script parar entre as duas, a tecla continua pressionada para a máquina inteira e se repete na janela que tem o foco. Reconhece-se com `xinput query-state` ou `XQueryKeymap`, e libera-se com `xdotool keyup` ou `XTestFakeKeyEvent`. |
| **Ferramentas utilizáveis** | `xdotool key`/`keydown`/`keyup`, `xinput list`/`query-state`, `XQueryKeymap`, `XTestFakeKeyEvent`, `trap`, `wait`, `timeout`, `xvfb-run`. |
| **Armadilhas a evitar** | Um `keydown` sem `keyup` garantido. Um `trap` adiado por um comando longo lançado em primeiro plano. Um `trap` em `EXIT INT TERM` executado duas vezes. `kill -9` num teste que mantém uma tecla. Código de tecla escrito fixo. Variável `DISPLAY` ausente sem sinalização. |
| **Boas práticas** | Colocar `trap release EXIT` antes do `keydown`; lançar o comando longo em segundo plano e depois `wait $!`. Liberar cada tecla usada ao iniciar o teste seguinte. Pedir o código de tecla à Xlib. Testar sob o Xvfb em vez de na tela de trabalho. |
