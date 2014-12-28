# DS18B20 Onewire Temperature Sensor

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/ianmetcalf/node-ds2482?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Provides an interface for the Dallas DS18B20 temperature sensor over the DS2482 onewire bridge

# Install

```
$ npm install ds2482-temperature
```

# Usage

```js
var DS18B20 = require('ds2482-temperature');

var sense = new DS18B20();

sense.init(function(err) {
  if (err) { throw err; }
  
  sense.search(function(err, sensors) {
    if (err) { throw err; }
    
    sense.read(function(err, resp) {
      if (err) { throw err; }
      
      console.log(resp); // Returns a list of temperature reading from all found sensors
    });
  });
});
```

# API

### new DS18B20([options])
Creates an interface for Dallas DS18B20 temperature sensors

- `options.wire` an instance of [wire](https://github.com/ianmetcalf/node-ds2482)

### new DS18B20.Sensor(rom [, options])
Creates a temperature sensor instance

- `rom` the ROM address of the sensor as a 16 character hex encoded string
- `options.wire` an instance of [wire](https://github.com/ianmetcalf/node-ds2482)

### sense.init(callback)
Resets the bridge chip and any onewire devices connected to it

### sense.search(callback)
Searches the bus and returns a list of found temperature sensors

```js
[
  <Sensor "2826274402000012">,
  <Sensor "28493331020000bf">,
  <Sensor "280b135f020000d9">
]
```

### sense.read(callback)
Initiates a measurement and returns the temperature readings from all known sensors in celsius

__NOTE:__ Will only read sensors that were found by most recent search

```js
[ 22.9375, 22.875, 21.9375 ]
```

### sensor.read(callback)
Initiates a measurement and returns the temperature reading from a particular sensor in celsius

```js
22.9375
```
