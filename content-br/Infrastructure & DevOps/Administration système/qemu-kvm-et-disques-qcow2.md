---
order: 11
---

# QEMU, KVM e discos qcow2 (31/10/2026)

O capítulo [Virtualização e escolha de SO](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) apresenta os hipervisores (os programas que criam e executam **máquinas virtuais**, ou VM: computadores simulados por um programa, com seu processador, sua memória e seus discos; veja [os conceitos básicos do Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) para compará-los a contêineres) com janelas, que se controlam com o mouse. Este capítulo faz a mesma coisa pela **linha de comando** (controla-se um programa digitando comandos, em vez de clicar em menus), com a ferramenta mais difundida no Linux: o [**QEMU**](https://www.qemu.org/). Ele também explica o que é um disco virtual, como tirar **snapshots** (fotos do estado de uma máquina) e por que um snapshot não é um backup.

O computador real que executa a VM se chama o **hospedeiro**; o sistema que roda **dentro** da VM se chama o **convidado** (*guest*). A palavra « hospedeiro » tem um segundo sentido, explicado na seção [Os dois sentidos da palavra « hospedeiro »](#os-dois-sentidos-da-palavra-hospedeiro).

Todos os comandos são digitados em [um terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). As saídas copiadas abaixo foram obtidas em uma máquina Linux real, com o QEMU instalado a partir dos pacotes (os programas empacotados) da distribuição (a variante do Linux usada, veja [Virtualização e escolha de SO](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos)).

> **Analogia:** um ator que interpreta o papel de um computador. **O ator** (QEMU) interpreta a máquina virtual: sem ajuda, precisa imitar tudo com acessórios, o que é fiel mas lento. **O hardware de verdade emprestado pelo KVM** permite que ele faça os gestos principais de verdade, portanto muito mais rápido. O **álbum de fotos** (os snapshots) permite voltar ao estado da máquina antes do último ajuste malsucedido.

## QEMU e KVM: quem faz o quê

Os dois nomes designam dois componentes diferentes, muitas vezes citados juntos.

| | QEMU | KVM |
|---|---|---|
| Nome completo | *Quick EMUlator* | [*Kernel-based Virtual Machine*](https://www.linux-kvm.org/) |
| Natureza | Um programa comum, iniciado pelo usuário | Uma função do **kernel** Linux (o programa central que gerencia o hardware, veja [Os componentes de um computador e sua inicialização](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) |
| Papel | **Simula a máquina**: discos, tela, teclado, rede, placa-mãe | **Acelera** a simulação, deixando o processador real executar o código do convidado |
| Sem o outro | Funciona, mas devagar: imita o processador por software | Não serve para nada sozinho: é o QEMU que o utiliza |
| Arquivo ou programa | `qemu-system-x86_64` | o arquivo especial `/dev/kvm` |

O programa `qemu-system-x86_64` simula um computador da família x86 em 64 bits (os processadores da Intel e da AMD; veja [O processador](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#o-processador)). Existe um programa por família de processadores (`qemu-system-aarch64` para os processadores ARM, os dos celulares e de muitos Macs recentes, por exemplo).

O arquivo `/dev/kvm` é um « arquivo especial »: ele não contém nenhum dado, é uma porta de entrada para o KVM que os programas abrem para falar com ele (a pasta `/dev` reúne essas portas para o hardware e o kernel).

Sem KVM, o QEMU funciona no modo **tcg** (*Tiny Code Generator*, o tradutor por software do QEMU). É a **emulação**: imitar um hardware executando-o por software, instrução por instrução (uma **instrução** é uma ordem elementar executada pelo processador, como somar dois números). Fiel, mas lento.

```text
Sem KVM (modo tcg, emulação por software)

 convidado ──► QEMU traduz cada instrução ──► processador real
               (lento: um trabalho de tradução a cada passo)

Com KVM

 convidado ──► processador real executa diretamente o código do convidado
               o QEMU só cuida do resto: discos, tela, rede
               (rápido: quase a velocidade de uma máquina real)
```

### Saber se o KVM está disponível

```bash
# grep procura um padrão em um arquivo; -c mostra o número de linhas encontradas, em
# vez das próprias linhas; -E permite o « ou » (|) no padrão; /proc/cpuinfo é um arquivo
# virtual (o kernel expõe ali a descrição do processador, nada é guardado no disco);
# vmx (Intel) ou svm (AMD) anuncia a virtualização, uma linha por núcleo
grep -c -E 'vmx|svm' /proc/cpuinfo
ls -l /dev/kvm                            # -l: listagem detalhada; o KVM está presente?
# [ -w arquivo ]: verdadeiro se eu tenho o direito de escrever nele; && : o comando
# seguinte só roda se o anterior teve sucesso; || : só se ele falhou
[ -w /dev/kvm ] && echo sim || echo não
```

Esses comandos são detalhados em [os comandos de base](/?c=langages&s=bash&p=commandes-de-base) e [as condições](/?c=langages&s=bash&p=conditions).

Saídas obtidas:

```text
16
crw-rw----+ 1 root kvm 10, 232 oct.  31 20:27 /dev/kvm
sim
```

Leitura da linha `crw-rw----+ 1 root kvm 10, 232 ...`: o `c` indica um arquivo especial; `rw-rw----` dá as permissões (leitura e escrita para o proprietário, leitura e escrita para o grupo, nada para os outros; veja [as permissões](/?c=langages&s=bash&p=permissions-et-fichiers)); `root kvm` são o proprietário e o grupo; `10, 232` são números internos do kernel, sem importância aqui.

| Constatação | Significado | O que fazer |
|---|---|---|
| O primeiro número é `0` (nenhuma linha) | O processador não anuncia virtualização, ou ela está desativada na configuração da placa-mãe (o firmware, veja [BIOS e UEFI](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | Sem KVM: usar `-accel tcg` |
| `/dev/kvm` não existe | O módulo KVM (um pedaço do kernel carregado sob demanda) não está carregado, ou a máquina é ela mesma uma VM que não expõe a virtualização | Idem |
| `/dev/kvm` existe, mas `não` | O arquivo pertence ao grupo `kvm` (veja [as permissões](/?c=langages&s=bash&p=permissions-et-fichiers)) e o usuário não faz parte dele | Pedir ao administrador que adicione o usuário ao grupo `kvm`, depois sair da sessão e entrar de novo (os grupos só são relidos na conexão) |
| `/dev/kvm` existe e `sim` | O KVM pode ser usado | `-accel kvm` |

O `+` no fim de `crw-rw----+` sinaliza uma regra de acesso adicional (uma **ACL**, *Access Control List*: uma lista de direitos concedidos a usuários nomeados; veja [a página de manual acl](https://man7.org/linux/man-pages/man5/acl.5.html)): na máquina de teste, um usuário está autorizado nominalmente, sem estar no grupo `kvm`. O teste `[ -w /dev/kvm ]` é, portanto, mais confiável do que a leitura das letras.

> **Armadilha:** escrever `-accel kvm` em uma máquina sem KVM utilizável faz o lançamento falhar (comportamento esperado, não reproduzido aqui por falta de uma máquina sem KVM). Para um script que deve funcionar em qualquer lugar, testar `/dev/kvm` primeiro e escolher `kvm` ou `tcg` conforme o resultado.

## Iniciar uma máquina virtual

Duas ferramentas precisam ser instaladas. No [Debian](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) e no [Ubuntu](https://www.ubuntu.com/) (duas distribuições Linux; veja [o endurecimento do sudo](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) para o `sudo`), `qemu-system-x86` fornece o programa `qemu-system-x86_64`, e `qemu-utils` fornece `qemu-img` (a ferramenta que cria e manipula os discos, vista mais abaixo):

```bash
# sudo: executa o comando com privilégios de administrador
# apt install: instala pacotes (programas empacotados) no Debian e no Ubuntu
# (veja https://wiki.debian.org/Apt)
sudo apt install qemu-system-x86 qemu-utils
```

Antes de iniciar a máquina, é preciso um disco vazio para o convidado e a ISO de instalação (uma **ISO** é um arquivo que contém a imagem exata de um CD ou DVD de instalação). A ISO do Debian é baixada na [página oficial](https://www.debian.org/distrib/); aqui ela é renomeada para `debian.iso`. O disco é criado assim (o formato qcow2 é explicado em [O disco virtual](#o-disco-virtual-o-formato-qcow2)):

```bash
# cria um disco virtual: -f = formato, nome do arquivo, tamanho (20G = 20 GiB)
qemu-img create -f qcow2 debian-resgate.qcow2 20G
```

Um comando de lançamento completo, para instalar o sistema a partir da ISO:

```bash
# Uma linha por opção; o « \ » no fim da linha continua o comando na seguinte
qemu-system-x86_64 \
  -accel kvm \
  -m 2G \
  -smp 2 \
  -drive file=debian-resgate.qcow2,format=qcow2 \
  -cdrom debian.iso \
  -boot order=cd
```

| Opção | Papel | Observação |
|---|---|---|
| `-accel kvm` | Usar o KVM para a velocidade | `-accel tcg` para a emulação só por software; `-enable-kvm` é um atalho equivalente a `-accel kvm` |
| `-m 2G` | **Memória** (a RAM, veja [a RAM](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) dada ao convidado | `128M` para 128 MiB, `2G` para 2 GiB (veja [contar a informação](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#contar-a-informacao-bit-byte-gb-e-gib)); essa memória é retirada da do hospedeiro |
| `-smp 2` | Número de **núcleos** de processador (unidades de cálculo independentes) oferecidos ao convidado | Não ultrapassar o número de núcleos do hospedeiro (o QEMU aceita, mas a VM desacelera) |
| `-drive file=...,format=...` | Conectar um disco rígido virtual, guardado em um arquivo do hospedeiro | Informar sempre `format=` (veja a seção sobre os formatos) |
| `-cdrom debian.iso` | Conectar um **leitor de CD** virtual que contém a ISO | O convidado acredita ter um CD de verdade inserido |
| `-boot order=cd` | **Ordem de tentativa na inicialização**: uma letra por tipo de mídia | `c` = primeiro disco rígido, `d` = leitor de CD: aqui, primeiro o disco, depois o CD |

Uma janela se abre então: é a tela da máquina virtual. Sem outra opção, é nela que a instalação acontece. Duas precauções: assim que se clica na janela, ela « captura » o mouse (o ponteiro não sai mais); para liberá-lo, use `Ctrl+Alt+G` (ou `Ctrl+Alt`, conforme a exibição). E fechar a janela desliga a VM bruscamente, como um desligamento brusco da tomada: veja [Desligar corretamente antes do snapshot](#desligar-corretamente-antes-do-snapshot).

### A ordem de inicialização: por que « disco depois CD »

Na inicialização, o firmware da máquina (o BIOS, veja [Os componentes de um computador e sua inicialização](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) tenta cada mídia na ordem e pega a primeira que contém um programa de inicialização.

| Etapa | Disco | CD | O que acontece |
|---|---|---|---|
| Primeira instalação | vazio | ISO de instalação | O disco está vazio, o firmware passa para o CD: o instalador inicia |
| O sistema está instalado | contém o sistema | ISO ainda conectada | O disco inicia primeiro: o sistema instalado inicia |
| Se a ordem fosse `dc` | contém o sistema | ISO ainda conectada | O CD seria o primeiro: cairíamos no instalador a cada inicialização |

É isso que torna a ordem `cd` prática: basta manter o mesmo comando antes e depois da instalação, sem nunca cair no instalador por engano. E é possível remover `-cdrom` e `-boot` depois que a instalação termina.

### Verificar a ordem sem baixar uma distribuição

Nenhuma distribuição foi baixada para este capítulo. Para ver a ordem em ação, foram fabricados dois suportes minúsculos (eles não são fornecidos: esta seção serve de demonstração, não de exercício a refazer): um disco cujo primeiro setor (a primeira zona de 512 bytes, que o firmware lê para iniciar; veja [o firmware](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#o-firmware-bios-e-uefi)) é um programa que escreve « INICIANDO PELO DISCO » na porta serial, e uma ISO que contém o mesmo tipo de programa, com a mensagem « INICIANDO PELO CD ». O comando `timeout` (veja [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) interrompe um programa após um atraso. A **porta serial** é uma saída de texto simples da máquina virtual; a opção `-nographic` a liga ao terminal, em vez de abrir uma janela.

```bash
# timeout 20: interrompe o comando após 20 segundos
# (o programa de teste nunca para sozinho)
# -nographic: sem janela, o console da VM aparece neste terminal
# -nic none: nenhuma placa de rede, para uma saída mais curta
timeout 20 qemu-system-x86_64 -accel kvm -m 128M -smp 2 -nographic -nic none \
  -drive file=debian-resgate.qcow2,format=qcow2 -cdrom cd.iso -boot order=cd
```

Com um disco `debian-resgate.qcow2` vazio (o caso de uma primeira instalação), a saída começa pela versão do [SeaBIOS](https://www.seabios.org/), o firmware que o QEMU fornece à máquina:

```text
SeaBIOS (version 1.16.3-debian-1.16.3-2)
Booting from Hard Disk...
Boot failed: not a bootable disk
Booting from DVD/CD..INICIANDO PELO CD
```

O disco é tentado primeiro (`Hard Disk`), recusado por estar vazio (`not a bootable disk`), depois o CD inicia. Mesmo comando com um disco que contém um programa de inicialização:

| Comando | Linha que aparece |
|---|---|
| disco inicializável, `-boot order=cd` | `Booting from Hard Disk..INICIANDO PELO DISCO` |
| disco inicializável, `-boot order=dc` | `Booting from DVD/CD..INICIANDO PELO CD` |
| disco vazio e nenhuma ISO | `Booting from Hard Disk...` depois `Boot failed: not a bootable disk`, as outras mídias também falham, e `No bootable device.` |

Esta última linha é a que se deve reconhecer: ela não significa que o QEMU está quebrado, mas que nenhuma mídia tem um programa de inicialização (esquecimento de `-cdrom`, ISO com nome errado, ordem `-boot` invertida).

> **Armadilha:** em uma VM iniciada com `-nographic`, o teclado do terminal é transmitido ao convidado, e `Ctrl+C` pode não parar o QEMU. A sequência de saída documentada é `Ctrl+A` depois `X`. Daí o interesse do `timeout` nos testes.

## Os dois sentidos da palavra « hospedeiro »

A palavra aparece com dois sentidos, e confundi-los faz perder tempo. O livro [*Linux From Scratch*](https://www.linuxfromscratch.org/lfs/) (um guia que ensina a fabricar um Linux completo a partir de seus códigos-fonte, ou seja, do código escrito pelos desenvolvedores, sem distribuição pronta; veja [Criar um sistema operacional](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation)) a usa em um sentido; a virtualização, em outro.

| | Hospedeiro de **virtualização** | Hospedeiro de **construção** |
|---|---|---|
| Pergunta a que responde | Em qual máquina roda a VM? | Com qual Linux se fabrica o novo Linux? |
| É | O computador real (ou o sistema real) que inicia o QEMU | Um Linux **já instalado**, cujo compilador (o programa que traduz código-fonte em programa executável) e cujas ferramentas são emprestados para fabricar outro |
| O contrário | O **convidado** | O **sistema alvo** (aquele que se fabrica) |
| Pode estar em uma VM? | Não: é a camada de baixo | Sim: é frequentemente um Linux instalado **dentro** da VM |

Os dois podem se sobrepor na mesma montagem, daí a confusão. No esquema, um **processo** é um programa em execução (veja [a gestão de processos](/?c=langages&s=bash&p=gestion-des-processus)): aqui, o QEMU em funcionamento. Exemplo com nomes inventados: instala-se um Debian de resgate na VM, em um arquivo `debian-resgate.qcow2`. Esse Debian é, para o livro, o « hospedeiro » (de construção): ele serve para fabricar o novo sistema em um segundo disco, `sistema-alvo.qcow2`. Mas, para o QEMU, esse mesmo Debian é o **convidado**.

```text
┌──────────────────────────────────────────────────────────┐
│ COMPUTADOR REAL = hospedeiro de virtualização            │
│  (ele guarda os três arquivos no seu disco)              │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ processo qemu-system-x86_64 (+ KVM)                │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │ MÁQUINA VIRTUAL = convidado                    │ │   │
│ │ │  disco 1 ◄── debian-resgate.qcow2              │ │   │
│ │ │     contém um Linux instalado:                 │ │   │
│ │ │     é o hospedeiro de construção               │ │   │
│ │ │  disco 2 ◄── sistema-alvo.qcow2                │ │   │
│ │ │     recebe o novo sistema em fabricação        │ │   │
│ │ │  leitor de CD ◄── debian.iso (se preciso)      │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

> **Armadilha:** um arquivo chamado `hospedeiro.qcow2` não diz de qual hospedeiro se trata, e a confusão é real (o nome leva a ler « o hospedeiro de construção » como « o hospedeiro de virtualização »). Nomear os discos pelo **conteúdo** e pelo papel: `debian-resgate.qcow2`, `sistema-alvo.qcow2`.
>
> **Boa prática:** ao ler « o hospedeiro » em uma documentação, perguntar-se primeiro « de que ele é o hospedeiro? »: da máquina virtual, ou da construção de um sistema.

Para a fabricação de um sistema a partir do zero, veja [Criar um sistema operacional, passo a passo](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation); para dividir o segundo disco, veja [Particionamento e LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm).

## O disco virtual: o formato qcow2

Uma VM precisa de um disco rígido. Em vez de um disco de verdade, o QEMU usa um **arquivo** do hospedeiro, que apresenta ao convidado como se fosse um disco: o convidado grava nele como em um disco comum, e cada escrita fica registrada no arquivo. Dois formatos são comuns:

| | `raw` | `qcow2` |
|---|---|---|
| Princípio | Uma cópia byte a byte do disco | Um formato do QEMU (*QEMU Copy On Write*, versão 2) que guarda apenas o que foi escrito |
| Tamanho do arquivo | `ls -l` informa sempre o tamanho completo do disco virtual; o espaço realmente ocupado (medido por `du`) pode ser menor se o sistema de arquivos do hospedeiro não armazena as zonas vazias (arquivo « esparso ») | Bem pequeno no início, **cresce** com o uso |
| Snapshots | Não, no arquivo | Sim, no arquivo |
| Caso de uso | Desempenho bruto, troca com outras ferramentas | A escolha comum para as VMs de trabalho |

Os comandos de criação e de leitura vêm de `qemu-img`.

```bash
# cria um disco virtual: -f = formato, depois o nome do arquivo, depois o tamanho
qemu-img create -f qcow2 disco.qcow2 64M
qemu-img info disco.qcow2                  # mostra as características do arquivo
# du: espaço real ocupado no hospedeiro; -h: tamanhos legíveis (K, M, G)
du -h disco.qcow2
```

Saídas obtidas (a linha `Formatting` está encurtada, e só as linhas úteis de `info` foram mantidas):

```text
Formatting 'disco.qcow2', fmt=qcow2 cluster_size=65536 ... size=67108864 ...
image: disco.qcow2
file format: qcow2
virtual size: 64 MiB (67108864 bytes)
disk size: 196 KiB
cluster_size: 65536
196K	disco.qcow2
```

| Linha | Significado |
|---|---|
| `virtual size: 64 MiB` | O tamanho **visto pelo convidado**: ele acredita ter um disco de 64 MiB (MiB = mebibyte, 1 048 576 bytes, veja [contar a informação](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#contar-a-informacao-bit-byte-gb-e-gib)) |
| `disk size: 196 KiB` | O que o arquivo **realmente** ocupa no hospedeiro, pois nada foi escrito nele ainda |
| `cluster_size: 65536` | O disco é dividido em blocos de 64 KiB; somente os blocos escritos existem no arquivo |

O disco de 64 MiB ocupa 196 KiB: é a propriedade que torna os discos `qcow2` econômicos. Ela tem uma contrapartida: se o disco do hospedeiro enche, um disco virtual que continua a crescer pode falhar ao escrever, enquanto o convidado acredita ainda ter espaço. O tamanho pedido é, portanto, um **teto**, não uma reserva.

> **Armadilha:** esquecer `-f qcow2` na criação, ou `format=qcow2` no lançamento. Sem `-f qcow2`, `qemu-img create` fabrica um disco **raw** (portanto sem snapshots). No lançamento, sem `format=`, o QEMU adivinha o formato; para um arquivo raw ele avisa (`Image format was not specified ... probing guessed raw`) e proíbe escritas no primeiro bloco (o início do disco, onde fica o setor de inicialização). Informar o formato explicitamente em todo lugar.

## Os snapshots

Um **snapshot** (« instantâneo ») é uma foto do estado de um disco em um dado momento, à qual é possível voltar. Antes de uma manipulação arriscada (particionar, compilar um sistema, apagar arquivos), tira-se um snapshot: se o resultado for ruim, volta-se à foto em alguns segundos, em vez de recomeçar tudo.

### Como funciona, em resumo

Um arquivo `qcow2` é gravado por blocos. Quando se tira um snapshot, o QEMU **congela** os blocos existentes. Uma escrita posterior não modifica um bloco congelado: ela grava uma **nova cópia** em outro lugar do arquivo (diz-se « cópia na escrita », *copy on write*, daí o nome do formato). Voltar ao snapshot é apontar de novo para os blocos congelados.

```text
Antes do snapshot      Depois do snapshot e uma escrita

 bloco A  bloco B         bloco A  bloco B  bloco B'
   │       │              │       │       ▲
   │       │              │       │       └─ novo valor de B (escrito depois)
   └───────┘              └───────┘
 estado atual             o snapshot guarda A e B;
                          o estado atual usa A e B'
```

Consequência medida: o arquivo **cresce** com os snapshots e as escritas, já que os blocos antigos permanecem.

### Os quatro comandos

| Comando | Papel |
|---|---|
| `qemu-img snapshot -c NOME disco.qcow2` | **c**riar um snapshot do estado atual, com o nome `NOME` |
| `qemu-img snapshot -l disco.qcow2` | **l**istar os snapshots do arquivo |
| `qemu-img snapshot -a NOME disco.qcow2` | **a**plicar o snapshot: o disco volta a esse estado, e as modificações feitas desde então são perdidas |
| `qemu-img snapshot -d NOME disco.qcow2` | **d**estruir o snapshot (o disco mantém seu estado atual) |

O ciclo completo, sobre o disco `disco.qcow2` criado acima:

```bash
qemu-img snapshot -l disco.qcow2                 # lista: disco novo, nenhum snapshot
qemu-img snapshot -c antes-teste disco.qcow2     # cria o snapshot « antes-teste »
qemu-img snapshot -l disco.qcow2                 # lista: o snapshot aparece
qemu-img snapshot -a antes-teste disco.qcow2     # volta ao estado « antes-teste »
qemu-img snapshot -d antes-teste disco.qcow2     # destrói o snapshot
qemu-img snapshot -l disco.qcow2                 # lista: vazia de novo
```

Saída obtida para a segunda lista, a única que mostra algo (os outros comandos não escrevem nada quando dão certo):

```text
Snapshot list:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
1         antes-teste           0 B 2026-10-31 21:06:21 00:00:00.000          0
```

| Coluna | Significado |
|---|---|
| `ID` | Número atribuído pelo QEMU |
| `TAG` | O nome dado com `-c` |
| `VM SIZE` | Tamanho do estado da máquina gravado com o snapshot: `0 B` aqui, porque o snapshot é o do **disco somente** (veja a seção seguinte) |
| `DATE` | Momento da tomada |
| `VM CLOCK`, `ICOUNT` | Relógio da máquina e contador de instruções, úteis somente para um snapshot de máquina ligada |

### Constatar que a volta atrás funciona

Para ver um snapshot restaurar dados de verdade, a ferramenta `qemu-io` grava e lê bytes diretamente em um arquivo de disco, sem máquina virtual. Sua opção `-c` informa o comando a executar. A sintaxe é `write -P valor deslocamento tamanho`: `-P` fixa o valor repetido, o deslocamento é a posição inicial (em bytes a partir do início do disco, `0` aqui) e o tamanho é a quantidade gravada. Assim, `write -P 0xAA 0 4k` grava 4 KiB, todos iguais ao valor `0xAA` (o prefixo `0x` indica um número escrito em hexadecimal, na base 16, com os algarismos de 0 a 9 e depois de A a F), no início do disco; `read -P 0xAA 0 4k` relê a zona e falha se ela não contiver exatamente esse valor.

```bash
qemu-img create -f qcow2 d2.qcow2 64M           # cria o disco de teste (64 MiB)
qemu-io -c 'write -P 0xAA 0 4k' d2.qcow2        # grava o valor AA nos 4 primeiros KiB
qemu-img snapshot -c antes d2.qcow2             # foto do estado: a zona contém AA
qemu-io -c 'write -P 0xBB 0 4k' d2.qcow2        # sobrescreve a zona com o valor BB
qemu-io -c 'read -P 0xBB 0 4k' d2.qcow2         # relê: BB está lá
qemu-img snapshot -a antes d2.qcow2             # volta à foto
qemu-io -c 'read -P 0xAA 0 4k' d2.qcow2         # relê: AA voltou
ls -l d2.qcow2                                  # tamanho do arquivo no fim
```

Cada comando `qemu-io` responde `read 4096/4096 bytes` ou `wrote 4096/4096 bytes` (bytes lidos ou escritos), seguido de uma linha indicando a velocidade da operação; o essencial é que **a última leitura dê certo com AA**: a escrita BB, feita após o snapshot, foi desfeita. O tamanho do arquivo passou de 393 216 bytes (depois de gravar AA) para 655 360 bytes (BB gravado a mais, com o snapshot): os blocos antigos são conservados.

### Os erros a conhecer

| Comando | Mensagem obtida | Causa |
|---|---|---|
| `qemu-img snapshot -a ausente d2.qcow2` | `Could not apply snapshot 'ausente': Failed to load snapshot: No such file or directory` | Nenhum snapshot com esse nome |
| `qemu-img snapshot -c x inexistente.qcow2` | `Could not open 'inexistente.qcow2': ... No such file or directory` | O arquivo de disco não existe |
| `qemu-img snapshot -c x` enquanto uma VM usa o disco | `Failed to get "write" lock` depois `Is another process using the image [d5.qcow2]?` | O QEMU trava o disco enquanto a VM roda |

O último caso é uma proteção, não uma falha: gravar no arquivo de um disco enquanto o convidado também grava arriscaria corromper o disco. Quando a VM está desligada, o mesmo comando dá certo.

Três comportamentos observados na versão testada:

| Constatação | Consequência |
|---|---|
| `-d` designa o snapshot pelo seu **nome**: `qemu-img snapshot -d 1` responde `snapshot not found` embora o snapshot de ID 1 exista; `-d a` funciona | Informar o nome a `-d` |
| `-a` aceita o ID tanto quanto o nome | Mas um nome basta, e continua legível |
| Dois snapshots podem ter o **mesmo nome** (dois `dois` receberam os IDs 1 e 2) | Dar um nome único a cada snapshot, por exemplo com a data: senão um nome designa dois snapshots, e `-a` ou `-d` fica ambíguo |

## Disco somente ou disco e memória

Há dois tipos de snapshots, conforme a VM esteja desligada ou ligada.

| | Snapshot **disco somente** | Snapshot **disco e memória** |
|---|---|---|
| VM | **Desligada** | **Ligada** |
| Ferramenta | `qemu-img snapshot` | O **console do QEMU** (o monitor), comando `savevm` |
| O que é fotografado | O conteúdo do disco | O disco, **mais** a RAM, o estado do processador e dos periféricos (disco, teclado, placa de rede simulados) |
| Na volta atrás | A VM reinicia do início, como após um desligamento limpo | A VM retoma **exatamente** de onde estava: programas abertos, janelas, tudo |
| Tamanho (`VM SIZE`) | `0 B` | Ligado à memória da máquina |
| Exemplo de uso | Antes de instalar um sistema ou reparticionar | No meio de um trabalho, antes de um teste do qual se quer poder voltar sem reiniciar |

### O console do QEMU

O QEMU controla a máquina ligada por um **console**, chamado **monitor**: um prompt `(qemu)` onde se digitam comandos que dizem respeito à própria máquina (e não ao sistema convidado). Há duas formas de acessá-lo.

| Forma | Como |
|---|---|
| Com `-nographic` | No console da VM, `Ctrl+A` depois `C` alterna entre o console do convidado e o monitor (`Ctrl+A` depois `X` sai) |
| Com `-monitor stdio` | O monitor ocupa o terminal que iniciou o QEMU, e o console do convidado vai para outro lugar (por exemplo, `-serial null` para ignorá-lo) |

No monitor, os comandos sobre snapshots são:

| Comando | Papel |
|---|---|
| `savevm NOME` | Tirar um snapshot de disco e memória da máquina ligada |
| `loadvm NOME` | Voltar a esse snapshot (a máquina retoma de onde estava) |
| `delvm NOME` | Destruir esse snapshot |
| `info snapshots` | Listar os snapshots |

Um teste completo (os comandos do console são enviados por um [pipe](/?c=langages&s=bash&p=redirections-et-pipes), para que sejam executados sem teclado; o disco é um `qcow2` vazio, então o programa da máquina não faz nada, mas os snapshots são reais):

```bash
qemu-img create -f qcow2 d6.qcow2 64M   # cria o disco de teste (64 MiB)
# As chaves agrupam comandos; echo escreve um texto, que o pipe « | » envia
# ao QEMU, que o lê como se fosse digitado no monitor.
{
  sleep 3                       # deixa o QEMU iniciar (sleep = esperar n segundos)
  echo 'savevm salvo1'          # snapshot de disco e memória
  sleep 2                       # espera o fim da gravação
  echo 'loadvm salvo1'          # volta ao snapshot
  sleep 2                       # espera o fim da leitura
  echo 'info snapshots'         # lista os snapshots
  sleep 1                       # deixa o tempo de exibir
  echo 'delvm salvo1'           # destrói o snapshot
  sleep 1                       # espera o fim da destruição
  echo 'info snapshots'         # lista de novo
  sleep 1                       # deixa o tempo de exibir
  echo 'quit'                   # desliga a máquina
} | timeout 20 qemu-system-x86_64 -accel kvm -m 128M -nographic -nic none \
      -monitor stdio -serial null -drive file=d6.qcow2,format=qcow2
```

Saída obtida, sem os caracteres de eco do terminal:

```text
QEMU 8.2.2 monitor - type 'help' for more information
(qemu) savevm salvo1
(qemu) loadvm salvo1
(qemu) info snapshots
List of snapshots present on all disks:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
--        salvo1           1.02 MiB 2026-10-31 21:10:15 00:00:02.966
(qemu) delvm salvo1
(qemu) info snapshots
There is no snapshot available.
```

`savevm` e `loadvm` não mostram nada quando dão certo. Um snapshot de máquina deixado no lugar aparece também em `qemu-img snapshot -l`, depois que a VM é desligada, com uma coluna `VM SIZE` não nula (`2.25 MiB` em outro teste, `1.02 MiB` aqui: a máquina de teste quase não executa nada, então há muito pouco estado a guardar). Para uma máquina real com um sistema carregado, esse tamanho pode se aproximar da memória ocupada (não medido aqui).

Na inicialização, a opção `-loadvm NOME` retoma diretamente um snapshot de máquina: após `savevm s2`, o comando `qemu-system-x86_64 ... -loadvm s2` inicia a máquina no estado fotografado (o monitor responde `VM status: running`).

> **Armadilha:** `savevm` exige que **todos** os discos graváveis estejam em `qcow2`. Em um disco `raw`, o QEMU recusa: `Error: Device 'ide0-hd0' is writable but does not support snapshots`. Um disco `raw` esquecido na montagem basta para bloquear.

## Um snapshot não é um backup

Um snapshot interno **vive dentro do arquivo** `qcow2`. Não é uma cópia colocada em outro lugar: é um pedaço do mesmo arquivo.

| Evento | O snapshot sobrevive? |
|---|---|
| Modifica-se o disco depois do snapshot | Sim: é para isso que ele serve |
| Copia-se o arquivo `qcow2` | Sim: a cópia leva seus snapshots (verificado: `snapshot -l` na cópia os lista) |
| Apaga-se o arquivo `qcow2` | **Não**: o snapshot desaparece com ele |
| O arquivo é corrompido (queda de energia do hospedeiro, disco defeituoso) | **Não**: o snapshot e o estado atual estão no mesmo arquivo danificado |
| O disco do hospedeiro quebra | **Não**: tudo está nesse único arquivo |

Um snapshot protege contra **um erro no convidado** (um comando malsucedido, uma instalação ruim). Um backup protege contra **a perda do arquivo**. Os dois se complementam.

```bash
# A VM deve estar desligada: copiar um disco em gravação o tornaria incoerente
# cp copia o arquivo inteiro, snapshots incluídos
cp debian-resgate.qcow2 debian-resgate.backup.qcow2
```

Colocar essa cópia em um **outro** disco físico ou em outro computador: senão o backup compartilha o destino do arquivo original.

## Desligar corretamente antes do snapshot

Um snapshot de disco somente fotografa o que está **escrito no arquivo** no instante da tomada. Ora, um sistema operacional mantém parte de suas gravações **na memória** antes de enviá-las ao disco (é mais rápido). Se a máquina for desligada sem aviso, essas gravações se perdem, e o disco pode ficar em um estado intermediário: arquivos truncados, sistema de arquivos (a maneira como o disco organiza os arquivos, veja [Particionamento e LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm)) a reparar na próxima inicialização.

Fechar a janela do QEMU, ou digitar `quit` no monitor, **interrompe o processo do QEMU imediatamente**: para o convidado, é como uma queda de energia. O mesmo efeito vem de um `kill` sobre o processo do QEMU. Um [processo](/?c=langages&s=bash&p=gestion-des-processus) é um programa em execução, e `kill` lhe envia um **sinal** (uma mensagem enviada a um programa; por padrão, um pedido de encerramento).

| Método de desligamento | Efeito no convidado | Para um snapshot de disco somente |
|---|---|---|
| `sudo poweroff` ou `sudo shutdown -h now` **no convidado** | O sistema termina suas gravações, desconecta seus discos, depois desliga | Bom: o disco fica coerente |
| Fechar a janela do QEMU | Equivale a tirar o cabo da tomada | A evitar |
| `quit` no monitor | Idem | A evitar |
| `timeout` que expira sobre o QEMU | Idem (o QEMU é interrompido por um sinal) | A evitar, exceto para um teste |
| `system_powerdown` no monitor | Envia ao convidado um pedido de desligamento, como um toque no botão de energia; o convidado desliga de forma limpa se reagir a esse botão (não testado aqui, nenhum sistema instalado) | Bom se o convidado reagir |

A sequência segura:

| Etapa | Ação | Por quê |
|---|---|---|
| 1 | No convidado, digitar `sudo poweroff` | Gravações concluídas, sistema de arquivos fechado corretamente |
| 2 | Esperar que o processo do QEMU **termine por si mesmo** (a janela se fecha) | O disco é liberado: a trava desaparece |
| 3 | `qemu-img snapshot -c antes-etapa disco.qcow2` | Foto de um disco coerente |
| 4 | Iniciar a VM de novo | Continuação do trabalho |

Para um snapshot de máquina ligada com `savevm`, a questão não se coloca nos mesmos termos: o estado da RAM é salvo junto com o disco, e `loadvm` devolve a máquina tal como estava, incluindo os caches (cópias temporárias guardadas na memória).

## Perguntas frequentes

| Pergunta | Resposta |
|---|---|
| Pode-se tirar um snapshot de vários discos ao mesmo tempo? | Com `savevm`, sim: todos os discos graváveis são fotografados juntos (todos devem estar em `qcow2`). Com `qemu-img snapshot`, um arquivo por vez |
| E no Windows ou no macOS? | O QEMU existe também nesses sistemas, mas o KVM é próprio do Linux: é preciso escolher outra aceleração (`-accel tcg` funciona em todos). As outras acelerações (não testadas aqui) são documentadas no site do QEMU |
| Quantos snapshots no máximo? | Nenhum teto foi medido aqui; o verdadeiro limite é o espaço do disco, porque cada snapshot guarda os seus blocos |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Confundir os dois sentidos de « hospedeiro » | Procura-se uma configuração no lugar errado (o QEMU em vez do Linux de construção, ou o inverso) | Perguntar-se de que a máquina é hospedeiro |
| Disco chamado `hospedeiro.qcow2` | O nome não diz de qual hospedeiro se trata | Nomear por conteúdo e papel |
| `-accel kvm` sem KVM disponível | A inicialização falha (não reproduzido aqui) | Testar `/dev/kvm`, ou usar `-accel tcg` |
| Esquecer `-f qcow2` ou `format=qcow2` | `qemu-img create` fabrica um raw; ao lançar, o QEMU adivinha o formato e avisa | Informar sempre o formato |
| `-cdrom` esquecido ou ISO com nome errado | `No bootable device.` com um disco vazio | Verificar o nome e o caminho da ISO |
| Manter `-cdrom` depois da instalação com `-boot order=dc` | Cai-se de novo no instalador | Ordem `cd`, ou remover `-cdrom` |
| Fechar a janela da VM | Corte de energia virtual, disco incoerente | Desligar a partir do convidado |
| Tirar um snapshot de disco enquanto a VM roda | Recusado pela trava (`Failed to get "write" lock`) | Desligar, ou usar `savevm` |
| Copiar um `qcow2` enquanto a VM roda | Cópia incoerente | Desligar antes |
| Tirar um snapshot como backup | Ele desaparece com o arquivo | Copiar o arquivo para outro suporte |
| Disco `raw` misturado aos discos `qcow2` | `savevm` recusado | Converter ou remover o disco `raw` |
| Dois snapshots com o mesmo nome | O nome não designa mais um snapshot preciso | Nomes únicos, com a data |
| Acumular muitos snapshots | O arquivo cresce e o hospedeiro pode ficar sem espaço | Destruir os snapshots que não servem mais (`-d`) |
| Acreditar que o tamanho do disco é reservado | O arquivo cresce com o uso, e o hospedeiro pode encher | Monitorar o espaço livre do hospedeiro |
| Memória do convidado grande demais | O hospedeiro fica sem RAM e desacelera | Deixar uma margem para o hospedeiro |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Verificar `/dev/kvm` antes de escolher a aceleração | Uma VM rápida, ou um recuo assumido para `tcg` |
| Informar o formato de cada disco, em todo lugar | Nenhuma adivinhação do QEMU |
| Nomear os discos pelo conteúdo | Nenhuma confusão sobre « o hospedeiro » |
| Rodar os testes sob `timeout`, com memória moderada | Um teste que trava para sozinho, sem ocupar a máquina; veja [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| Desligar o convidado por dentro antes de um snapshot de disco | Um disco coerente |
| Nomear cada snapshot de forma única e clara | `-a` e `-d` atingem o certo |
| Tirar um snapshot **antes** de qualquer etapa irreversível | Uma volta atrás em alguns segundos |
| Copiar regularmente o arquivo `qcow2` para outro suporte | É o único backup de verdade |
| Destruir os snapshots que não servem mais | O arquivo para de crescer |
| Ler `qemu-img snapshot -l` antes de aplicar um snapshot | Saber o que se restaura e o que se perde |

## Para ir mais longe

| Assunto | Onde |
|---|---|
| Todas as opções do QEMU | [Invocação do QEMU](https://www.qemu.org/docs/master/system/invocation.html) |
| A ferramenta `qemu-img` e seus subcomandos | [Manual do qemu-img](https://www.qemu.org/docs/master/tools/qemu-img.html) |
| Os comandos do monitor | [Monitor do QEMU](https://www.qemu.org/docs/master/system/monitor.html) |
| KVM | [Site do projeto KVM](https://www.linux-kvm.org/page/Main_Page) |
| Fabricar um Linux a partir dos códigos-fonte | [Linux From Scratch](https://www.linuxfromscratch.org/lfs/) |

## O que reter

| | |
|---|---|
| **Para lembrar** | **QEMU** simula a máquina (discos, tela, rede); **KVM**, função do kernel Linux (`/dev/kvm`), a torna rápida, deixando o processador real executar o convidado; senão, `-accel tcg` emula tudo por software. Um lançamento típico: `qemu-system-x86_64 -accel kvm -m 2G -smp 2 -drive file=d.qcow2,format=qcow2 -cdrom x.iso -boot order=cd` (memória, núcleos, disco, leitor de CD; `c` disco depois `d` CD, então um disco vazio deixa o CD iniciar, e `No bootable device.` indica que nenhuma mídia inicia). « Hospedeiro » tem dois sentidos: o hospedeiro de **virtualização** (a máquina real que inicia o QEMU, diante do convidado) e o hospedeiro de **construção** (o Linux já instalado que serve para fabricar outro, diante do sistema alvo); os dois podem se sobrepor. Um disco **`qcow2`** é um arquivo que cresce com o uso (`qemu-img create -f qcow2 d.qcow2 64M`, `qemu-img info`) e sabe guardar **snapshots**: `qemu-img snapshot -c` cria, `-l` lista, `-a` aplica, `-d` destrói (pelo nome). Snapshot **disco somente**: VM desligada, `qemu-img`. Snapshot **disco e RAM**: VM ligada, monitor do QEMU, `savevm`, `loadvm`, `delvm`, `info snapshots`. |
| **Armadilhas a evitar** | Confundir os dois « hospedeiros »; `-accel kvm` sem KVM; esquecer o formato do disco; fechar a janela da VM (é cortar a energia); achar que um snapshot é um backup (ele vive no arquivo `qcow2` e desaparece com ele); copiar ou tirar um snapshot de disco enquanto a VM roda; um disco `raw` que bloqueia `savevm`; dois snapshots com o mesmo nome; deixar os snapshots se acumularem. |
| **Boas práticas** | Testar `/dev/kvm` primeiro; informar o formato em todo lugar; nomear discos e snapshots com clareza; desligar o convidado por dentro (`sudo poweroff`) antes de um snapshot de disco; um snapshot antes de cada etapa arriscada; copiar o arquivo `qcow2` para outro lugar, para um backup de verdade; rodar os testes sob `timeout`. |
