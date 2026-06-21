import { jsonError, jsonResponse } from '../lib/response.js';

export function listDocuments(sb) {
  return async (req, res) => {
    try {
      const { jwt } = req.user;
      const data = await sb.query('documents', 'select=*&order=created_at.desc', jwt);
      return res.json(data);
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function uploadDocument(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const file = req.file;
      if (!file) {
        return jsonError(res, 'no file provided', 400);
      }

      const filePath = `${userId}/${Date.now()}_${file.originalname}`;
      await sb.storageUpload('tax-documents', filePath, file.buffer, file.mimetype, jwt);

      const doc = {
        user_id: userId,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_path: filePath,
        file_size: file.size,
        status: 'uploaded',
      };
      const result = await sb.insert('documents', doc, jwt);
      return res.json(result);
    } catch (error) {
      return jsonError(res, `upload failed: ${error.message}`, 500);
    }
  };
}

export function deleteDocument(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const docId = req.params.id;

      const doc = await sb.querySingle('documents', `select=file_path&id=eq.${docId}&user_id=eq.${userId}`, jwt);
      if (!doc) {
        return jsonError(res, 'document not found', 404);
      }

      await sb.storageDelete('tax-documents', [doc.file_path], jwt);
      await sb.delete('documents', `id=eq.${docId}&user_id=eq.${userId}`, jwt);

      return jsonResponse(res, { success: true });
    } catch (error) {
      return jsonError(res, error.message, 500);
    }
  };
}

export function analyzeDocument(sb) {
  return async (req, res) => {
    try {
      const { id: userId, jwt } = req.user;
      const docId = req.params.id;

      const doc = await sb.querySingle('documents', `select=*&id=eq.${docId}&user_id=eq.${userId}`, jwt);
      if (!doc) {
        return jsonError(res, 'document not found', 404);
      }

      const fileBytes = await sb.storageDownload('tax-documents', doc.file_path, jwt);
      let content;
      if ((doc.file_type || '').includes('text') || (doc.file_type || '').includes('csv')) {
        content = fileBytes.data.toString('utf8');
      } else {
        content = `[Binary file: ${doc.file_name}, type: ${doc.file_type}, size: ${doc.file_size} bytes]`;
      }

      const result = await sb.invokeEdgeFunction('analyze-document', {
        documentId: doc.id,
        fileContent: content,
        fileName: doc.file_name,
      }, jwt);

      return res.json(result);
    } catch (error) {
      return jsonError(res, `analysis failed: ${error.message}`, 500);
    }
  };
}
