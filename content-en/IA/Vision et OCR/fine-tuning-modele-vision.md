---
order: 4
---

# Training and fine-tuning a vision model for a business use case

The generic training mechanisms ([loss function, gradient descent, backpropagation](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [PyTorch training loop](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) apply as-is to a vision model: this chapter doesn't repeat them. It covers what's specific to training a vision model for a precise business use case (recognizing a given supplier's invoices, for instance): starting from an already-trained model rather than from scratch, and adapting image data accordingly.

## Starting from a pretrained model rather than from scratch

Training a vision model **from scratch** (random weights) requires millions of annotated images, a need already noted in the generic training chapter. For a precise business use case, that volume almost never exists: a few hundred to a few thousand examples is more realistic, far too little to learn to recognize shapes from nothing.

**Transfer learning** works around this problem: start from a model already trained on a very large, general-purpose dataset (e.g. [ImageNet](https://www.image-net.org/), millions of photos, thousands of categories), then continue training it on the business use case's specific data:

```text
General-purpose training (already done, by someone else, on millions of images):
Random weights -> ... -> Model that recognizes edges, textures, common shapes

Fine-tuning (to do yourself, on your own business use case):
Pretrained model -> continued training on your own data -> adapted model
```

A vision model's earliest layers learn very general patterns (edges, textures, corners), useful for any visual task; only the layers closest to the output are actually specific to the original task. Starting from a pretrained model means reusing this already-learned base, and only readjusting what genuinely needs to change.

> **Pitfall:** training a vision model from scratch for a business use case with little available data, for lack of having looked for an equivalent pretrained model. The result almost always overfits (see [overfitting](/?c=data-science&p=machine-learning-scikit-learn)): the model memorizes the few available examples instead of learning a general pattern.
>
> **Best practice:** systematically look for a relevant pretrained model (on a related task) before considering training from scratch, reserved for cases where the visual domain is so unusual that no existing model has learned anything useful for it.

## Freezing layers: only readjusting what needs to change

Once the pretrained model is loaded, several strategies exist, depending on how much data is available for fine-tuning:

| Strategy | What gets readjusted | When to use it |
|---|---|---|
| **Freeze everything except the last layer** | Only the output layer (adapted to the new categories) | Very little data; the visual domain resembles the pretraining one |
| **Freeze the early layers, readjust the later ones** | The deep layers (specific patterns), not the early ones (generic patterns) | Moderate amount of data; the most common trade-off |
| **Freeze nothing (full fine-tuning)** | Every layer | Abundant data; the visual domain differs notably from the pretraining one (e.g. scanned black-and-white documents vs. color photos) |

**Freezing** a layer means excluding it from the gradient computation: its weights stay fixed at their pretrained value, backpropagation never modifies them.

```python
# Load a pretrained model and freeze its "backbone" (the pattern-extraction layers)
for param in model.backbone.parameters():
    param.requires_grad = False   # excluded from gradient computation, see autograd

# Only the new output layer, added for this business use case, stays trainable
model.output_head = nn.Linear(feature_size, num_business_categories)
```

> **Pitfall:** using the same learning rate as for training from scratch. A learning rate that's too high during fine-tuning brutally alters already-useful weights, a phenomenon called **catastrophic forgetting**: the model loses the generic patterns it had already learned, without having replaced them with anything better.
>
> **Best practice:** use a learning rate noticeably lower than for training from scratch (often 10 to 100 times smaller) for the readjusted layers, precisely because they already start from a good point rather than from random values.

## Adapting the data: image-specific augmentation

With few examples available, **data augmentation** artificially creates variants of each training image, to expose the model to a diversity a small dataset doesn't cover on its own:

```python
from torchvision import transforms

augmentation = transforms.Compose([
    transforms.RandomRotation(degrees=5),                    # slight scan misalignment
    transforms.ColorJitter(brightness=0.2, contrast=0.2),    # lighting/scan quality variation
    transforms.GaussianBlur(kernel_size=3),                  # slight blur (photo rather than scanner)
])
```

Each transformation should correspond to a variation **actually encountered** in production data: for a scanned document, a slight rotation (a poorly aligned scan) or a brightness change (scanner quality) are realistic; a 180° rotation or a horizontal mirror almost never are for text.

> **Pitfall:** applying generic augmentations copied from a photo-classification tutorial (90°/180° rotation, horizontal mirror), without checking them against the variations actually observed on your own documents. A 180° rotation would teach the model to recognize upside-down text, a case that never happens in practice: training wasted on an unrealistic case, at the expense of real ones.
>
> **Best practice:** choose each augmentation based on the variations actually observed on real examples from the business use case (scan quality, angle, lighting), not by default from a generic example.

See also [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) for the generic training loop all of the above fits into, and [OCR: from classic pattern recognition to deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) for an example of a model you might want to fine-tune on a document format specific to a company.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Transfer learning starts from a model pretrained on a large, general-purpose dataset rather than from scratch, essential as soon as the business use case's data is limited. Freezing the early layers preserves already-learned generic patterns; only readjust the later layers (or all of them, with a reduced learning rate) depending on the available data volume. Data augmentation should reflect variations actually encountered, not generic transformations. |
| **Tools you can use** | Pretrained models from vision libraries (torchvision, Hugging Face); `requires_grad = False` to freeze layers; `torchvision.transforms` for data augmentation. |
| **Pitfalls to avoid** | Training from scratch with little data rather than looking for a pretrained model. Keeping too high a learning rate during fine-tuning (catastrophic forgetting). Applying unrealistic augmentations for the actual business use case. |
| **Best practices** | Always look for a relevant pretrained model before training from scratch. Noticeably reduce the learning rate during fine-tuning. Choose augmentations based on variations actually observed on your own documents. |
