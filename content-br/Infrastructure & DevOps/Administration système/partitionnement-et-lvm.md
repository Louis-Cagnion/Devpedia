---
order: 2
---

# Particionamento e LVM

Uma vez [escolhido o sistema operacional](/?c=administration-systeme&p=virtualisation-et-choix-dos), a instalação exige decidir como organizar o espaço em disco disponível. Este capítulo cobre o particionamento clássico, sua criptografia, e o LVM, uma ferramenta que torna essa organização mais flexível.

## O particionamento: dividir um disco em zonas independentes

Um disco físico pode ser dividido em várias **partições**, cada uma tratada pelo sistema como um disco separado, com seu próprio sistema de arquivos e seu próprio ponto de montagem (o local onde seu conteúdo aparece na árvore de diretórios, veja [Árvore de diretórios e caminhos](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disco fisico (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (raiz, 100 GB)       │  ...pelo menos 2 particoes
└─────────────────┴──────────────────────────┘
```

Separar, por exemplo, `/` (o sistema) de `/home` (os dados dos usuários) em duas partições distintas isola os dois: um `/` que fica totalmente cheio (logs, atualizações) não bloqueia a gravação de novos dados de usuário em `/home`, e uma reinstalação do sistema pode se limitar à partição `/` sem afetar os dados.

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
| **Para lembrar** | O particionamento divide um disco em zonas independentes; o LUKS criptografa uma partição; o LVM adiciona uma camada (PV → VG → LV) que torna os tamanhos modificáveis após a instalação. |
| **Ferramentas utilizáveis** | LUKS para a criptografia, LVM (`pvcreate`, `vgcreate`, `lvcreate`) para a gestão flexível do espaço em disco. |
| **Armadilhas a evitar** | Uma única partição `/` não separada: um incidente em uma zona afeta todo o sistema. |
| **Boas práticas** | Sempre prever pelo menos 2 partições, e empilhar o LVM sobre um volume já criptografado com LUKS, e não o contrário. |
