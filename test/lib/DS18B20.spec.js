'use strict';

const expect = require('expect');
const DS18B20 = require('../../lib/DS18B20');

const i2c = {
  writeBytes() {},
  writeByte() {},
  readByte() {},
};

describe('DS18B20', function () {
  it('instantiates', function () {
    expect(new DS18B20({i2c})).toExist();
  });
});
