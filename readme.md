# Ari Chain Wallet Referral Bot (100% Working)

This bot doesn't automates the process of creating accounts and using referral codes for the AriChain Wallet, this is because arichain remove creation of account with IMAP gmails, so you have to do most of it yourself but it 100% worked.

## Features

- Uses proxies to avoid IP bans.
- Logs the created accounts.

## Requirements

- Node.js v18.20.5 LTS or latest.
- npm (Node Package Manager)
- Use 2Captcha Services [2Captcha](https://2captcha.com/), [AntiCaptcha](https://anti-captcha.com/), free version you can using gemini apikey.
- emails (preferably gmail)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/devpetrate/arichain-ref.git
   cd arichain-ref
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a `proxy.txt` file in the root directory and add your proxies (one per line).

4. change `src/json/config.json.example` to `src/json/config.json`
    ```sh
   cp src/json/config.json.example src/json/config.json
   ```

5. Fill in 2 Captcha service as your apikey in `config.json` and change `"captha2Apikey": "your_2captcha_apikey",` with your apikey. (you can use any of the two or setup gemini API)

## Usage

1. Run the bot:

   ```sh
   node .
   ```

2. Follow the prompts to enter your referral code, address to transfer token and the number of accounts you want to create, and dont forget too choice your solve captcha too.

3. Enter the mail of your desire, check the email for code and paste in the code into the terminal when prompted.

## Output

- The created accounts will be saved in `accounts.txt`.

## Notes

- Make sure to use valid proxies to avoid IP bans.
- The bot will attempt to verify the email up to 5 times before giving up.


## Donation

If you would like to support the development of this project, you can make a donation using the following addresses:

- Solana: `2V9uJMVKsHSQJjCb4VvQQGgtVybYccecQ4BN52kdAMek`

## Disclaimer

This tool is for educational purposes only. Use it at your own risk.
