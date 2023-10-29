import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRoute = Router()

usersRoute.get('/login', loginValidator, wrapAsync(loginController))

usersRoute.post('/register', registerValidator, wrapAsync(registerController))

/*
        --- DESCRIPTION ---
            Đăng xuất
    path: /users/logout
    method: POST
    header: (Authorization: "Bearer <access_token>")
    body: (refresh_token: string)
*/
usersRoute.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

export default usersRoute
