# Description

Otimizar um programa é primeiro entender onde vai seu tempo, e raramente é onde se imagina. Esta seção reúne princípios de desempenho que não dependem de uma linguagem específica: eles se aplicam tanto a um script Python quanto a uma página web ou um acesso a banco de dados.

O fio condutor é uma distinção que se repete em todo lugar: o tempo que seu programa **perde sozinho** (esperas fixas, trabalho refeito, idas e vindas desnecessárias) e o tempo que ele **passa esperando outra coisa** (a rede, um disco, um serviço remoto). O primeiro se elimina sem contrapartida. O segundo se contorna, às vezes, mas frequentemente tem um custo em outro lugar, e é aí que os trade-offs começam.

Os exemplos numéricos vêm de um caso real: a otimização de um programa de automação de navegador, que passou de 61 para 14 segundos no mesmo trabalho, sem mudar nada do que ele produz.

Você vai encontrar os diferentes conceitos abaixo:
