import express from 'express'
import usersRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import { MongoClient } from 'mongodb'
config()

const app = express()
initFolder()
app.use(express.json()) // express.json() dùng để express đọc đc req.body ở định dạng json
const PORT = process.env.PORT || 4000

databaseService.connect().then(() => {
  databaseService.indexUsers()
})

// route mặc định localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello world !')
})

app.use('/users', usersRoute) //localhost:3000/users/register
app.use('/medias', mediasRouter) //localhost:3000/users/register
// app.use('/static', express.static(UPLOAD_DIR))
app.use('/static', staticRouter)
// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

// app sử dụng 1 error handler tổng
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Project twitter này đang chạy trên post ${PORT}`)
})
