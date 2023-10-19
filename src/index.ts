import express from 'express'
import usersRoute from './routes/users.routes'
import databaseService from './services/database.services'
const app = express()
app.use(express.json())
const PORT = 3000
databaseService.connect()

// route mặc định localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello world !')
})

app.use('/users', usersRoute) //localhost:3000/users/tweets

app.listen(PORT, () => {
  console.log(`Project twitter này đang chạy trên post ${PORT}`)
})
