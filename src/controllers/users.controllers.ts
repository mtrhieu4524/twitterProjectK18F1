import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LogoutReqBody, RegisterReqBody } from '~/models/requests/User.request'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'

export const loginController = async (req: Request, res: Response) => {
  // vào req lấy user ra, và lấy _id của user đó
  const user = req.user as User
  const user_id = user._id as ObjectId

  // * id lấy từ trên mongoDB xuống nên là phải toString() *

  // dùng cái user_id đó tạo access và refresh_token
  const result = await usersService.login(user_id.toString())
  // nếu k bug j thì thành công lun
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

// ======================================================================================================================

// ** req đc định nghĩa của interface RegisterReqBody bên "User.request.ts" **
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  // tạo 1 user mới và bỏ vào collection users trong database
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

// ======================================================================================================================

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  // lấy refresh_token từ body
  const refresh_token = req.body.refresh_token as string
  //gọi hàm logout, hàm nhận vào refresh_token tìm và xóa
  const result = await usersService.logout(refresh_token)
  res.json(result)
}
