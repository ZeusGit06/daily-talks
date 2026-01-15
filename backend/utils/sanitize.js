const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

// Create a DOM environment for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// A more standard and secure DOMPurify configuration
const sanitize = (dirty) => {
  return purify.sanitize(dirty);
};

module.exports = sanitize;
