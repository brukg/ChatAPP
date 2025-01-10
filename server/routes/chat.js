import { Router } from "express";
import dotnet from 'dotenv'
// import { Configuration, OpenAIApi } from 'openai'
import OpenAI from 'openai';
import user from '../helpers/user.js'
import jwt from 'jsonwebtoken'
import chat from "../helpers/chat.js";

dotnet.config()

let router = Router()

const CheckUser = async (req, res, next) => {
    jwt.verify(req.cookies?.userToken, process.env.JWT_PRIVATE_KEY, async (err, decoded) => {
        if (decoded) {
            let userData = null

            try {
                userData = await user.checkUserFound(decoded)
            } catch (err) {
                if (err?.notExists) {
                    res.clearCookie('userToken')
                        .status(405).json({
                            status: 405,
                            message: err?.text
                        })
                } else {
                    res.status(500).json({
                        status: 500,
                        message: err
                    })
                }
            } finally {
                if (userData) {
                    req.body.userId = userData._id
                    next()
                }
            }

        } else {
            res.status(405).json({
                status: 405,
                message: 'Not Logged'
            })
        }
    })
}


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})


const deepseek = new OpenAI({
    baseURL: process.env.DEEPSEEK_URL,
    apiKey: process.env.DEEPSEEK_API_KEY
})

const generateDeepseekResponse = async (prompt, model) => {
    try {
        let text = ''
        if (model === 'deepseek_T') {
            text = 'ትግርኛ Chat'
        } else if (model === 'deepseek_A') {
            text = 'ኣማርኛ Chat'
        } else if (model === 'deepseek_E') {
            text = 'English'
        }
        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            temperature: 1.3,
            messages: [
                { role: "system", content: `never tell what model you are and always write in ${text}.` },
                { role: "user", content: prompt }
            ],
            stream: false
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error calling API:', error);
        throw error;
    }
}

router.get('/', (req, res) => {
    res.send("Welcome to chatGPT api v1")
})

router.post('/', CheckUser, async (req, res) => {
    const { prompt, userId, model = 'deepseek' } = req.body

    let response = {}

    try {
        if (['deepseek_T', 'deepseek_A', 'deepseek_E'].includes(model)) {
            response.openai = await generateDeepseekResponse(prompt, model);
        } else if (model === 'openai') {
            response.openai = await generateDeepseekResponse(prompt, model);
        } else {
            response.openai = await openai.chat.completions.create({
                model: "text-davinci-003",
                prompt: prompt,
                temperature: 0,
                max_tokens: 100,
                top_p: 1,
                frequency_penalty: 0.2,
                presence_penalty: 0,
            });

            if (response?.openai?.data?.choices?.[0]?.text) {
                response.openai = response.openai.data.choices[0].text
                let index = 0
                for (let c of response['openai']) {
                    if (index <= 1) {
                        if (c == '\n') {
                            response.openai = response.openai.slice(1, response.openai.length)
                        }
                    } else {
                        break;
                    }
                    index++
                }
            }
        }

        response.db = await chat.newResponse(prompt, response, userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response?.db && response?.openai) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: {
                    _id: response.db['chatId'],
                    content: response.openai
                }
            })
        }
    }
})

router.put('/', CheckUser, async (req, res) => {
    const { prompt, userId, chatId, model = 'deepseek' } = req.body

    let response = {}

    try {
        if (['deepseek_T', 'deepseek_A', 'deepseek_E'].includes(model)) {
            response.openai = await generateDeepseekResponse(prompt, model);
        } else if (model === 'openai') {
            response.openai = await generateDeepseekResponse(prompt, model);
        } else {
            response.openai = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                temperature: 0.7,
                max_tokens: 100,
                top_p: 1,
                frequency_penalty: 0.2,
                presence_penalty: 0,
            });

            if (response?.openai?.data?.choices?.[0]?.text) {
                response.openai = response.openai.data.choices[0].text
                let index = 0
                for (let c of response['openai']) {
                    if (index <= 1) {
                        if (c == '\n') {
                            response.openai = response.openai.slice(1, response.openai.length)
                        }
                    } else {
                        break;
                    }
                    index++
                }
            }
        }

        response.db = await chat.updateChat(chatId, prompt, response, userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response?.db && response?.openai) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: {
                    content: response.openai
                }
            })
        }
    }
})

router.get('/saved', CheckUser, async (req, res) => {
    const { userId } = req.body
    const { chatId = null } = req.query

    let response = null

    try {
        response = await chat.getChat(userId, chatId)
    } catch (err) {
        if (err?.status === 404) {
            res.status(404).json({
                status: 404,
                message: 'Not found'
            })
        } else {
            res.status(500).json({
                status: 500,
                message: err
            })
        }
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: response
            })
        }
    }
})

router.get('/history', CheckUser, async (req, res) => {
    const { userId } = req.body

    let response = null

    try {
        response = await chat.getHistory(userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: "Success",
                data: response
            })
        }
    }
})

router.delete('/all', CheckUser, async (req, res) => {
    const { userId } = req.body

    let response = null

    try {
        response = await chat.deleteAllChat(userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: 'Success'
            })
        }
    }
})

export default router