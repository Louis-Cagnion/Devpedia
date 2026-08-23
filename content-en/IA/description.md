---
order: 8
---

# Description

This section covers modern artificial intelligence, starting from a common foundation (**Fundamentals of Deep Learning**: how a model learns and works internally), then three families of models built on that foundation depending on the type of data handled: text, up to large language models (**NLP and LLM**, followed by concrete application examples in **LLM Applications**), images, in particular character recognition (**Vision and OCR**), and audio, speech synthesis (**AI Voice**). The **Production and Governance** part covers what surrounds an AI system once in real use: monitoring, regulation, obligations on the data flowing through it, whatever the modality involved.

The throughline of the LLM part is that a single LLM is almost never enough: it has bounded working memory, no knowledge of events after its training cutoff, and cannot act on the real world on its own. RAG and agents are the two common ways to compensate for these limits, and the price of this extra power is paid in cost, operational risk, and governance obligations.

For the Python tools used to manipulate data and build classic models (NumPy, pandas, scikit-learn...), see the [Data Science](/?c=data-science) section: this section focuses on the models themselves and the systems built around them, independently of the language used to implement them.

You'll find the different topics below:
