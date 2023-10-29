import { defaultErrorHandler } from './../middlewares/error.middlewares'
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// => Hàm validate nhận 1 cái checkSchema và biến cụm đó thành middleware
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  // => RunnableValidationChains<ValidationChain> là định nghĩa của checkSchema

  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    // *** Hàm "run" trả ra Promise phải đợi nên phải dùng "AWAIT" ***

    /*
      Vì kh phải mảng mà là checkSchema nên chỉ cần .run(req) chạy 
        kh cần phòng for

    ** => Hành động này có nghĩa là đi qua từng cái check và lấy lối ra và lưu lỗi vào req [NHỚ CÁI NẢY] **
    */

    const errors = validationResult(req)

    if (errors.isEmpty()) {
      return next()
    }

    const errorObject = errors.mapped()
    /*
      mapped() biến lỗi đẹp hơn
    */

    // XỬ lý errorObject
    const entityError = new EntityError({ errors: {} })

    for (const key in errorObject) {
      // Đi qua từng lỗi và lấy msg
      const { msg } = errorObject[key]
      // nếu lỗi đặc biệt do mình tạo ra khác 422 thì mình next cho defaultErrorHandler
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }

      // nếu kg phải lỗi đặc biệt thì chắc chắn là lỗi 422
      // thì mình lưu vào entityError
      entityError.errors[key] = msg
    }

    // sau khi mình duyệt xong thì ném cho defaultErrorHandler xử lí
    next(entityError)
    //  ** => Đưa entityError cho default xử lí [bằng next] **
  }
}
