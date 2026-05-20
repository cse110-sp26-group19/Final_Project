## Replicate API INFO

### How to use

1. Go to (Replicate's Dashboard)[https://replicate.com/account/api-tokens]
   - You may need to login via Github
2. Generate an API token
3. Run this in your terminal before running code that calls replicate model
   - `export REPLICATE_API_TOKEN=your_actual_token`
     - somewhere in your code, you would import replicate to use
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

4.
