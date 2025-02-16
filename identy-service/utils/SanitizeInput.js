// utils/sanitizeInput.js
import validator from 'validator';
import xss from 'xss';

export const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        data = data.trim();
        data = xss(data);
        data = validator.escape(data);
    } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = sanitizeInput(data[key]);
            }
        }
    }
    return data;
};