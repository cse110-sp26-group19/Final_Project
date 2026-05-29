### API decision

**Reason for switching from FaceFusion to Replicate**

- Face Fusion is a self hosted application, you run it yourself on a gpu machine
- Originally chosen as completely free and was the first one we found
- Did not understand gpu costs, only looked at potential monetary costs
- **Reason For Switching to other options**
  - After the application was unable to be run on a laptop due to their gpu being ubable to handle it, we realized that running based on personal computer's gpu was not a good idea.
  - As if it cannot be replicated on a clients computer due to gpu problems, we would have lost quite a bit of potential customers. Since it depends on gpu, it is even less likely to run properly on the customer's phone unless they have higher gpu that a computer/laptop, which is usually not the case.

**Why we chose replicate with cloudflare**

<<<<<<< HEAD
- FaceFusion
  - Depends on Personal Computers GPU, which is not good if clients device cannot handle it
  - We did not understand the extent of the GPU Usage until it was unable to be supported due to personal computers being unable to keep up with the GPU needs.
  - Originally Chosen as free, and can be ran in local computer until couldn't
 
## Why We Switched

- Hosting FaceFusion would require paid GPU servers which are too costly for this project
- Replicate handles GPU requirements on their end via a simple REST API
- Cloudflare Workers proxies Replicate API calls to keep the API key secure
=======
- Replicate is relatively cheap, it takes 384 runs roughly to cost a dollar worth
- Replicate is a self hosted ML inference platform (You call an api, and it runs it for you)
  - Cloudflare was chosen for token encryption to prevent the token being stolen (if end up getting stolen, causes troubles in more ways than one)
- Although we have less control, we do get the GPU problem out of the way, so thats the point of it all.

