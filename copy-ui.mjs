import fs from 'fs';
import path from 'path';

const sourceDir = 'e:/Project/umkm-marketplace/New UI';
const targetDir = 'e:/Project/umkm-marketplace/frontend/src';

const uiComponentsDir = path.join(targetDir, 'components/ui');
const customComponentsDir = path.join(targetDir, 'components/new-ui');
const pagesDir = path.join(targetDir, 'pages/new-ui');

[uiComponentsDir, customComponentsDir, pagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const pages = ['Index.tsx', 'Login.tsx', 'Register.tsx', 'Products.tsx', 'ProductDetail.tsx', 'NotFound.tsx'];
const customComponents = ['Navbar.tsx', 'Footer.tsx', 'ProductCard.tsx', 'NavLink.tsx'];

const files = fs.readdirSync(sourceDir);

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  if (fs.statSync(sourcePath).isFile() && file.endsWith('.tsx') && file !== 'App.tsx' && file !== 'main.tsx') {
    let destPath;
    if (pages.includes(file)) {
      destPath = path.join(pagesDir, file);
    } else if (customComponents.includes(file)) {
      destPath = path.join(customComponentsDir, file);
    } else if (/^[a-z]/.test(file)) { // shadcn ui components
      destPath = path.join(uiComponentsDir, file.replace('.tsx', '.jsx')); // actually frontend uses jsx/tsx mix? frontend has jsx currently, wait, new UI is tsx. Let's keep it as tsx.
      destPath = path.join(uiComponentsDir, file);
    }
    
    if (destPath) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to ${destPath}`);
    }
  }
});

fs.copyFileSync(path.join(sourceDir, 'index.css'), path.join(targetDir, 'new-ui-index.css'));
fs.copyFileSync(path.join(sourceDir, 'tailwind.config.ts'), path.join(targetDir, '../new-ui-tailwind.config.ts'));
console.log("Finished copying CSS and Tailwind Config");
