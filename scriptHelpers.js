//const exec = require('child_process').exec;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs').promises;
const path = require('path');

async function syncWithGitHub() {
    const packageData = await fs.readFile('package.json', 'utf8');
    const packageJSON = JSON.parse(packageData);
    const versionSegments = packageJSON.version.split('.');
    const newVersion = `${versionSegments[0]}.${versionSegments[1]}.${Number(versionSegments[2]) + 1}`;
    packageJSON.version = newVersion;
    fs.writeFile('package.json', JSON.stringify(packageJSON, undefined, 4));
    await exec('git add .');
    await exec(`git commit -m v${newVersion}`);
    await exec('git push origin main:main');
}

async function uploadConnector() {
    const configJSON = JSON.parse(await fs.readFile('src/config.json', 'utf8'));
    const descriptionEN = await fs.readFile('src/description.en.md', 'utf8');
    const envJSON = JSON.parse(await fs.readFile('.env.local', 'utf8'));
    const logo = await fs.readFile('src/logo.svg', 'utf8');
    const packageJSON = JSON.parse(await fs.readFile('package.json', 'utf8'));

    const formData = new FormData();
    formData.append('config', JSON.stringify({ ...configJSON, description: { en: descriptionEN }, logo, version: packageJSON.version }));
    const itemNames = await fs.readdir('dist');
    for (const itemName of itemNames) {
        const itemPath = path.join('dist', itemName);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) continue;
        const contentBlob = new Blob([await fs.readFile(itemPath, 'utf8')], { type: 'text/plain' });
        formData.append(itemName, contentBlob, itemName);
    }

    const url = `https://api-5ykjycpiha-ew.a.run.app/ping`;
    // const response = await fetch(url, { method: 'POST', headers: { Authorization: envJSON.DATAPOS_CONNECTOR_UPLOAD_TOKEN }, body: formData });
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(await response.text());
    console.log(await response.json());
}

module.exports = { syncWithGitHub, uploadConnector };
