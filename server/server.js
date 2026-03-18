import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js' 
import { stripeWebhooks } from './controllers/webhook.js'


const app = express()

await connectDB()

app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

//middleware
app.use(cors())
app.use(express.json()) 

//routes
app.get('/', (req, res)=> res.send('Server is Live!'))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter) 
app.use('/api/credit', creditRouter)


const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log(`Server is Running on port ${PORT}`);
})