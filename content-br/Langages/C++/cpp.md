# C++

O C++ surgiu como uma extensão do C («C with Classes») e continua hoje a ser retrocompatível com praticamente todo o C (ver secção C); quase tudo o que já foi abordado ali (ponteiros, memória, estruturas, compilação) aplica-se diretamente em C++. O que o C++ acrescenta a isso é, essencialmente, a **programação orientada para objetos**, a **gestão automática de recursos** (RAII) e a **programação genérica** (templates).

Entre os conceitos essenciais introduzidos pelo C++ em relação ao C, destacam-se nomeadamente:

- Classes e objetos (encapsulamento, herança, polimorfismo)
- As referências, uma alternativa mais segura aos ponteiros em muitos casos
- RAII e os ponteiros inteligentes (*smart pointers*), que reduzem drasticamente as fugas de memória abordadas no capítulo dedicado à linguagem C
- Os modelos, para escrever código genérico sem comprometer o desempenho
- A biblioteca padrão (STL): contentores, algoritmos e iteradores prontos a utilizar
- As exceções, uma alternativa estruturada ao estilo de erros «à la C» (valores de retorno + `errno`)

A aprendizagem do C++ permite manter o controle de baixo nível do C (memória, desempenho, ausência de recolha de resíduos) ao mesmo tempo que se dispõe de ferramentas de nível superior para estruturar um projeto de grande dimensão, um compromisso que explica a sua presença duradoura em motores de jogos, sistemas incorporados exigentes e software que requer simultaneamente desempenho e elevada complexidade lógica.

> **Nota:** ao contrário do PHP, do [Python](/?c=langages-de-programmation&s=python&p=python) ou do [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), o C++ continua a **ser** **compilado** para código de máquina nativo (ver capítulo sobre compilação, secção C): sem máquina virtual nem interpretador entre o código e a sua execução.
