# DS18B20 Onewire Temperature Sensor

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/ianmetcalf/node-ds2482?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Provides an interface for Dallas DS18B20 temperature sensors over the DS2482 onewire bridge

# Install

```
$ npm install ds2482-temperature
```

# Usage

```js
const DS18B20 = require('ds2482-temperature');

const sense = new DS18B20();

sense.init()
.then(() => sense.search())
.then(() => sense.readTemperatures())

.then(temps => {
  console.log(temps); // Returns a list of temperature reading from all found sensors
})

.catch(err => {
  console.error(err);
});
```

# API

### new DS18B20([options])
Creates an interface for Dallas DS18B20 temperature sensors

__Options:__
- `wire` an instance of [wire](https://github.com/ianmetcalf/node-ds2482)
- `i2c` an instance of [i2c](https://github.com/kelly/node-i2c)
- `address` the i2c address of the bridge chip, default: `0x18`
- `device` the location of the i2c interface, default: `/dev/i2c-1`
- `units` the temperature units, default: `C`

---

### sense.init()
Resets the bridge chip and any onewire devices connected to it

__Returns:__ `Promise <Uint8>` resolves with DS2482 status register

---

### sense.search()
Searches the bus and returns a list of found temperature sensors

__Returns:__ `Promise <Array <Sensor>>` resolves with list of sensors

```js
[
  <Sensor "2826274402000012">,
  <Sensor "28493331020000bf">,
  <Sensor "280b135f020000d9">
]
```

---

### sense.readTemperatures()
Initiates a measurement and returns the temperature readings from all known sensors

__Returns:__ `Promise <Array {rom:String, value:Number, units:Sting}>` resolves with list of temperatures

```js
[
  {rom: "2826274402000012", value: 22.9375, units: "C"},
  {rom: "28493331020000bf", value: 22.875, units: "C"},
  {rom: "280b135f020000d9", value: 21.9375, units: "C"},
]
```

---

### new DS18B20.Sensor(rom [, options])
Creates a temperature sensor instance

__Arguments:__
- `rom` the ROM address of the sensor as a 16 character hex encoded string

__Options:__
- `wire` an instance of [wire](https://github.com/ianmetcalf/node-ds2482)
- `i2c` an instance of [i2c](https://github.com/kelly/node-i2c)
- `address` the i2c address of the bridge chip, default: `0x18`
- `device` the location of the i2c interface, default: `/dev/i2c-1`
- `units` the temperature units, default: `C`

---

### sensor.readTemperature()
Initiates a measurement and returns the temperature reading from a particular sensor

__Returns:__ `Promise <Number>` resolves with temperature

```js
22.9375
```
