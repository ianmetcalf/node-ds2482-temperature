'use strict';

exports.convertUnits = (value, units) => (
  /^f/i.test(units) ? (value * 1.8) + 32 : value
);
