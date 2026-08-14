---
order: 3
---

# O editor de código e a IDE

Um [arquivo de código](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) é um arquivo de texto: tecnicamente, escrevê-lo com o [Notepad](https://learn.microsoft.com/en-us/windows/win32/menurc/notepad) ou o [TextEdit](https://support.apple.com/guide/textedit/welcome/mac) já bastaria. Na prática, ninguém faz isso: uma ferramenta dedicada torna a escrita de código muito mais confortável.

## Editor de texto simples vs editor de código

| | Editor de texto simples (Notepad, TextEdit) | Editor de código |
|---|---|---|
| O que ele faz | Exibe e modifica texto puro | Exibe e modifica texto, entendendo que é código |
| Realce de sintaxe | Não: todo o texto tem a mesma cor | Sim: palavras-chave, strings, comentários... cada um com sua cor |
| Ajuda na escrita | Nenhuma | Autocompletar, detecção de erro, navegação no código |

**O realce de sintaxe** consiste em exibir cada tipo de elemento do código em uma cor diferente, para que sua estrutura se veja de imediato, sem nem precisar ler cada palavra. Você vê um exemplo concreto nesta própria página: cada bloco de código do Devpedia é colorido assim.

```python
# Isto e um comentario           -> uma cor
nome = "Joao"                     # "Joao" e uma string -> outra cor
```

> **Cuidado:** usar um processador de texto ([Word](https://www.microsoft.com/microsoft-365/word), [WordPad](https://learn.microsoft.com/en-us/windows/win32/menurc/wordpad)) para escrever código. Além da falta de realce de sintaxe, esses programas substituem silenciosamente certos caracteres por seus equivalentes "tipográficos" (aspas curvas `“ ”` em vez de `" "`, travessões longos...), invisíveis a olho nu, mas que tornam o código sintaticamente inválido.
>
> **Boa prática:** sempre escrever código em um editor de **texto puro** (simples ou de código), nunca em um processador de texto, mesmo "só para resolver rápido".

## A IDE: um editor de código, mais ferramentas integradas

**IDE** significa *Integrated Development Environment* (ambiente de desenvolvimento integrado): além de editar código, ela reúne em um único aplicativo ferramentas que seriam usadas separadamente.

| Ferramenta integrada | Papel |
|---|---|
| Terminal integrado | Um [terminal](/?c=bases-de-l-informatique&p=le-terminal) direto na janela, sem precisar abrir outro ao lado |
| Botão "Executar" | Roda o programa sem digitar o comando manualmente: nos bastidores, ele executa exatamente a mesma coisa que se você tivesse digitado em um terminal |
| Detecção de erro | Sinaliza um erro provável antes mesmo de executar o código (ex.: um parêntese nunca fechado) |
| Depurador (*debugger*) | Permite executar o código passo a passo, para observar o estado dos dados em cada etapa |

> **Nota:** a fronteira entre "simples editor de código" e "IDE completa" não é rígida: um editor como o VS Code começa leve, mas fica próximo de uma IDE depois que extensões são instaladas para uma linguagem específica.

> **Cuidado:** em um projeto com vários arquivos, supor que o botão "Executar" sempre roda o arquivo atualmente exibido na tela: muitas IDEs guardam uma **configuração de execução** separada, que pode apontar para outro arquivo diferente do que está sendo visto, sem avisar claramente.
>
> **Boa prática:** diante de um resultado que não muda apesar de uma modificação, verificar qual arquivo está realmente sendo executado antes de procurar um bug em outro lugar.

| Ferramenta | Categoria | Linguagens visadas |
|---|---|---|
| [VS Code](https://code.visualstudio.com) | Editor de código extensível | Generalista: quase todas, via extensões |
| [PyCharm](https://www.jetbrains.com/pycharm/) | IDE completa | Python |
| [Visual Studio](https://visualstudio.microsoft.com) (não confundir com VS Code) | IDE completa | [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/), [.NET](https://learn.microsoft.com/en-us/dotnet/) |

## Por onde começar

Para começar, um editor generalista e gratuito como o **VS Code** (disponível para Windows, macOS e Linux) cobre amplamente as necessidades dos primeiros capítulos deste site, seja qual for a linguagem abordada depois; não é preciso uma IDE dedicada a uma linguagem específica antes de realmente precisar dela.

> **Cuidado:** instalar de uma vez várias extensões "só por precaução": além de deixar o editor mais lento, extensões que se sobrepõem (ex.: duas extensões de realce para a mesma linguagem) podem entrar em conflito, tornando difícil saber qual é responsável por um comportamento inesperado.
>
> **Boa prática:** instalar uma extensão por vez, apenas quando uma necessidade específica surgir, não por antecipação.

---

## 📋 Recapitulação

| | |
|---|---|
| **O que reter** | Um editor de código adiciona o realce de sintaxe e a ajuda na escrita que um editor de texto simples não tem. Uma IDE vai além: terminal integrado, botão "Executar", detecção de erro, depurador, tudo reunido em um único aplicativo. |
| **Ferramentas úteis** | Um editor generalista como o VS Code para começar; uma IDE dedicada (PyCharm, Visual Studio...) só depois de escolhida uma linguagem específica. |
| **Armadilhas a evitar** | Escrever código em um editor de texto simples (Notepad, TextEdit) sem realce de sintaxe nem detecção de erro; nada impede isso tecnicamente, mas cada erro se torna muito mais difícil de identificar. |
| **Boas práticas** | O botão "Executar" de uma IDE não faz nada de mágico: ele roda o mesmo comando que um terminal executaria; entender esse comando continua útil mesmo que nunca seja digitado manualmente. |
