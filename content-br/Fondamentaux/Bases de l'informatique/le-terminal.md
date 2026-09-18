---
order: 2
---

# O terminal: dar instruções por escrito

O capítulo anterior explica que [o código é uma lista de instruções](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers), mas como se dá uma ordem a um computador na prática, sem clicar em um ícone? É essa a função do terminal.

## Duas formas de controlar um computador

| | Interface gráfica (GUI) | Linha de comando (CLI) |
|---|---|---|
| Como se dá uma ordem | Clicando em ícones, botões, menus | Escrevendo uma instrução em texto |
| Exemplo concreto | Arrastar um arquivo para a lixeira | Digitar uma instrução que exclui esse arquivo |
| Vantagem principal | Imediatamente visual, nada para memorizar | Preciso, repetível, automatizável (repetir a mesma instrução 100 vezes de uma vez) |

**GUI** (*Graphical User Interface*) e **CLI** (*Command-Line Interface*) são as duas siglas que você vai encontrar em todo lugar para designar esses dois mundos. Este site foca principalmente no segundo.

> **Cuidado:** supor que uma exclusão em CLI passa por uma lixeira, como em GUI. A maioria dos comandos de exclusão é **definitiva** e imediata, sem etapa de recuperação possível.
>
> **Boa prática:** antes de digitar um comando que modifica ou exclui algo, verificar uma última vez o que ele afeta exatamente: não há um "desfazer" depois.

## O terminal e o shell: duas coisas diferentes

Duas palavras aparecem o tempo todo, e costumam ser confundidas:

- O **terminal** é o programa que exibe uma janela de texto: ele recebe o que você digita, e exibe o que é respondido a ele. Ele mesmo não entende nada.
- O **shell** é o programa que recebe esse texto do terminal, o interpreta, e o executa de fato.

```text
Voce digita: ls
      │
      ▼
Terminal (a janela)     →  transmite o texto digitado
      │
      ▼
Shell (o interpretador) →  entende "ls", pede ao sistema a lista de arquivos
      │
      ▼
Resultado exibido no terminal
```

> **Analogia:** o terminal é o aparelho de telefone, o shell é a pessoa com quem você fala. O aparelho não entende seu pedido: ele só transmite sua voz e devolve a resposta.

> **Aprofundar:** este site detalha em profundidade dois shells muito usados, [Bash](/?c=shells&s=bash&p=bash) (Linux/macOS) e [PowerShell](/?c=shells&s=powershell&p=powershell) (Windows), cada um com seu próprio vocabulário de comandos.

> **Cuidado:** tentar "resolver" um comando que não funciona trocando o aplicativo de terminal. A aparência (cores, fonte, abas) depende do terminal; os comandos disponíveis dependem unicamente do shell: trocar um nunca muda o outro.
>
> **Boa prática:** diante de um comando que falha, perguntar-se primeiro "qual shell o interpreta, e ele o conhece?" antes de questionar o terminal em si.

## Abrir um terminal

| Sistema | Como abrir |
|---|---|
| Windows | Menu Iniciar → digitar "Terminal" ou "PowerShell" → Enter |
| macOS | Spotlight (`Cmd + Espaço`) → digitar "Terminal" → Enter |
| Linux | Depende do ambiente de desktop: geralmente `Ctrl + Alt + T`, ou no menu de aplicativos |

Uma vez aberto, o terminal exibe uma linha que termina com um símbolo (`>`, `$`, `%`...) seguido de um cursor piscando: é o **prompt**. Ele espera que você digite algo; nada é executado antes de apertar `Enter`.

> **Cuidado:** no Windows, confundir o **Prompt de Comando** ([`cmd.exe`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd), o antigo shell histórico do Windows) com o **PowerShell**: os dois se parecem visualmente, mas seus comandos e sua sintaxe diferem bastante.
>
> **Boa prática:** em uma máquina recente, preferir o PowerShell (mais completo, veja o [capítulo dedicado](/?c=shells&s=powershell&p=powershell)) ao Prompt de Comando, exceto por uma razão específica de usar este último.

