const { prompt, logMessage, rl } = require("./utils/logger");
const ariChain = require("./classes/ariChain");
const { generatePassword } = require("./utils/generator");
const { getRandomProxy, loadProxies } = require("./classes/proxy");
const chalk = require("chalk");
const fs = require("fs");

async function main() {
  // Show header only once
  console.log(chalk.cyan(`
░█▀█░█▀▄░▀█▀░█▀▀░█░█░█▀█░▀█▀░█▀█
░█▀█░█▀▄░░█░░█░░░█▀█░█▀█░░█░░█░█
░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀░▀░▀░▀▀▀░▀░▀
     By : El Puqus Airdrop
     github.com/ahlulmukh
  `));

  const captchaSolver = await prompt(
    chalk.yellow("Choose CAPTCHA solver:\n1. 2Captcha\n2. Anti-Captcha\n3. Gemini\nEnter number: ")
  );
  const refCode = await prompt(chalk.yellow("Enter Referral Code: "));
  const count = parseInt(await prompt(chalk.yellow("How many accounts? ")));
  
  if (!loadProxies()) {
    logMessage(null, null, "No proxies loaded - using direct connection", "warning");
  }

  const accountStream = fs.createWriteStream("accounts.txt", { flags: "a" });

  for (let i = 0; i < count; i++) {
    console.log(chalk.white("-".repeat(50)));
    logMessage(i + 1, count, "Starting registration", "process");

    const proxy = await getRandomProxy(i + 1, count);
    const bot = new ariChain(refCode, proxy, i + 1, count);
    const email = await prompt(chalk.yellow(`[${i + 1}/${count}] Enter email address: `));
    const password = generatePassword();

    try {
      if (!await bot.sendEmailCode(email, captchaSolver === "1", captchaSolver === "2")) {
        continue;
      }

      const account = await bot.registerAccount(email, password);
      if (!account) continue;

      // Save FULL account details (original format)
      accountStream.write(`Email : ${email}\n`);
      accountStream.write(`Password : ${password}\n`);
      accountStream.write(`Address : ${account.result.address}\n`);
      accountStream.write(`Master Key : ${account.result.master_key}\n`);
      accountStream.write(`Invite Code : ${account.result.invite_code}\n`);
      accountStream.write(`Reff To: ${refCode}\n`);
      accountStream.write("-".repeat(50) + "\n\n");
      
      logMessage(i + 1, count, `Registered: ${email}`, "success");
      await bot.checkinDaily(account.result.address);
      
    } catch (error) {
      logMessage(i + 1, count, `Error: ${error.message}`, "error");
    }
  }

  accountStream.end();
  rl.close();
  console.log(chalk.green("\n[*] Registration completed! Check accounts.txt"));
}

module.exports = main;