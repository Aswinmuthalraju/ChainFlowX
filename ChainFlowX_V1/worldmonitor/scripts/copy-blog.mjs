import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicBlogDir = path.join(__dirname, '..', 'public', 'blog');
const distDir = path.join(__dirname, '..', 'blog-site', 'dist');

fs.rmSync(publicBlogDir, { recursive: true, force: true });
fs.mkdirSync(publicBlogDir, { recursive: true });
fs.cpSync(distDir, publicBlogDir, { recursive: true });
