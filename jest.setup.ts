import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView — provide a no-op implementation
window.HTMLElement.prototype.scrollIntoView = jest.fn();
