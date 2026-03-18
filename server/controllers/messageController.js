import imagekit from "../configs/imageKit.js"
import Chat from "../models/Chat.js"
import Usre from "../models/User.js"
import axios from 'axios'
import openai from '../configs/openai.js'


//AI chat message controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        //check credits
        if(req.user.credits < 1){
            return res.json({success: false, message: "You don't have anough credits to use this festure"})
        }

        const {chatId, prompt} = req.body

        const chat = await Chat.findOne({userId, _id: chatId})
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})

        const {choices} = await openai.chat.completions.create({
                model: "gemini-3-flash-preview",
                messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = {...choices[0].message, timestamp: Date.now(), isImage: false}
        res.json({success: true, reply})

        chat.messages.push(reply)
        await chat.save()
        await Usre.updateOne({_id: userId}, {$inc: {credits: -1}})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
 
//image jeneration message controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        //check credits
        if(req.user.credits < 2){
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }

        const {prompt, chatId, isPublished} = req.body
        //chat
        const chat = await Chat.findOne({userId, _id: chatId})

        //message
        chat.messages.push({
            role: "user", 
            content: prompt, 
            timestamp: Date.now(), 
            isImage: false
        });

        const encodedPrompt = encodeURIComponent(prompt)

        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}
        /ChatGPT/${Date.now()}.png?tr=w-800,h-800`

        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: "arraybuffer"})

        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data,"binary")
        .toString('base64')}`

        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "ChatGPT"
        })

        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished
        }

        res.json({success: true, reply})

        chat.messages.push(reply)
        await chat.save()

        await Usre.updateOne({_id: userId}, {$inc: {credits: -2}})
      

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}