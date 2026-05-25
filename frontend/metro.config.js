// metro.config.js — suppress known React Native Web warnings
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve web-specific module aliases
config.resolver.sourceExts = [...config.resolver.sourceExts];

module.exports = config;
