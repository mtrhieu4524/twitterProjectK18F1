// giả sử đang làm route '/login'
// thì ng dùng sẽ truyền email và password
// tạo 1 cái req có body là email và password
// => làm 1 cái middleware kiểm tra xem email
//  và password có đc truyền lên hay kg ?

import { Request, Response, NextFunction } from 'express'
import { ParamSchema, check, checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'
import usersService from '~/services/users.services'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { verifyToken } from '~/utils/jwt'
import { capitalize } from 'lodash'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { TokenPayload } from '~/models/requests/User.request'
import { UserVerifyStatus } from '~/constants/enums'
/*
  => interface dùng để bổ nghĩa parameter mà mình có
*/

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      // returnScore: false
      // false : chỉ return true nếu password mạnh, false nếu k
      // true : return về chất lượng password(trên thang điểm 10)
    }
  },
  errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true, //nên đặt trim dưới này thay vì ở đầu
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true, //nên đặt trim dưới này thay vì ở đầu
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400
  }
}

// ======================================================================================================================

// import hết parameter || nếu không import thì sẽ sử dụng trong bộ fetch API
// khi đăng nhập thì sẽ đưa 1 req.body gồm email và password
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            // lưu thông tin của user vào req.body
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: false
            // false : chỉ return true nếu password mạnh, false nếu k
            // true : return về chất lượng password(trên thang điểm 10)
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

// ======================================================================================================================

// khi register thì ta sẽ có 1 req.body gồm
// {
//    name: string,
//    email: string,
//    password: string,
//    confirm_password: string,
//    date_of_birth: ISO8601
// }

// => validate bọc checkSchema để kiểm tra lỗi

// ======================================================================================================================

export const registerValidator = validate(
  // * bỏ checkSchema vào validate biến thành middleware vì hàm này trả ra middleware *
  checkSchema(
    {
      // checkSchema chỉ check [nếu có lỗi lưu vào trong req]
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistEmail = await usersService.checkEmailExist(value)
            if (isExistEmail) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

// ======================================================================================================================

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          //value là giá trị của Authorization, req là req của client gữi lên server
          options: async (value: string, { req }) => {
            //value của Authorization là chuỗi "Bearer <access_token>"
            //ta sẽ tách chuỗi đó ra để lấy access_token bằng cách split
            const access_token = value.split(' ')[1]
            //nếu nó có truyền lên , mà lại là chuỗi rỗng thì ta sẽ throw error
            if (!access_token) {
              //throw new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)  //này trả ra 422(k hay)
              // thì k hay, ta phải trả ra 401(UNAUTHORIZED)
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            /*
              nếu có access_token thì verify
              lấy ra decoded_authorization (payload), lưu vào req, để dùng dần
            */
            try {
              // 1. kiểm tra xem access_token có hợp lệ hay không - [verify accessToken có phải mình kí ra k]
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })

              //nếu không có lỗi thì ta lưu decoded_authorization vào req để khi nào muốn biết ai gữi req thì dùng
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              // 2. Nếu là của server tạo ra thì lưu lại payload
              throw new ErrorWithStatus({
                //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

// ======================================================================================================================

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          //verify giá trị của refresh_token xem có hợp lệ hay không, quá trình này có thể phát sinh lỗi
          //nếu không có lỗi thì lưu decoded_refresh_token vào req để khi nào muốn biết ai gữi req thì dùng
          //decoded_refresh_token có dạng như sau
          //{
          //  user_id: '64e3c037241604ad6184726c',
          //  token_type: 1,
          //  iat: 1693883172,
          //  exp: 1702523172
          //}
          options: async (value: string, { req }) => {
            try {
              // 1. kiểm tra xem refresh_token có hợp lệ hay không - [verify refreshToken có phải mình kí ra k]
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //nếu không có lỗi thì ta lưu decoded_refresh_token vào req để khi nào muốn biết ai gữi req thì dùng
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              // 2. Nếu là của server tạo ra thì lưu lại payload
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                  //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu lỗi kh phát sinh quá trình verify thì mình tạo thành lỗi có status
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

// ======================================================================================================================

export const emailVerifyValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // nếu email_verify_token k gửi lên thì response lỗi
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            // verify email_verify_token để lấy decoded_email_verify_token
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })

              // sau khi verify thành công ta đc payload của email_verify_token: decoded_email_verify_token
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              // 2. Nếu là của server tạo ra thì lưu lại payload
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                  //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu lỗi kh phát sinh quá trình verify thì mình tạo thành lỗi có status
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

// ======================================================================================================================

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          //tìm trong database xem có user nào sở hữu email = value của email người dùng gữi lên không
          const user = await databaseService.users.findOne({
            email: value
          })
          //nếu không tìm đc user thì nói user không tồn tại
          //khỏi tiến vào controller nữa
          if (user === null) {
            throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND }) //422
          }
          //đến đâu thì oke
          req.user = user // lưu user mới tìm đc lại luôn, khi nào cần thì xài
          return true
        }
      }
    }
  })
)

// ======================================================================================================================

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //nếu k truyền lên forgot_password_token thì ta sẽ throw error
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED //401
              })
            }

            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              //lưu decoded_forgot_password_token vào req để khi nào muốn biết ai gữi req thì dùng
              ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
              //dùng user_id trong decoded_forgot_password_token để tìm user trong database
              //sẽ nhanh hơn là dùng forgot_password_token(value) để tìm user trong database
              const { user_id } = decoded_forgot_password_token as TokenPayload
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })

              //nếu k tìm đc user thì throw error
              if (user === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
              //nếu forgot_password_token đã được sử dụng rồi thì throw error
              //forgot_password_token truyền lên khác với forgot_password_token trong database
              //nghĩa là người dùng đã sử dụng forgot_password_token này rồi
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INCORRECT,
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
              //trong messages.ts thêm   INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token'
            } catch (error) {
              // 2. Nếu là của server tạo ra thì lưu lại payload
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                  //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // nếu lỗi kh phát sinh quá trình verify thì mình tạo thành lỗi có status
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

// ======================================================================================================================

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

// ======================================================================================================================

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

// ======================================================================================================================

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true, //đc phép có hoặc k
        ...nameSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      date_of_birth: {
        optional: true, //đc phép có hoặc k
        ...dateOfBirthSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
        },
        trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      //giống bio
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      //giống location
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },

          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERS_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)
