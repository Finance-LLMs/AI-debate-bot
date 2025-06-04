# Conversational AI Debator

## How to run the code

1. Clone this repo
    ```bash
    git clone https://github.com/Finance-LLMs/AI-debate-bot.git
    ```

2. Setup the environment variables
    ```bash
    vim .env        # Ubuntu
    notepad .env    # Windows
    ```

3. Install the dependencies

    ```bash
    npm install                          # Frontend
    pip install -r requirements.txt      # Backend
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

    ```bash
    https://ai-debator.roamify.tech
    ```