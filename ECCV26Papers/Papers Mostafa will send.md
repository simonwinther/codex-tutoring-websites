Summarize 1-3 paragrapsh per paper; just their main idea

Check up the paper 

BraTS workshop check posters - ask mostafa about the template 

# Transferability Between Understanding and Generation in Unified Multimodal Models

> [!PDF|] [[ECCV26_01_Transferability.pdf#page=1&selection=0,0,1,39|ECCV26_01_Transferability, p.1]]
> > Transferability Between Understanding and Generation in Unified Multimodal Models
> 

- Can learning to understand images improve image generation?
- The paper studies unified multimodal models: models that can both answer questions about images and generate images.
	- E.g. Improve a trained model’s counting ability, then test whether it can generate images with the correct number of objects.
- The important finding is that this transfer depends on how much the two tasks actually share inside the model
	- In their experiments, the strongest transfer occurs when understanding and generation share both the main transformer and the image encoder.
	![[Pasted image 20260922123215.png]]

> [!info] [[ECCV26_01_Transferability.pdf#page=5&selection=108,0,127,41|ECCV26_01_Transferability, p.5]]
> > Fig. 1: Architecture of chosen unified multimodal models for cross-task transferability analysis on counting. 
