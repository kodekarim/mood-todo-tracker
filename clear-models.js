#!/usr/bin/env node

/**
 * Model Cache Cleaner for Daily Tracker
 * 
 * This script helps clear WebLLM model caches and sets up local model storage.
 * Run this script to clean up any previously downloaded models.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Daily Tracker - Model Cache Cleaner');
console.log('=====================================');

// Create models directory in project root
const modelsDir = path.join(__dirname, 'models');

try {
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
        console.log('✅ Created models directory:', modelsDir);
    } else {
        console.log('📁 Models directory already exists:', modelsDir);
    }
    
    // Create a .gitignore for the models directory
    const gitignorePath = path.join(modelsDir, '.gitignore');
    const gitignoreContent = `# Ignore all model files (they're large)
*
!.gitignore
`;
    
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore in models directory');
    
    // Create a README for the models directory
    const readmePath = path.join(modelsDir, 'README.md');
    const readmeContent = `# Models Directory

This directory will contain downloaded AI models for the Daily Tracker app.

## Note
- Models are typically 1-4GB in size
- They are automatically downloaded when you select them in the app
- This directory is ignored by git to avoid committing large files
- You can safely delete this directory to free up space - models will be re-downloaded as needed

## Current Storage
- Check the size of this directory to see how much space models are using
- Use the "Clear All Models" button in the app to clean up old models
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Created README.md in models directory');
    
} catch (error) {
    console.error('❌ Error setting up models directory:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Open your browser and navigate to your Daily Tracker app');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Application/Storage tab');
console.log('4. Clear the following:');
console.log('   - Cache Storage (all entries)');
console.log('   - IndexedDB (all databases)');
console.log('   - Local Storage (model-related entries)');
console.log('5. Or use the "Clear All Models" button in the app settings');
console.log('\n🎉 Your model cache will be clean and ready for fresh downloads!');
