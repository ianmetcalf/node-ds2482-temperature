'use strict';

const DS2482 = require('ds2482');
const cmds = require('./commands');

const FAMILY = 0x28;
const SCRATCHPAD_SIZE = 9;

class DS18B20 {
  constructor(options) {
    options = options || {};

    this.sensors = [];
    this.wire = options.wire || new DS2482(options);
  }

  init(callback) {
    this.wire.init(callback);
  }

  search(callback) {
    this.wire.searchByFamily(FAMILY, (err, resp) => {
      if (err) { return callback(err); }

      this.sensors = resp.map(rom => new DS18B20.Sensor(rom, {
        wire: this.wire,
      }));

      callback(null, this.sensors);
    });
  }

  read(callback) {
    const that = this;

    if (!this.sensors.length) {
      return callback(null, []);
    }

    this.startConversion(err => {
      if (err) { return callback(err); }

      function next(memo, sensor) {
        sensor.readScratchpad((err, resp) => {
          if (err) { return callback(err); }

          memo.push(resp.temperature);

          if (memo.length < that.sensors.length) {
            next(memo, that.sensors[memo.length]);
          } else {
            callback(null, memo);
          }
        });
      }

      next([], this.sensors[0]);
    });
  }

  startConversion(rom, callback) {
    DS18B20.startConversion(this.wire, rom, callback);
  }

  getPowerMode(rom, callback) {
    DS18B20.getPowerMode(this.wire, rom, callback);
  }

  writeScratchpad(rom, scratchpad, callback) {
    DS18B20.writeScratchpad(this.wire, rom, scratchpad, callback);
  }

  readScratchpad(rom, callback) {
    DS18B20.readScratchpad(this.wire, rom, callback);
  }

  static startConversion(wire, rom, callback) {
    wire.sendCommand(cmds.CONVERT_TEMP, rom, callback);
  }

  static getPowerMode(wire, rom, callback) {
    if (typeof rom === 'function') {
      callback = rom;
      rom = null;
    }

    wire.sendCommand(cmds.READ_POWER_SUPPLY, rom, err => {
      if (err) { return callback(err); }

      wire.bit(callback);
    });
  }

  static writeScratchpad(wire, rom, scratchpad, callback) {
    wire.sendCommand(cmds.WRITE_SCRATCHPAD, rom, err => {
      if (err) { return callback(err); }

      wire.writeData(Buffer.from([
        scratchpad.alarmHigh,
        scratchpad.alarmLow,
        scratchpad.config,
      ]), callback);
    });
  }

  static readScratchpad(wire, rom, callback) {
    wire.sendCommand(cmds.READ_SCRATCHPAD, rom, err => {
      if (err) { return callback(err); }

      wire.readData(SCRATCHPAD_SIZE, (err, buffer) => {
        if (err) { return callback(err); }

        if (!DS2482.checkCRC(buffer)) {
          callback(new Error('CRC mismatch'));
        } else {
          callback(null, {
            temperature: buffer.readInt16LE(0) / 16,
            alarmHigh: buffer.readUInt8(2),
            alarmLow: buffer.readUInt8(3),
            config: buffer.readUInt8(4),
          });
        }
      });
    });
  }
}

class Sensor {
  constructor(rom, options) {
    options = options || {};

    this.rom = rom;
    this.wire = options.wire || new DS2482(options);
  }

  read(callback) {
    this.startConversion(err => {
      if (err) { return callback(err); }

      this.readScratchpad((err, resp) => {
        if (err) { return callback(err); }

        callback(null, resp.temperature);
      });
    });
  }

  startConversion(callback) {
    DS18B20.startConversion(this.wire, this.rom, callback);
  }

  getPowerMode(callback) {
    DS18B20.getPowerMode(this.wire, this.rom, callback);
  }

  writeScratchpad(scratchpad, callback) {
    DS18B20.writeScratchpad(this.wire, this.rom, scratchpad, callback);
  }

  readScratchpad(callback) {
    DS18B20.readScratchpad(this.wire, this.rom, callback);
  }
}

Object.assign(DS18B20, {
  FAMILY,
  SCRATCHPAD_SIZE,
  Sensor,
});

module.exports = DS18B20;
