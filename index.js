var DS2482 = require('ds2482'),
  cmds = require('./commands');

var DS18B20 = {},
  devices = [],
  wire;

DS18B20.FAMILY = 0x28;

DS18B20.Device = function(rom) {
  this.rom = rom;
};

DS18B20.init = function(options, callback) {
  options = options || {};

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  wire = options.wire || new DS2482(options);

  wire.init(callback);
};



/*
 * Main API
 */

DS18B20.search = function(callback) {
  wire.searchByFamily(DS18B20.FAMILY, function(err, resp) {
    if (err) { return callback(err); }

    devices = resp.map(function(rom) {
      return new DS18B20.Device(rom);
    });

    callback(null, devices);
  });
};

DS18B20.startConversion = function(rom, callback) {
  wire.sendCommand(cmds.CONVERT_TEMP, rom, callback);
};

DS18B20.Device.prototype.startConversion = function(callback) {
  DS18B20.startConversion(this.rom, callback);
};

DS18B20.getPowerMode = function(rom, callback) {
  if (typeof rom === 'function') {
    callback = rom;
    rom = null;
  }

  wire.sendCommand(cmds.READ_POWER_SUPPLY, rom, function(err) {
    if (err) { return callback(err); }

    wire.bit(callback);
  });
};

DS18B20.Device.prototype.getPowerMode = function(callback) {
  DS18B20.getPowerMode(this.rom, callback);
};



/*
 * Scratchpad API
 */

DS18B20.SCRATCHPAD_SIZE = 9;

DS18B20.Device.prototype.writeScratchpad = function(scratchpad, callback) {
  wire.sendCommand(cmds.WRITE_SCRATCHPAD, this.rom, function(err) {
    if (err) { return callback(err); }

    wire.writeData( new Buffer([
      scratchpad.alarmHigh,
      scratchpad.alarmLow,
      scratchpad.config
    ]), callback);
  });
};

DS18B20.Device.prototype.readScratchpad = function(callback) {
  wire.sendCommand(cmds.READ_SCRATCHPAD, this.rom, function(err) {
    if (err) { return callback(err); }

    wire.readData(DS18B20.SCRATCHPAD_SIZE, function(err, buffer) {
      if (err) { return callback(err); }

      if (!DS2482.checkCRC(buffer)) {
        callback(new Error('CRC mismatch'));

      } else {
        callback(null, {
          temperature: buffer.readInt16LE(0) / 16,
          alarmHigh: buffer.readUInt8(2),
          alarmLow: buffer.readUInt8(3),
          config: buffer.readUInt8(4)
        });
      }
    });
  });
};

module.exports = DS18B20;
