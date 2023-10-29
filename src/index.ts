import express, { Request, Response, NextFunction } from 'express'
import usersRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
app.use(express.json()) // express.json() dùng để express đọc đc req.body ở định dạng json
const PORT = 3000
databaseService.connect()

// route mặc định localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello world !')
})

app.use('/users', usersRoute) //localhost:3000/users/register

// app sử dụng 1 error handler tổng
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Project twitter này đang chạy trên post ${PORT}`)
})
