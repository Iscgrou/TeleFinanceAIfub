import { Router } from 'express';
import { storage } from '../storage';
import { insertInvoiceTemplateSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all invoice templates
router.get('/', async (req, res) => {
  try {
    const templates = await storage.getInvoiceTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching invoice templates:', error);
    res.status(500).json({ error: 'Failed to fetch invoice templates' });
  }
});

// Get active invoice template
router.get('/active', async (req, res) => {
  try {
    const template = await storage.getActiveInvoiceTemplate();
    res.json({ template });
  } catch (error) {
    console.error('Error fetching active template:', error);
    res.status(500).json({ error: 'Failed to fetch active template' });
  }
});

// Get invoice template by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const template = await storage.getInvoiceTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new invoice template
router.post('/', async (req, res) => {
  try {
    const validatedData = insertInvoiceTemplateSchema.parse(req.body);
    const template = await storage.createInvoiceTemplate(validatedData);
    res.status(201).json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update invoice template
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const validatedData = insertInvoiceTemplateSchema.partial().parse(req.body);
    const template = await storage.updateInvoiceTemplate(id, validatedData);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Set active template
router.post('/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const success = await storage.setActiveInvoiceTemplate(id);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, message: 'Template activated successfully' });
  } catch (error) {
    console.error('Error activating template:', error);
    res.status(500).json({ error: 'Failed to activate template' });
  }
});

// Delete invoice template
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const success = await storage.deleteInvoiceTemplate(id);
    if (!success) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;