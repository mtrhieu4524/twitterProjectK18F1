import { Router } from 'express'
import {
  emailVerifyController,
  loginController,
  logoutController,
  registerController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyValidator,
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

/*
        --- DESCRIPTION ---
            Verify Email
  - Khi ng dùng đăng kí, trong email của họ sẽ có 1 link
  trong link này đã setup sẵn 1 req kèm email_verify_token
  thì verify email là cái route cho req đó
  - method: POST
  - path: /users/verify-email
  - body: {email_verify_token: string}
*/
usersRoute.post('/verify-email', emailVerifyValidator, wrapAsync(emailVerifyController))
export default usersRoute
