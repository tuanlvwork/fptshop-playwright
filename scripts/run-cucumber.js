const { spawn } = require('child_process');

// Parse args passed to this script (which will be passed to cucumber-js)
const args = process.argv.slice(2);
let tagsForEnv = '';

// Find tags in arguments to set as environment variable
const tagsIndex = args.indexOf('--tags');
if (tagsIndex !== -1 && args[tagsIndex + 1]) {
    tagsForEnv = args[tagsIndex + 1].replace(/^['"]|['"]$/g, '');
} else {
    const directTags = args.find(a => a.startsWith('--tags='));
    if (directTags) {
        tagsForEnv = directTags.split('=')[1].replace(/^['"]|['"]$/g, '');
    }
}

if (tagsForEnv) {
    console.log(`🏷️  Detected tags: ${tagsForEnv}`);
}

// Spawn cucumber-js with the same arguments
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['cucumber-js', ...args], {
    stdio: 'inherit',
    env: {
        ...process.env,
        // Pass tags to worker processes via environment variable
        ALLURE_TAGS: tagsForEnv || process.env.TAGS || 'None'
    }
});

child.on('close', (code) => {
    process.exit(code);
});
