# Description

This section covers modern artificial intelligence, from neural networks to systems built around large language models (LLMs): how a model learns and works internally, then how to use it, surround it with tools and external data, monitor it once in production, and meet the obligations that apply to the data passing through it.

The throughline of the second half of the section is that a single LLM is almost never enough: it has bounded working memory, no knowledge of events after its training cutoff, and cannot act on the real world on its own. RAG and agents are the two common ways to compensate for these limits, and the price of this extra power is paid in cost, operational risk, and governance obligations, covered in the final chapters.

For the Python tools used to manipulate data and build classic models (NumPy, pandas, scikit-learn...), see the [Data Science](/?c=data-science) section: this section focuses on the models themselves and the systems built around them, independently of the language used to implement them.

You'll find the different topics below:
