import express from 'express'
import { getNews, postNews, deleteNews, getPages, getGallery, getDocuments } from '../controllers/cmsController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/news', getNews)
router.post('/news', requireAuth, postNews)
router.delete('/news', requireAuth, deleteNews)

router.get('/pages', getPages)
router.get('/gallery', getGallery)
router.get('/documents', getDocuments)

export default router
