import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import loginValidator, { registerValidator } from '~/middlewares/users.middlewares'
const usersRoute = Router()

usersRoute.get('/login', loginValidator, loginController)
usersRoute.post('/register', registerValidator, registerController)

export default usersRoute
