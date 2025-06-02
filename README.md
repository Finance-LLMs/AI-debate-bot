# Conversational AI Javascript

## How to run the code

1. Clone this repo
2. Setup the environment variables
   - Fill in the values in .env file
3. Install the dependencies

   ```bash
   npm install # install the dependencies
   ```

4. Run the script

   ```bash
   npm run build
   ```

5. Optional: PM2 to keep server running
   
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name ai-debator
   pm2 startup
   pm2 save
   ```

6. Visit localhost

   ```html
   http://localhost:3000/
   ```
