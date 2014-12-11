/*
 * Command: Convert T
 * Description: This command initiates a single temperature conversion. Following the
 *   conversion, the resulting thermal data is stored in the 2-byte temperature register in
 *   the scratchpad memory and the DS18B20 returns to its low-power idle state. If the device
 *   is being used in parasite power mode, within 10μs (max) after this command is issued the
 *   master must enable a strong pullup on the 1-Wire bus for the duration of the conversion.
 *   If the DS18B20 is powered by an external supply, the master can issue read time slots
 *   after the Convert T command and the DS18B20 will respond by transmitting a 0 while the
 *   temperature conversion is in progress and a 1 when the conversion is done. In parasite
 *   power mode this notification technique cannot be used since the bus is pulled high by
 *   the strong pullup during the conversion.
 */

exports.CONVERT_TEMP = 0X44;



/*
 * Command: Write Scratchpad
 * Description: This command allows the master to write 3 bytes of data to the scratchpad.
 *   The first data byte is written into the T H register (byte 2 of the scratchpad), the
 *   second byte is written into the T L register (byte 3), and the third byte is written
 *   into the configuration register (byte 4). Data must be transmitted least significant
 *   bit first. All three bytes MUST be written before the master issues a reset, or the data
 *   may be corrupted.
 */

exports.WRITE_SCRATCHPAD = 0x4E;



/*
 * Command: Read Scratchpad
 * Description: This command allows the master to read the contents of the scratchpad. The
 *   data transfer starts with the least significant bit of byte 0 and continues through the
 *   scratchpad until the 9th byte (byte 8 – CRC) is read. The master may issue a reset to
 *   terminate reading at any time if only part of the scratchpad data is needed.
 */

exports.READ_SCRATCHPAD = 0xBE;



/*
 * Command: Copy Scratchpad
 * Description: This command copies the contents of the scratchpad T H , T L and
 *   configuration registers (bytes 2, 3 and 4) to EEPROM. If the device is being used in
 *   parasite power mode, within 10μs (max) after this command is issued the master must
 *   enable a strong pullup on the 1-Wire bus for at least 10ms as described in the Powering
 *   the DS18B20 section.
 */

exports.COPY_SCRATCHPAD = 0x48;



/*
 * Command: Recall EEPROM
 * Description: This command recalls the alarm trigger values (T H and T L ) and
 *   configuration data from EEPROM and places the data in bytes 2, 3, and 4, respectively,
 *   in the scratchpad memory. The master device can issue read time slots following the
 *   Recall command and the DS18B20 will indicate the status of the recall by transmitting
 *   0 while the recall is in progress and 1 when the recall is done. The recall operation
 *   happens automatically at power-up, so valid data is available in the scratchpad as soon
 *   as power is applied to the device.
 */

exports.RECALL_EEPROM = 0xB8;



/*
 * Command: Read Power Supply
 * Description: The master device issues this command followed by a read time slot to
 *   determine if any DS18B20s on the bus are using parasite power. During the read time slot,
 *   parasite powered DS18B20s will pull the bus low, and externally powered DS18B20s will
 *   let the bus remain high. See the Powering the DS18B20 section for usage information for
 *   this command.
 */

exports.READ_POWER_SUPPLY = 0xB4;
