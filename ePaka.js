var creds = require("./credentials.js");
const axios = require('axios');
const md5 = require('md5');
const xml2js = require('xml2js');
const URLSearchParams = require('url').URLSearchParams;

const parser = new xml2js.Parser();

// Замените следующие переменные актуальными данными вашей учетной записи ePaka
const userEmail = creds.ePakaLogin;
const userPassword = creds.ePakaPass;
const hashedPassword = md5(userPassword); // Пароль должен быть в формате MD5

// Функция для получения сессионного ключа
const getSessionKey = async () => {
    const params = new URLSearchParams();
    params.append('email', userEmail);
    params.append('password', hashedPassword);

    try {
        const response = await axios.post('https://www.epaka.pl/api/login.xml', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const result = await parser.parseStringPromise(response.data);
        const sessionKey = result.data.session[0];

        return sessionKey;
    } catch (error) {
        console.error('Ошибка при получении сессионного ключа:', error);
        throw error;
    }
};

// Функция для проверки цен, используя сессионный ключ
const checkPrices = async (sessionKey) => {
    // Здесь вставьте параметры, необходимые для метода checkPrices
    const params = new URLSearchParams({
        'session': sessionKey,
        // ...другие параметры, если они требуются
    });

    try {
        const response = await axios.post('https://www.epaka.pl/api/checkPrices.xml', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Конвертируем XML ответ в объект JavaScript
        const result = await parser.parseStringPromise(response.data);

        console.log('Результат проверки цен:', result);
    } catch (error) {
        console.error('Ошибка при вызове checkPrices:', error);
    }
};

// Вызов функций для получения ключа и проверки цен
getSessionKey().then(sessionKey => {
    console.log('Session key:', sessionKey);
    checkPrices(sessionKey);
}).catch(error => {
    console.error('An error occurred:', error);
});