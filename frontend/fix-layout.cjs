const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        if (file === 'new-ui' || file === 'layout') return; // skip new UI components and layout directories
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('e:/Project/umkm-marketplace/frontend/src/pages');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('<Layout') || content.includes('import Layout from')) {
        content = content.replace(/import Layout from ['"].*?layout\/Layout['"];?\r?\n?/g, '');
        content = content.replace(/<Layout>/g, '<>');
        content = content.replace(/<\/Layout>/g, '</>');
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log('Modified:', file);
    }
});

console.log('Total files modified:', modifiedCount);
