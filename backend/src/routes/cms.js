import express from 'express'
import {
  listNews,
  createNews,
  updateNews,
  deleteNews,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  listGallery,
  createGalleryEvent,
  addGalleryPhoto,
  deleteGalleryEvent,
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  enrollBeneficiaryInActivity,
  unenrollBeneficiaryFromActivity,
  listFormations,
  createFormation,
  updateFormation,
  deleteFormation,
  listFormationEnrollments,
  enrollBeneficiaryInFormation,
  updateFormationEnrollment,
  unenrollBeneficiaryFromFormation,
  generateCertificates,
} from '../controllers/cmsController.js'
import { requirePermission } from '../middleware/authMiddleware.js'

const router = express.Router()

// News (Actualités)
router.get('/news', listNews)
router.post('/news', requirePermission('manage_news'), createNews)
router.put('/news/:id', requirePermission('manage_news'), updateNews)
router.delete('/news/:id', requirePermission('manage_news'), deleteNews)

// Documents
router.get('/documents', listDocuments)
router.post('/documents', requirePermission('manage_documents'), createDocument)
router.put('/documents/:id', requirePermission('manage_documents'), updateDocument)
router.delete('/documents/:id', requirePermission('manage_documents'), deleteDocument)

// Gallery (événements + photos)
router.get('/gallery', listGallery)
router.post('/gallery', requirePermission('manage_gallery'), createGalleryEvent)
router.post('/gallery/:id/photos', requirePermission('manage_gallery'), addGalleryPhoto)
router.delete('/gallery/:id', requirePermission('manage_gallery'), deleteGalleryEvent)

// Activities + Pivot activite_beneficiaire
router.get('/activities', listActivities)
router.post('/activities', requirePermission('manage_activities'), createActivity)
router.put('/activities/:id', requirePermission('manage_activities'), updateActivity)
router.delete('/activities/:id', requirePermission('manage_activities'), deleteActivity)
router.post('/activities/:id/beneficiaries', requirePermission('manage_activities'), enrollBeneficiaryInActivity)
router.delete('/activities/:id/beneficiaries/:beneficiaryId', requirePermission('manage_activities'), unenrollBeneficiaryFromActivity)

// Formations + Pivot formation_beneficiaire
router.get('/formations', listFormations)
router.post('/formations', requirePermission('manage_formations'), createFormation)
router.put('/formations/:id', requirePermission('manage_formations'), updateFormation)
router.delete('/formations/:id', requirePermission('manage_formations'), deleteFormation)
router.get('/formations/:id/enrollments', requirePermission('manage_formations'), listFormationEnrollments)
router.post('/formations/:id/enrollments', requirePermission('manage_formations'), enrollBeneficiaryInFormation)
router.patch('/formations/:id/enrollments/:beneficiaryId', requirePermission('manage_formations'), updateFormationEnrollment)
router.delete('/formations/:id/enrollments/:beneficiaryId', requirePermission('manage_formations'), unenrollBeneficiaryFromFormation)
router.post('/formations/:id/certificates', requirePermission('manage_formations'), generateCertificates)

export default router
