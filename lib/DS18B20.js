'use strict';

const DS2482 = require('ds2482');
const ReadableStream = require('readable-stream');
const cmds = require('./commands');
const utils = require('./utils');

const FAMILY = 0x28;
const SCRATCHPAD_SIZE = 9;
const DEFAULT_POLL_RATE = 30; // seconds

class DS18B20 extends ReadableStream {
  constructor(options) {
    super({objectMode: true});

    // eslint-disable-next-line no-param-reassign
    options = options || {};

    this.wire = options.wire || new DS2482(options);
    this.units = /^f/i.test(options.units) ? 'F' : 'C';

    this.sensors = [];

    this._read = utils.asyncThrottle(() => {
      if (this._destroyed) return Promise.reject();

      return Promise.resolve(this.sensors.length || this.search())
      .then(() => this.readTemperatures())
      .then(values => {
        if (!this._destroyed) {
          for (let i = 0; i < values.length; i += 1) {
            if (!this.push(values[i])) break;
          }
        }
      })
      .catch(err => {
        this.emit('error', err);
      });
    }, (options.pollRate || DEFAULT_POLL_RATE) * 1000);
  }

  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._read.cancel();
      this.emit('close');
    }
  }

  init() {
    return this.wire.init();
  }

  search() {
    return this.wire.searchByFamily(FAMILY)
    .then(resp => {
      this.sensors = resp.map(rom => new DS18B20.Sensor(rom, {
        wire: this.wire,
        units: this.units,
      }));

      return this.sensors;
    });
  }

  readTemperatures() {
    const sensors = this.sensors.slice();
    const values = [];

    if (!sensors.length) {
      return Promise.resolve(values);
    }

    const readNextSensor = () => {
      const sensor = sensors[values.length];

      return sensor.readScratchpad()
      .then(resp => {
        values.push({
          rom: sensor.rom,
          value: utils.convertUnits(resp.temperature, this.units),
          units: this.units,
        });

        if (values.length < sensors.length) {
          return readNextSensor();
        }

        return values;
      });
    };

    return this.startConversion()
    .then(() => readNextSensor());
  }

  startConversion(rom) {
    return DS18B20.startConversion(this.wire, rom);
  }

  getPowerMode(rom) {
    return DS18B20.getPowerMode(this.wire, rom);
  }

  writeScratchpad(rom, scratchpad) {
    return DS18B20.writeScratchpad(this.wire, rom, scratchpad);
  }

  readScratchpad(rom) {
    return DS18B20.readScratchpad(this.wire, rom);
  }

  static startConversion(wire, rom) {
    return wire.sendCommand(cmds.CONVERT_TEMP, rom);
  }

  static getPowerMode(wire, rom) {
    return wire.sendCommand(cmds.READ_POWER_SUPPLY, rom)
    .then(() => wire.bit());
  }

  static writeScratchpad(wire, rom, scratchpad) {
    const buffer = Buffer.from([
      scratchpad.alarmHigh || 0,
      scratchpad.alarmLow || 0,
      scratchpad.config || 0,
    ]);

    return wire.sendCommand(cmds.WRITE_SCRATCHPAD, rom)
    .then(() => wire.writeData(buffer));
  }

  static readScratchpad(wire, rom) {
    return wire.sendCommand(cmds.READ_SCRATCHPAD, rom)
    .then(() => wire.readData(SCRATCHPAD_SIZE))
    .then(buffer => {
      if (!DS2482.checkCRC(buffer)) {
        throw new Error('CRC mismatch');
      }

      return {
        temperature: buffer.readInt16LE(0) / 16,
        alarmHigh: buffer.readUInt8(2),
        alarmLow: buffer.readUInt8(3),
        config: buffer.readUInt8(4),
      };
    });
  }
}

class Sensor extends ReadableStream {
  constructor(rom, options) {
    super({objectMode: true});

    // eslint-disable-next-line no-param-reassign
    options = options || {};

    this.rom = rom;

    this.wire = options.wire || new DS2482(options);
    this.units = /^f/i.test(options.units) ? 'F' : 'C';

    this._read = utils.asyncThrottle(() => {
      if (this._destroyed) return Promise.reject();

      return this.readTemperature()
      .then(value => {
        if (!this._destroyed) {
          this.push(value);
        }
      })
      .catch(err => {
        this.emit('error', err);
      });
    }, (options.pollRate || DEFAULT_POLL_RATE) * 1000);
  }

  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._read.cancel();
      this.emit('close');
    }
  }

  readTemperature() {
    return this.startConversion()
    .then(() => this.readScratchpad())
    .then(resp => (
      utils.convertUnits(resp.temperature, this.units)
    ));
  }

  startConversion() {
    return DS18B20.startConversion(this.wire, this.rom);
  }

  getPowerMode() {
    return DS18B20.getPowerMode(this.wire, this.rom);
  }

  writeScratchpad(scratchpad) {
    return DS18B20.writeScratchpad(this.wire, this.rom, scratchpad);
  }

  readScratchpad() {
    return DS18B20.readScratchpad(this.wire, this.rom);
  }
}

Object.assign(DS18B20, {
  FAMILY,
  SCRATCHPAD_SIZE,
  Sensor,
});

module.exports = DS18B20;
