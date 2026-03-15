module.exports = { async segment(inputPath) { return { success: true, foregroundPath: inputPath, alphaMaskPath: null, message: 'Mock segmentation returns source image directly' }; } };
