var DS2482 = require('ds2482'),
  cmds = require('./commands');



var DS18B20 = function(options) {
  options = options || {};

  this.sensors = [];
  this.wire = options.wire || new DS2482(options);
};

DS18B20.FAMILY = 0x28;

var Sensor = DS18B20.Sensor = function(rom, options) {
  options = options || {};

  this.rom = rom;
  this.wire = options.wire || new DS2482(options);
};



/*
 * Main API
 */

DS18B20.prototype.init = function(callback) {
  this.wire.init(callback);
};

DS18B20.prototype.search = function(callback) {
  var that = this;

  this.wire.searchByFamily(DS18B20.FAMILY, function(err, resp) {
    if (err) { return callback(err); }

    that.sensors = resp.map(function(rom) {
      return new Sensor(rom, {wire: that.wire});
    });

    callback(null, that.sensors);
  });
};

DS18B20.prototype.read = function(callback) {
  var that = this;

  if (!this.sensors.length) {
    return callback(null, []);
  }

  this.startConversion(function(err) {
    if (err) { return callback(err); }

    function next(memo, sensor) {
      sensor.readScratchpad(function(err, resp) {
        if (err) { return callback(err); }

        memo.push(resp.temperature);

        if (memo.length < that.sensors.length) {
          next(memo, that.sensors[memo.length]);

        } else {
          callback(null, memo);
        }
      });
    }

    next([], that.sensors[0]);
  });
};

DS18B20.prototype.startConversion = function(rom, callback) {
  this.wire.sendCommand(cmds.CONVERT_TEMP, rom, callback);
};

DS18B20.prototype.getPowerMode = function(rom, callback) {
  var that = this;

  if (typeof rom === 'function') {
    callback = rom;
    rom = null;
  }

  this.wire.sendCommand(cmds.READ_POWER_SUPPLY, rom, function(err) {
    if (err) { return callback(err); }

    that.wire.bit(callback);
  });
};



/*
 * Sensor API
 */

Sensor.prototype.read = function(callback) {
  var that = this;

  this.startConversion(function(err) {
    if (err) { return callback(err); }

    that.readScratchpad(function(err, resp) {
      if (err) { return callback(err); }

      callback(null, resp.temperature);
    });
  });
};

Sensor.prototype.startConversion = function(callback) {
  DS18B20.prototype.startConversion.call(this, this.rom, callback);
};

Sensor.prototype.getPowerMode = function(callback) {
  DS18B20.prototype.getPowerMode.call(this, this.rom, callback);
};



/*
 * Scratchpad API
 */

DS18B20.SCRATCHPAD_SIZE = 9;

Sensor.prototype.writeScratchpad = function(scratchpad, callback) {
  var that = this;

  this.wire.sendCommand(cmds.WRITE_SCRATCHPAD, this.rom, function(err) {
    if (err) { return callback(err); }

    that.wire.writeData( new Buffer([
      scratchpad.alarmHigh,
      scratchpad.alarmLow,
      scratchpad.config
    ]), callback);
  });
};

Sensor.prototype.readScratchpad = function(callback) {
  var that = this;

  this.wire.sendCommand(cmds.READ_SCRATCHPAD, this.rom, function(err) {
    if (err) { return callback(err); }

    that.wire.readData(DS18B20.SCRATCHPAD_SIZE, function(err, buffer) {
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