## Anatomia de um comando

Um **comando** é o nome de uma instrução que o shell sabe executar. Ele pode ser seguido de **argumentos** (sobre o que agir) e **opções** (que mudam seu comportamento, geralmente precedidas de `-` ou `--`):

```text
ls -l /home
│  │  │
│  │  └── argumento: a pasta em questao
│  └───── opcao: exibe os detalhes (tamanho, data...)
└──────── comando: listar o conteudo de uma pasta
```

O nome exato dos comandos muda de um shell para outro (`ls` no Bash se torna `Get-ChildItem` no PowerShell); é o assunto dos capítulos [Bash](/?c=shells&s=bash&p=bash) e [PowerShell](/?c=shells&s=powershell&p=powershell), não deste aqui: aqui, só a estrutura geral (comando, opções, argumentos) importa.

> **Cuidado:** uma opção que parece inofensiva pode desativar uma proteção: uma opção como "forçar" ou "sem confirmação" (geralmente `-f`/`--force`) remove justamente a pergunta "tem certeza?" que um comando faria de outra forma.
>
> **Boa prática:** em caso de dúvida sobre o efeito exato de uma opção encontrada em um comando copiado da internet, procurar sobre ela (`--help`, documentação) antes de executá-la, nunca depois.

## Colorindo a saída no terminal (códigos de escape ANSI)

Um programa pode exibir texto colorido (vermelho para sinalizar um erro, verde para sucesso...). Isso não é uma funcionalidade do shell: o programa envia uma **sequência de escape ANSI**, uma sequência especial de caracteres que o terminal reconhece e interpreta como uma instrução de formatação, e não como texto a exibir tal qual.

Uma sequência começa com o caractere `ESC` (escrito `\033` ou `\x1b` conforme a linguagem), seguido de `[`, um código numérico e depois `m`:

```text
\033[91mOlá\033[0m
```

- `\033[91m`: ativa o vermelho vivo (código `91`); tudo o que vem depois é exibido nessa cor.
- `Olá`: exibido normalmente, mas na cor ativa.
- `\033[0m`: reinicia, volta à cor padrão do terminal.

| Código | Efeito |
|---|---|
| `0` | Reinicia tudo (cor, negrito...) |
| `31` / `91` | Vermelho / vermelho vivo |
| `32` / `92` | Verde / verde vivo |
| `33` / `93` | Amarelo / amarelo vivo |
| `1` | Negrito |

> **Armadilha:** esquecer o código `0` de reinício no final de uma sequência. Sem ele, a cor "vaza" para todo o texto exibido depois pelo terminal, bem além do fim do programa que a emitiu.
>
> **Boa prática:** sempre fechar uma cor aberta com `\033[0m`, mesmo pouco antes de o programa terminar.

É o terminal que interpreta essas sequências, nunca o shell nem a linguagem de programação usada: elas podem ser concatenadas diretamente em qualquer string exibida, como caracteres comuns.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | O **terminal** exibe e transmite o texto digitado; o **shell** o interpreta e o executa de fato. Um **comando** é composto de um nome, opções (`-x`) e argumentos. Nada é executado antes do `Enter`. |
| **Ferramentas úteis** | O terminal já instalado no seu sistema (veja a tabela acima): nenhuma instalação adicional é necessária para começar. |
| **Armadilhas a evitar** | Confundir terminal e shell: mudar a aparência do terminal nunca muda os comandos disponíveis, que dependem unicamente do shell. Digitar um comando copiado sem saber o que ele faz, principalmente se ele modifica ou exclui arquivos. |
| **Boas práticas** | Ler o resultado exibido após cada comando antes de digitar outro. Em caso de dúvida sobre o efeito de um comando encontrado na internet, procurar o que ele faz antes de executá-lo, em vez de depois. |
