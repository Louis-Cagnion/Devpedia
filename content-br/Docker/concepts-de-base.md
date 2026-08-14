---
order: 1
---

# Os conceitos básicos

## Contêiner vs máquina virtual

Uma **máquina virtual** (VM) virtualiza hardware: ela embarca seu próprio kernel e inicia como um computador completo, o que a torna pesada (vários GB, inicialização em dezenas de segundos) mas totalmente isolada do hospedeiro. Um **contêiner** é mais leve: é um processo comum do sistema hospedeiro, que **compartilha o kernel** desse hospedeiro mas roda em um ambiente isolado do resto do sistema.

```text
Maquina virtual                  Conteiner
┌────────────────────────┐       ┌────────────────────────┐
│       Aplicacao        │       │       Aplicacao        │
├────────────────────────┤       ├────────────────────────┤
│      Bibliotecas       │       │      Bibliotecas       │
├────────────────────────┤       ├────────────────────────┤
│    Kernel convidado    │       │      Motor Docker      │
├────────────────────────┤       ├────────────────────────┤
│       Hipervisor       │       │  Kernel do hospedeiro  │
├────────────────────────┤       └────────────────────────┘
│  Kernel do hospedeiro  │
└────────────────────────┘
```

O **hipervisor** é a camada de software que cria e gerencia as máquinas virtuais, distribuindo os recursos físicos (CPU, memória) entre elas: é essa camada extra, ausente em um contêiner, que explica a diferença de peso entre as duas abordagens.

> **Consequência direta:** um contêiner Linux não roda nativamente no Windows ou no macOS: o [Docker Desktop](https://docs.docker.com/desktop/) na verdade inicia uma pequena VM Linux ali para hospedar os contêineres. Em um servidor Linux, por outro lado, nenhuma camada de virtualização é necessária.

## Por baixo do capô: namespaces e cgroups

O isolamento de um contêiner se baseia em dois mecanismos do kernel Linux, não em uma tecnologia própria do Docker:

- Os **namespaces** isolam o que um processo *vê*: sua própria árvore de processos (ele acredita ser o PID 1), seu próprio sistema de arquivos, sua própria interface de rede... Um processo em um namespace não vê nem consegue afetar o que acontece em outro namespace.
- Os **cgroups** (*control groups*) limitam o que um processo *pode consumir*: CPU, memória, banda de disco. É isso que impede um contêiner de saturar todos os recursos da máquina hospedeira.

O Docker orquestra esses dois mecanismos, já presentes no kernel, para dar a ilusão de uma máquina isolada a um custo baixo.

## Imagem vs contêiner

Uma **imagem** é um modelo imutável, somente leitura: um sistema de arquivos congelado (uma distribuição mínima, as dependências instaladas, o código da aplicação) mais metadados (comando a executar na inicialização, portas expostas...). Um **contêiner** é uma instância em execução dessa imagem, com uma fina camada gravável adicionada por cima.

```text
Imagem (somente leitura)  -->  docker run  -->  Conteiner (imagem + camada gravavel + processo)
```

Uma mesma imagem pode então iniciar vários contêineres independentes, cada um com sua própria camada gravável: modificar um contêiner nunca modifica a imagem da qual ele veio.

## As imagens são construídas em camadas

Uma imagem é empilhada em **camadas** (*layers*), cada uma correspondendo a uma instrução do [Dockerfile](/?c=docker&p=dockerfile): instalar um pacote, copiar código, etc. Essas camadas são compartilhadas e armazenadas em cache entre imagens: se duas imagens compartilham suas primeiras camadas (ex. a mesma imagem base), o Docker não as armazena nem as baixa mais de uma vez.

> **Nota:** essa é uma deduplicação automática por conteúdo, no mesmo princípio do [armazenamento de objetos do Git](/?c=git&p=architecture-interne): duas camadas idênticas produzem o mesmo identificador e nunca são duplicadas em disco.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um contêiner é um processo isolado (namespaces + cgroups) que compartilha o kernel do hospedeiro, mais leve que uma máquina virtual, que virtualiza hardware completo. Uma imagem é um modelo imutável em camadas; um contêiner é uma instância em execução dessa imagem. |
| **Ferramentas utilizáveis** | Nenhum comando específico aqui: este capítulo estabelece o vocabulário (imagem, contêiner, namespace, cgroup) reutilizado em todos os seguintes. |
| **Armadilhas a evitar** | Confundir imagem e contêiner: modificar um contêiner nunca modifica a imagem da qual ele veio. |
| **Boas práticas** | Entender que o isolamento de um contêiner se baseia no kernel Linux (namespaces/cgroups), não em uma tecnologia própria do Docker, para avaliar melhor seus limites de segurança. |
