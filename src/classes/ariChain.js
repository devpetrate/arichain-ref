const axios = require("axios");
const { Solver } = require("@2captcha/captcha-solver");
const ac = require("@antiadmin/anticaptchaofficial");
const { logMessage } = require("../utils/logger");
const { getProxyAgent } = require("./proxy");
const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../json/config.json");
const config = JSON.parse(fs.readFileSync(configPath));
const confApi = config.geminiApi;
const gemeiniPrompt = config.prompt;
const captchaApi = config.captha2Apikey;
const apiCaptcha = config.apiCaptchakey;
ac.setAPIKey(apiCaptcha);
const qs = require("qs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const chalk = require("chalk");

class ariChain {
  constructor(refCode, proxy = null, currentNum, total) {
    this.refCode = refCode;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 60000,
    };
    this.gemini = new GoogleGenerativeAI(confApi);
    this.model = this.gemini.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    this.twoCaptchaSolver = new Solver(captchaApi);
    this.currentNum = currentNum;
    this.total = total;
  }

  async makeRequest(method, url, config = {}) {
    try {
      const response = await axios({
        method,
        url,
        ...this.axiosConfig,
        ...config,
      });
      return response;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Request failed: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async getCaptchaCode() {
    try {
      const headers = {
        accept: "*/*",
      };
      const response = await this.makeRequest(
        "POST",
        "https://arichain.io/api/captcha/create",
        { headers }
      );
      return response;
    } catch (error) {
      logMessage(this.currentNum, this.total, "Error creating captcha", "error");
      return null;
    }
  }

  async getCaptchaImage(uniqueIdx) {
    try {
      const response = await this.makeRequest(
        "GET",
        `http://arichain.io/api/captcha/get?unique_idx=${uniqueIdx}`,
        { responseType: "arraybuffer" }
      );
      return response.data;
    } catch (error) {
      logMessage(this.currentNum, this.total, "Error fetching captcha image", "error");
      return null;
    }
  }

  async solveCaptchaWithGemini(imageBuffer) {
    try {
      const prompt = gemeiniPrompt;
      const image = {
        inlineData: {
          data: Buffer.from(imageBuffer).toString("base64"),
          mimeType: "image/png",
        },
      };
      const result = await this.model.generateContent([prompt, image]);
      return result.response.text().trim().replace(/\s/g, "");
    } catch (error) {
      if (error.message.includes("quota") || error.message.includes("limit")) {
        throw new Error("Gemini API quota exceeded");
      }
      return null;
    }
  }
   async solveCaptchaWith2Captcha(imageBuffer) {
      try {
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        const res = await this.twoCaptchaSolver.imageCaptcha({
          body: `data:image/png;base64,${base64Image}`,
          regsense: 1,
        });
  
        return res.data;
      } catch (error) {
        console.error("Error solving CAPTCHA with 2Captcha:", error);
        return null;
      }
    }
  
    async solveCaptchaWithAntiCaptcha(imageBuffer) {
      try {
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        const captchaText = await ac.solveImage(base64Image, true);
        return captchaText;
      } catch (error) {
        console.error("Error solving CAPTCHA with Anti-Captcha:", error);
        return null;
      }
    }

  async sendEmailCode(email, use2Captcha = false, useAntiCaptcha = false) {
    logMessage(this.currentNum, this.total, "Sending verification email...", "process");
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      logMessage(this.currentNum, this.total, `Attempt ${attempt} to send email`, "process");
      
      const captchaResponse = await this.getCaptchaCode();
      if (!captchaResponse?.data?.result?.unique_idx) {
        continue;
      }

      const captchaImage = await this.getCaptchaImage(captchaResponse.data.result.unique_idx);
      if (!captchaImage) continue;

      const captchaText = use2Captcha ? await this.solveCaptchaWith2Captcha(captchaImage) :
                     useAntiCaptcha ? await this.solveCaptchaWithAntiCaptcha(captchaImage) :
                     await this.solveCaptchaWithGemini(captchaImage);

      if (!captchaText) continue;

      const response = await this.makeRequest(
        "POST",
        "https://arichain.io/api/Email/send_valid_email",
        {
          headers: { "content-type": "application/x-www-form-urlencoded" },
          data: qs.stringify({
            email,
            unique_idx: captchaResponse.data.result.unique_idx,
            captcha_string: captchaText
          })
        }
      );

      if (response?.data?.status === "success") {
        logMessage(this.currentNum, this.total, "Verification email sent", "success");
        return true;
      }
    }

    logMessage(this.currentNum, this.total, "Failed to send verification email", "error");
    return false;
  }

  async getCodeVerification() {
    const { prompt } = require("../utils/logger");
    logMessage(this.currentNum, this.total, "Waiting for manual code input...", "process");
    return await prompt(chalk.yellow("[*] Enter verification code from email: "));
  }
  async checkinDaily(address) {
      const headers = {
        accept: "*/*",
        "content-type": "application/x-www-form-urlencoded",
      };
      const data = qs.stringify({ address });
      const response = await this.makeRequest(
        "POST",
        "https://arichain.io/api/event/checkin",
        {
          headers,
          data,
        }
      );
      if (response.data.status === "fail") {
        logMessage(this.currentNum, this.total, response.data.msg, "error");
        return null;
      }
      return response.data;
    }
  
    async transferToken(email, toAddress, password, amount = 60) {
      const headers = {
        accept: "*/*",
        "content-type": "application/x-www-form-urlencoded",
      };
      const transferData = qs.stringify({
        email,
        to_address: toAddress,
        pw: password,
        amount,
      });
      const response = await this.makeRequest(
        "POST",
        "https://arichain.io/api/wallet/transfer_mobile",
        {
          headers,
          data: transferData,
        }
      );
  
      if (response.data.status === "fail") {
        logMessage(this.currentNum, this.total, response.data.msg, "error");
        return null;
      }
  
      return response.data;
    }
  
    async registerAccount(email, password) {
      logMessage(this.currentNum, this.total, "Register account...", "process");
  
      const verifyCode = await this.getCodeVerification(email);
      if (!verifyCode) {
        logMessage(
          this.currentNum,
          this.total,
          "Failed get code verification.",
          "error"
        );
        return null;
      }
  
      const headers = {
        accept: "*/*",
        "content-type": "application/x-www-form-urlencoded",
      };
  
      const registerData = qs.stringify({
        email: email,
        pw: password,
        pw_re: password,
        valid_code: verifyCode,
        invite_code: this.refCode,
      });
  
      const response = await this.makeRequest(
        "POST",
        "https://arichain.io/api/Account/signup",
        {
          headers,
          data: registerData,
        }
      );
  
      if (response.data.status === "fail") {
        logMessage(this.currentNum, this.total, response.data.msg, "error");
        return null;
      }
  
      logMessage(this.currentNum, this.total, "Register succesfully.", "success");
  
      return response.data;
    }
}

module.exports = ariChain;