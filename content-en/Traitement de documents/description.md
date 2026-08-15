# Description

This section covers extracting information from existing documents (PDFs, scanned images): pulling out text, reconstructing tables, choosing where to run the vision models that make all of this possible. It relies on [Python](/?c=langages-de-programmation&s=python) for implementation and on the [neural networks](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)/[vision architectures](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) from the [IA](/?c=ia) section for how the underlying models work.

The common thread is that a document is never just one thing: a PDF page mixes text that's genuinely stored as such (native, reliable to extract) with content that only exists as an image (a scan, a complex table), which must be interpreted visually before it becomes usable. Telling the two apart, and knowing when to switch from one to the other, is the question that comes up in every chapter of this section.

You'll find the different topics below:
