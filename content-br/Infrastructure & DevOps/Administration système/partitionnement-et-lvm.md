---
order: 2
---

# Particionamento e LVM

Uma vez [escolhido o sistema operacional](/?c=administration-systeme&p=virtualisation-et-choix-dos), a instalação exige decidir como organizar o espaço em disco disponível. Este capítulo cobre o particionamento clássico e seu alinhamento, sua criptografia, e o LVM, uma ferramenta que torna essa organização mais flexível.

## O particionamento: dividir um disco em zonas independentes

Um disco físico pode ser dividido em várias **partições**, cada uma tratada pelo sistema como um disco separado, com seu próprio sistema de arquivos e seu próprio ponto de montagem (o local onde seu conteúdo aparece na árvore de diretórios, veja [Árvore de diretórios e caminhos](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disco fisico (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (raiz, 100 GB)       │  ...pelo menos 2 particoes
└─────────────────┴──────────────────────────┘
```

Separar, por exemplo, `/` (o sistema) de `/home` (os dados dos usuários) em duas partições distintas isola os dois: um `/` que fica totalmente cheio (logs, atualizações) não bloqueia a gravação de novos dados de usuário em `/home`, e uma reinstalação do sistema pode se limitar à partição `/` sem afetar os dados.

## Alinhar as partições: começar em uma fronteira do disco

O disco não lê nem escreve byte a byte, mas por **blocos**. Três tamanhos convivem, e é preciso distingui-los:

| Palavra | Definição | Tamanho habitual |
|---|---|---|
| **Setor** | a menor unidade numerada do disco, a que o `fdisk` e a tabela de partições contam | 512 bytes |
| **Bloco físico** | o que o disco realmente lê ou escreve em uma única operação (veja [o armazenamento](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | 4 KiB, ou seja 8 setores |
| **Bloco do sistema de arquivos** | a unidade de armazenamento do **sistema de arquivos** (a forma como uma partição organiza seus arquivos, por exemplo `ext4`) | 4 KiB |

Uma partição está **alinhada** quando seu primeiro setor (sua coluna `Start`) cai no início de um bloco físico. Por convenção, mira-se um múltiplo de **2048 setores**, ou seja 1 MiB: ele também é múltiplo de 8 setores, portanto do tamanho de um bloco físico, e é o valor que o `fdisk` propõe por padrão.

```text
Exemplo em um disco imaginário (8 setores por bloco físico):

Partição ALINHADA (início no setor 8, múltiplo de 8)
bloco físico:     |  bloco 1   |  bloco 2   |  bloco 3   |
bloco do SA:      |    SA 0    |    SA 1    |    SA 2    |
→ um bloco do sistema de arquivos = um bloco físico: 1 escrita

Partição DESALINHADA (início no setor 5)
bloco físico:     |  bloco 1   |  bloco 2   |  bloco 3   |
bloco do SA:           |    SA 0    |    SA 1    |    SA 2    |
→ cada bloco do SA se sobrepõe a 2 blocos físicos
```

No caso desalinhado, escrever um único bloco do sistema de arquivos obriga o disco a **ler** os dois blocos físicos envolvidos, modificar a parte correspondente e depois **reescrever** ambos: três a quatro operações em vez de uma. Nada trava e os dados continuam corretos: a perda é de desempenho, e ela não aparece no uso diário.

### Verificar um início

```bash
sudo fdisk -l /dev/sdb          # mostra a tabela de partições do disco sdb (coluna Start, em setores)
echo $(( 73402368 % 2048 ))     # % dá o resto da divisão: 0 significa «múltiplo de 2048», portanto alinhado
echo $(( 73402369 % 2048 ))     # resto 1: início deslocado em um setor, portanto não alinhado
```

| Start | Resto da divisão por 2048 | Veredito |
|---|---|---|
| 2048 | 0 | alinhado |
| 10487808 | 0 | alinhado |
| 73402368 | 0 | alinhado |
| 73402369 | 1 | deslocado em um setor |
| 63 (início histórico herdado do DOS) | 63 | desalinhado |

### Quando o alinhamento é decidido

O alinhamento é fixado **na criação da tabela de partições**: é ela que registra os `Start`. Formatar (`mkfs`), montar ou copiar arquivos não move nenhum início: dá para constatar executando `fdisk -l` de novo antes e depois de um `mkfs`, os `Start` não mudam. Portanto é antes da formatação que se deve verificar.

O início proposto por padrão pelo `fdisk` é prático, mas não infalível (um disco preparado com uma ferramenta antiga pode fazê-lo propor `63`): aceita-se, depois verifica-se a coluna `Start`.

### Corrigir um deslocamento: apagar, recriar, reformatar

Mover o início de uma partição muda o lugar onde cada estrutura do sistema de arquivos se encontra, porque todas são localizadas **a partir do início da partição**. Por exemplo, o **superbloco** do `ext4` (a zona que descreve o sistema de arquivos: tamanho, tipo, número mágico `0xEF53`) fica a 1024 bytes, ou seja 2 setores, do início. Deslocar a partição em um setor faz ler no lugar errado: o antigo sistema de arquivos deixa de ser legível e é preciso recriá-lo com `mkfs`.

| Partição | Início antes | Início depois | O que o `fdisk` indica ao recriar |
|---|---|---|---|
| `sdb3` | 10487808 | 10487808 (inalterado) | assinatura `ext4` detectada: ele propõe apagá-la |
| `sdb4` | 73402369 | 73402368 | nada: ele procura o superbloco 2 setores depois do **novo** início, ou seja um setor antes do antigo sistema de arquivos |

Uma assinatura que não é mais detectada não significa que os dados antigos desapareceram: eles continuam no disco até o `mkfs`.

> **Limites:**
> - Realinhar uma partição que já contém arquivos obriga a apagá-la, recriá-la e reformatá-la: os arquivos são perdidos sem backup. Daí o interesse de verificar **antes** de colocar qualquer coisa nela.
> - Em um disco virtual (por exemplo uma máquina virtual `QEMU`), o `fdisk` costuma anunciar setores de 512 bytes, lógicos e físicos: o ganho não é medido ali. Manter o alinhamento em 1 MiB continua sendo um hábito barato que evita o problema em um disco real.
> - O alinhamento não resolve tudo: ele não melhora a velocidade básica do disco, apenas evita perder parte dela.

## Criptografar uma partição

Uma partição criptografada protege seu conteúdo caso o disco físico seja roubado ou acessado fora do sistema normal (inicialização a partir de outro pendrive, disco desmontado e conectado em outro lugar): sem a chave de descriptografia, seu conteúdo permanece ilegível. O **LUKS** (*Linux Unified Key Setup*) é o padrão do Linux para essa criptografia, geralmente solicitado na inicialização na forma de uma frase-senha.

## LVM: uma camada de flexibilidade entre o disco e as partições

Um particionamento clássico fixa o tamanho de cada partição **no momento da instalação**: aumentá-lo depois é arriscado (geralmente exige mover dados). O **LVM** (*Logical Volume Manager*) adiciona uma camada de abstração que torna esse tamanho modificável posteriormente:

| Nível LVM | Papel |
|---|---|
| Volume físico (*Physical Volume*, PV) | Uma partição ou um disco inteiro, como visto pelo LVM |
| Grupo de volumes (*Volume Group*, VG) | Um "pool" de espaço, formado combinando um ou mais PVs |
| Volume lógico (*Logical Volume*, LV) | Uma porção do VG, usada como uma partição comum (formatada, montada) |

```text
Disco fisico --> Volume fisico (PV) --\
Disco fisico --> Volume fisico (PV) ----> Grupo de volumes (VG) --> Volumes logicos (LV)
                                                                              |
                                                                     /  (LV montado em /)
                                                                     /home  (LV montado em /home)
```

Um volume lógico pode ser aumentado usando o espaço ainda livre do grupo de volumes, sem reinstalação nem deslocamento físico dos dados existentes: é essa flexibilidade que justifica o LVM mesmo em um servidor único, não apenas em um contexto com vários discos.

> **Nota:** LVM e criptografia se combinam empilhando as camadas: o disco físico é primeiro criptografado com LUKS, e depois o LVM é configurado **por cima** desse volume já criptografado. Cada volume lógico herda assim a criptografia sem precisar configurá-la individualmente.

> **Armadilha:** criar uma única partição `/` grande sem pensar na divisão: um incidente (logs que lotam o disco, por exemplo) afeta então todo o sistema em vez de uma zona isolada.
>
> **Boa prática:** prever pelo menos 2 partições já na instalação (tipicamente `/` e `/home`, ou `/` e `/boot`), e usar o LVM para manter a possibilidade de ajustar seus tamanhos depois sem reinstalação.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O particionamento divide um disco em zonas independentes cujo início deve ser múltiplo de 2048 setores (alinhamento, decidido na criação da tabela); o LUKS criptografa uma partição; o LVM adiciona uma camada (PV → VG → LV) que torna os tamanhos modificáveis após a instalação. |
| **Ferramentas utilizáveis** | LUKS para a criptografia, LVM (`pvcreate`, `vgcreate`, `lvcreate`) para a gestão flexível do espaço em disco. |
| **Armadilhas a evitar** | Uma única partição `/` não separada: um incidente em uma zona afeta todo o sistema. Um `Start` deslocado (por exemplo `73402369`): nada trava, mas cada escrita toca dois blocos físicos. |
| **Boas práticas** | Verificar cada `Start` (resto da divisão por 2048 igual a 0) antes de formatar. Sempre prever pelo menos 2 partições, e empilhar o LVM sobre um volume já criptografado com LUKS, e não o contrário. |
