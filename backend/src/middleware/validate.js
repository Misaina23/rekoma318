import Joi from 'joi'
import createError from 'http-errors'

export default function validate(schema) {
  return (req, res, next) => {
    const data = req.method === 'GET' ? req.query : req.body
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true })
    if (error) {
      const details = error.details.map((d) => d.message)
      const err = createError(400, details.join(', '))
      err.details = details
      return next(err)
    }
    if (req.method === 'GET') req.query = value
    else req.body = value
    next()
  }
}
