---
order: 2
---

# Data Science

Esta seção cobre as ferramentas [Python](/?c=langages-de-programmation&s=python&p=python) de data science: manipular grandes volumes de dados com eficiência (NumPy, pandas), explorá-los visualmente (Matplotlib, Jupyter), e construir modelos de machine learning clássicos (scikit-learn), em contraste com as redes neurais e os LLMs, tratados na seção [IA](/?c=ia).

O fio condutor é a performance: essas bibliotecas existem porque um loop Python puro sobre milhões de linhas é muito lento para um uso real (veja [Cache da CPU e vetorização (SIMD)](/?c=performance&p=cache-cpu-et-simd)); cada uma delega o cálculo pesado para código compilado, em troca de uma forma particular de escrever esse cálculo (vetorizado em vez de em loop explícito).

Você encontrará os diferentes conceitos abaixo:
