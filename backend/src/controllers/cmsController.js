import Joi from 'joi'
import { readCms, writeCms } from '../utils/cmsStore.js'

const newsItemSchema = Joi.object({
  id: Joi.string().required(),
  date: Joi.string().required(),
  title: Joi.object().min(1).required(),
  excerpt: Joi.object().min(1).required(),
  tag: Joi.object().min(1).required(),
  image: Joi.string().optional(),
})

export function getNews(req, res) {
  const data = readCms()
  res.json(data.cms?.news ?? [])
}

export function postNews(req, res) {
  const body = req.body
  if (!body) return res.status(400).json({ success: false, error: 'Invalid payload' })
  const data = readCms()
  data.cms = data.cms ?? {}

  if (Array.isArray(body)) {
    const { error, value } = Joi.array().items(newsItemSchema).validate(body, { abortEarly: false })
    if (error) return res.status(400).json({ success: false, error: 'Validation failed', details: error.details.map(d=>d.message) })
    data.cms.news = value
  } else {
    const { error, value } = newsItemSchema.validate(body)
    if (error) return res.status(400).json({ success: false, error: 'Validation failed', details: error.details.map(d=>d.message) })
    data.cms.news = [...(data.cms.news ?? []).filter((item) => item.id !== value.id), value]
  }

  writeCms(data)
  res.json({ success: true })
}

export function deleteNews(req, res) {
  const { id } = req.body || {}
  if (!id) return res.status(400).json({ success: false, error: 'Invalid payload' })
  const data = readCms()
  data.cms = data.cms ?? {}
  data.cms.news = (data.cms.news ?? []).filter((item) => item.id !== id)
  writeCms(data)
  res.json({ success: true })
}

export function getPages(req, res) {
  const data = readCms()
  res.json(data.cms?.pages ?? [])
}

export function getGallery(req, res) {
  const data = readCms()
  res.json(data.cms?.gallery ?? [])
}

export function getDocuments(req, res) {
  const data = readCms()
  res.json(data.cms?.documents ?? [])
}
