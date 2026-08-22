---
order: 5
---

# Árvore de diretórios e caminhos

Um [arquivo](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) não flutua solto no disco: ele fica guardado em uma pasta, ela mesma guardada em outra pasta. Este capítulo explica como essa organização funciona, e como designar precisamente um arquivo dentro dela.

## A pasta: guardar arquivos, e outras pastas

Uma **pasta** (ou **diretório**, *directory*) contém arquivos, e também pode conter outras pastas. Repetindo isso várias camadas de profundidade, obtém-se uma estrutura em árvore: a **árvore de diretórios**.

```text
Documentos/
├── fotos/
│   ├── ferias.jpg
│   └── familia.jpg
└── trabalho/
    └── relatorio.docx
```

> **Analogia:** como pastas de arquivo guardadas em gavetas, elas mesmas guardadas em um armário: encontrar uma folha específica exige conhecer o armário, a gaveta, e então a pasta.

> **Cuidado:** excluir uma pasta exclui **todo** seu conteúdo junto, incluindo as pastas que ela contém, geralmente sem pedir confirmação arquivo por arquivo.
>
> **Boa prática:** antes de excluir uma pasta, verificar seu conteúdo (listar o que ela contém) em vez de supor que está vazia ou sem importância.

## O caminho: o endereço completo de um arquivo

Um **caminho** (*path*) descreve onde encontrar um arquivo ou pasta, listando as pastas a atravessar, separadas por um caractere que depende do sistema:

| Sistema | Separador | Exemplo |
|---|---|---|
| Linux / macOS | `/` | `Documentos/fotos/ferias.jpg` |
| Windows | `\` | `Documentos\fotos\ferias.jpg` |

> **Cuidado:** copiar um caminho do Windows (com `\`) em um terminal Linux/macOS. Nesses sistemas, `\` não é um separador: é um caractere de escape que muda o sentido do caractere seguinte: o caminho não será interpretado como esperado.
>
> **Boa prática:** sempre usar o separador do sistema no qual o comando realmente é executado, nunca o da máquina onde o caminho foi escrito originalmente.

## Caminho absoluto vs caminho relativo

| | Caminho absoluto | Caminho relativo |
|---|---|---|
| Ponto de partida | A **raiz** (sempre a mesma, independentemente de onde você está) | A **pasta atual** (onde o terminal "está" no momento) |
| Como se parece | `/home/joao/Documentos/relatorio.docx` (Linux) ou `C:\Users\joao\Documentos\relatorio.docx` (Windows) | `Documentos/relatorio.docx`, se já estiver em `/home/joao` |
| Vantagem | Funciona de qualquer lugar | Mais curto de escrever, e continua válido se todo o projeto for movido junto |

A **raiz** é a primeiríssima pasta da árvore, aquela de onde todas as outras derivam: `/` no Linux/macOS, uma letra de unidade (`C:\`) no Windows. A **pasta atual** (*current working directory*) é o lugar onde você está "posicionado" nessa árvore em um dado momento: é justamente o que o [prompt do terminal](/?c=bases-de-l-informatique&p=le-terminal) às vezes exibe, sem que ainda se saiba o que isso significava.

> **Cuidado:** usar um caminho relativo supondo estar na pasta atual certa, sem ter verificado. O mesmo comando, com o mesmo caminho relativo, pode agir em um arquivo totalmente diferente dependendo de onde é executado.
>
> **Boa prática:** em caso de dúvida, exibir a pasta atual antes de um comando que modifica ou exclui um arquivo via caminho relativo; um caminho absoluto elimina completamente esse risco, ao custo de ser mais longo de escrever.

## Dois atalhos universais: `.` e `..`

Seja qual for o shell, duas notações sempre designam a mesma coisa, de forma relativa:

| Notação | Designa |
|---|---|
| `.` | A própria pasta atual |
| `..` | A pasta pai, um nível acima |

```text
Documentos/fotos/../trabalho/relatorio.docx
                 └─┬─┘
                   └── sobe um nivel (sai de "fotos"), depois entra em "trabalho"
```

> **Cuidado:** esquecer o espaço entre o comando de deslocamento e `..` (digitar `cd..` em vez de `cd ..`). Sem o espaço, o shell lê uma única palavra (`cd..`) que não reconhece como nenhum comando, em vez do comando `cd` seguido do argumento `..`.
>
> **Boa prática:** diante de uma mensagem "comando não encontrado" inesperada em um comando por outro lado correto, verificar primeiro os espaços antes da pontuação.

## Navegar e listar pelo terminal

Trocar a pasta atual e listar o conteúdo de uma pasta são duas ações básicas, mas o nome exato dos comandos depende do shell usado, já visto no [capítulo sobre o terminal](/?c=bases-de-l-informatique&p=le-terminal):

- No Bash: veja [Permissões e manipulação de arquivos](/?c=shells&s=bash&p=permissions-et-fichiers).
- No PowerShell: veja [Comandos básicos](/?c=shells&s=powershell&p=commandes-de-base).

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Os arquivos são guardados em pastas, organizadas em árvore de diretórios. Um **caminho** descreve sua localização: **absoluto** a partir da raiz (sempre válido), ou **relativo** a partir da **pasta atual** (mais curto). `.` designa a pasta atual, `..` sua pasta pai. |
| **Ferramentas úteis** | Os comandos de navegação e listagem próprios do seu shell (veja os capítulos Bash/PowerShell ligados acima). |
| **Armadilhas a evitar** | Usar um caminho relativo supondo estar na pasta atual certa, sem ter verificado: o mesmo comando pode então agir em um arquivo totalmente diferente dependendo de onde é executado. |
| **Boas práticas** | Em caso de dúvida sobre onde você está, verificar a pasta atual antes de executar um comando que modifica ou exclui um arquivo via caminho relativo. |
