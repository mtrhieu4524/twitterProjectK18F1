import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
//ở đây thường mình sẽ extend Error để nhận đc báo lỗi ở dòng nào

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any //muốn thêm bao nhiêu cũng đc
  }
>

// tạo ra class chuyên dùng để tạo ra lỗi có Status rõ ràng
export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

// EntityError thay thế cho ObjectError
export class EntityError extends ErrorWithStatus {
  errors: ErrorType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
