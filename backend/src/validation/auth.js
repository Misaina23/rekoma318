import Joi from 'joi'

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().optional(),
  role: Joi.string().valid('ADMIN', 'USER', 'PRODUCTEUR').optional(),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
})
