import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'

class UsersService {
  async checkEmailExist(email: string) {
    // vào database tìm user có email này
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
    // * boolean ép kiểu obj = true || null = false *
  }

  // ======================================================================================================================

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        /* 
            * trong payload có dob sẵn * 
        => nên xuống dưới ép kiểu nó
        */
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        // => ép kiểu date_of_birth về kiểu ng dùng truyền lên

        password: hashPassword(payload.password)
      })
    )
    // từ user_id tạo ra 1 access token và 1 refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())

    // ** lưu refresh_token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    // Giả lập gửi mail_verify_token này cho user
    console.log(email_verify_token)

    return { access_token, refresh_token }
  }

  // ======================================================================================================================

  async login(user_id: string) {
    // dùng cái user_id đó tạo access và refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    //return 2 token cho controller

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    return { access_token, refresh_token }
  }

  // ======================================================================================================================

  async logout(refresh_token: string) {
    // dùng refresh_token tìm và xóa
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
  // ======================================================================================================================

  async verifyEmail(user_id: string) {
    // tạo access và refresh_token và lưu refresh_token vào database
    // Đồng thời tìm user và update lại email verifyToken thành "", verify:1, updateAt
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
          // tìm user thông qua user_id
        },
        [
          // để ngoặc vuông để k bị bug
          {
            $set: {
              email_verify_token: '',
              verify: UserVerifyStatus.Verified, // 1
              updated_at: '$$NOW' // lấy tgian lúc đưa lên
            }
          }
        ]
      )
    ])

    //destructuring token
    const [access_token, refresh_token] = token
    // lưu refresh token vào database
    await databaseService.refreshTokens.insertOne(new RefreshToken({ token: refresh_token, user_id: new ObjectId() }))
    return { access_token, refresh_token }
  }

  // ======================================================================================================================

  /*
      Hàm nhận vào user_id và bỏ vào payload để tạo access và refresh_token
  */
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRED_IN
      }
    })
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRED_IN
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([
      // Promise.all để chạy song song 2 cái
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerificationToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN
      }
    })
  }
}

const usersService = new UsersService()
export default usersService
