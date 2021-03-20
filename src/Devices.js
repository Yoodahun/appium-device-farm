import _ from 'lodash';
import { eventEmitter } from './events';
import AndroidDeviceManager from './AndroidDeviceManager';

const schedule = require('node-schedule');
let actualDevices;
eventEmitter.on('ADB', function (data) {
  const { emittedDevices } = data;
  emittedDevices.forEach((emittedDevice) => {
    const actualDevice = actualDevices.find(
      (actualDeviceState) => actualDeviceState.udid === emittedDevice.udid
    );
    const deviceIndex = _.findIndex(emittedDevices, {
      udid: emittedDevice.udid,
    });
    if (actualDevice) {
      const deviceIndex = _.findIndex(emittedDevices, {
        udid: emittedDevice.udid,
      });
      emittedDevices[deviceIndex] = Object.assign({
        busy: actualDevice.busy,
        state: emittedDevice.state,
        udid: emittedDevice.udid,
        sessionId: actualDevice.sessionId,
      });
    } else {
      emittedDevices[deviceIndex] = Object.assign({
        busy: false,
        state: emittedDevice.state,
        udid: emittedDevice.udid,
        sessionId: null,
      });
    }
  });
  actualDevices = emittedDevices;
  console.log('Master Device List', actualDevices);
});

export default class Devices {
  constructor(connectedDevices) {
    actualDevices = connectedDevices;
    this.initADB();
  }

  initADB() {
    console.log('Starting & initializing the timer');
    let rule = new schedule.RecurrenceRule();
    rule.second = [0, 10, 20, 30, 40, 50];
    schedule.scheduleJob(rule, async function () {
      let androidDevices = new AndroidDeviceManager();
      let connectedDevices = await androidDevices.getConnectedDevices();
      eventEmitter.emit('ADB', {
        emittedDevices: connectedDevices,
      });
    });
  }

  listAllDevices() {
    return actualDevices;
  }

  getFreeDevice() {
    return actualDevices.find((device) => device.busy === false);
  }

  blockDevice(freeDevice) {
    return actualDevices.find(
      (device) =>
        device.udid === freeDevice.udid && ((device.busy = true), true)
    );
  }

  unblockDevice(blockedDevice) {
    return actualDevices.find(
      (device) =>
        device.udid === blockedDevice.udid && ((device.busy = false), true)
    );
  }

  updateDevice(freeDevice, sessionId) {
    const device = actualDevices.find(
      (device) => device.udid === freeDevice.udid
    );
    const deviceIndex = _.findIndex(actualDevices, { udid: freeDevice.udid });
    actualDevices[deviceIndex] = Object.assign(device, { sessionId });
  }

  getDeviceForSession(sessionId) {
    return actualDevices.find((device) => device.sessionId === sessionId);
  }
}