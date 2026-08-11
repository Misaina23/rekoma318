import Joi from 'joi'

export const createProducteurSchema = Joi.object({
  nom: Joi.string().min(1).required(),
  description: Joi.string().allow(null, '').optional(),
})

export const updateProducteurSchema = Joi.object({
  nom: Joi.string().min(1).optional(),
  description: Joi.string().allow(null, '').optional(),
  actif: Joi.boolean().optional(),
})
