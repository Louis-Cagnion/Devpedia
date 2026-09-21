---
order: 5
---

# A destilação de modelos

Um modelo de linguagem volumoso é muito capaz, mas lento e caro de executar. A **destilação** transfere parte de suas capacidades para um modelo muito menor, rápido e econômico, apoiando-se em uma analogia professor/aluno.

## O princípio: um professor que gera os dados de treinamento do aluno

Em vez de treinar o modelo pequeno (o **aluno**) apenas com dados brutos encontrados na internet, usa-se o modelo grande (o **professor**) para produzir ele mesmo as respostas esperadas, raciocínio incluído, passo a passo. Essas respostas geradas se tornam os dados de treinamento do aluno:

```text
Modelo professor (grande, lento, caro)
  --> gera respostas com seu raciocinio
  --> essas respostas viram dados de treinamento
Modelo aluno (pequeno, rapido, barato)
  --> aprende a reproduzir o MESMO tipo de raciocinio
```

O aluno nunca herda os pesos internos do professor: ele aprende um **padrão** de raciocínio a partir de exemplos produzidos pelo professor, exatamente como um aluno humano aprende um método a partir de exercícios corrigidos por seu professor, sem nunca acessar seu pensamento real.

## O resultado: menos capaz, mas bem mais rápido e barato

Um modelo destilado nunca iguala seu professor, mas continua surpreendentemente capaz em relação ao seu tamanho e custo de execução. A DeepSeek aplicou esse método com seu modelo R1: os dados de raciocínio gerados pelo R1 serviram para treinar modelos bem menores (de 1,5 a 70 bilhões de parâmetros), com resultados melhores do que se esses modelos pequenos tivessem que descobrir sozinhos esse raciocínio por [aprendizado por reforço](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## A pergunta que permanece em aberto: a permissão, não a técnica

A destilação em si não tem nada de problemático: é um método de aprendizado de máquina padrão, e muitos provedores de modelos a permitem explicitamente em sua licença. O que distingue um uso legítimo de um contestado nunca é a técnica, mas sim a **permissão**:

| Situação | Status |
|---|---|
| Destilar o próprio modelo em modelos menores | Normal, amplamente documentado e permitido |
| Destilar a partir das respostas de um modelo de terceiros, sem autorização, violando seus termos de uso | Contestado: uma questão de respeito aos termos de uso, não da técnica em si |

> **Cuidado:** julgar a destilação "aceitável" ou não apenas por sua natureza técnica. O mesmo método se torna legítimo ou não conforme o dono do modelo professor permita ou proíba isso em seus termos de uso.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A destilação treina um modelo pequeno (aluno) com as respostas geradas por um modelo grande (professor), sem nunca copiar seus pesos. O resultado é menos capaz que o professor, mas bem mais rápido e barato de executar. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: a destilação designa um método de treinamento, aplicável com qualquer framework de deep learning. |
| **Armadilhas a evitar** | Confundir a questão técnica (como destilar) com a questão de permissão (se há direito de destilar a partir desse modelo específico). |
| **Boas práticas** | Verificar a licença do modelo professor antes de qualquer destilação a partir de suas respostas; destilar o próprio modelo continua sem ambiguidade. |
