import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { config } from '../config.js';
import { ApiError } from '../utils/http.js';

const directory = path.resolve(process.cwd(), config.uploadDir);
fs.mkdirSync(directory, { recursive: true });
const accepted = new Set(['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
export const upload = multer({ storage: multer.diskStorage({ destination: directory, filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`) }), limits: { fileSize: config.maxUploadBytes, files: 5 }, fileFilter: (_req, file, cb) => accepted.has(file.mimetype) ? cb(null, true) : cb(new ApiError(400, 'Unsupported file type', 'INVALID_FILE_TYPE')) });
