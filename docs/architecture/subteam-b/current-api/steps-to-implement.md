## Replicate with Cloudfare 
**Current Structure Flow**
    - User → Frontend → Cloudflare Worker → Replicate → Cloudflare Worker → User
    - 2 Choices
      - a) User uploads image → Worker → Replicate → returns result URL → user
      - b) User uploads image → Worker → R2 stores image → Replicate uses image URL → Worker returns result

---
### How to use
1. Go to (Replicate's Dashboard)[https://replicate.com/account/api-tokens]
   - You may need to login via Github
2. Generate an API token
   - **Do Not Share the Token, Treat it as a password, DON't Commit to Github**
   - The token is used for **identifying your account** and tracks your **billing/usage**
   - That’s why protecting the token matters:
   
   - **Precaution Warning** 
     - Anyone with the token can use your account credits/billing
     - If leaked publicly, people could run expensive models on your account

     - Good practices:
       - Store it in environment variables
       - Use .env files locally
       - Add .env to .gitignore
       - Rotate/revoke tokens if exposed (via (replicate dashboard)[https://replicate.com/account/api-tokens])

3. Create a Cloudflare Account and enable Workers, Pages and R2
   - Create New Worker - Add Secret like REPLICATE_API_KEY
     - First click the Blue Add Button on the top right
     - Then Click On Add Workers
       - !(Image Example of the above instructions)[./cloudflare_step1.png]
     - Then Go to settings and on top will be a variable and secrets portion
       - !(Image of Location)[./cloudflare_step2.png]
     - Then add secret:
          - Name: REPLICATE_API_TOKEN
          - Value: your Replicate API key
   - Add your Replicate API key as a secret
   - (Optional) create R2 bucket **(For File Storage If Needed)**
     - users upload face images and you want any of the 2 options below
      - you need temporary storage before sending to Replicate
      - you want permanent storage of results
   - Deploy Worker

4. Globally Install Wrangler CLI so we can delpoy apps to Cloudflare workers on our machines
    - AKA through the terminal, type this
      - ```npm install -g wrangler```
    - Then login through terminal via
      - ```wrangler login```

5. Create a Worker's Project 
   - In the terminal type this to create it