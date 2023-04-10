import React, { useEffect, useRef } from 'react';
import { findIndex } from 'lodash';
import { WebMidi } from "webmidi";
import {
  N32B,
  Editor,
  SysExEditor,
  UpdateDevice,
  ConnectDevice,
  Version,
  SyncDevice,
  SystemMessages,
  ThruMode
} from './components';
// import defaultPresets from './presetTemplates/default';
// import sysExPreset from './presetTemplates/default/sysEx.json';
import logo from './components/images/shik-logo-small.png';
import './App.css';
import { Container } from '@mui/system';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import SimCardDownloadRoundedIcon from '@mui/icons-material/SimCardDownloadRounded';
import { validateValueRange } from './components/UpdateDevice/utils';
import { SEND_FIRMWARE_VERSION, SET_THRU_MODE, SYNC_KNOBS } from './components/UpdateDevice/commands';
import { ThruOptions } from './components/ThruMode/ThruOptions';
import { useData, useDataDispatch } from './reducer/context';

function App() {
  const dispatch = useDataDispatch();
  const {
    firmwareVersion,
    currentPreset,
    deviceIsConnected,
    midiInput,
    midiOutput,
    midiDeviceName,
    systemMessage,
    openMessageDialog,
    selectedKnobIndex
  } = useData();

  // const knobsDataRef = useRef();
  // const firmwareVersionRef = useRef();
  const appVersion = 'v2.2.1';

  // knobsDataRef.current = knobsData;
  // firmwareVersionRef.current = firmwareVersion;

  useEffect(() => {
    WebMidi.enable((err) => {
      if (err) {
        console.log("WebMidi could not be enabled.", err);
      }
      WebMidi.addListener("connected", function (event) {
        if (WebMidi.getInputByName("N32B")) {
          dispatch({
            type: "setMidiInput",
            midiInput: WebMidi.getInputByName("N32B")
          });
          dispatch({
            type: "setMidiOutput",
            midiOutput: WebMidi.getOutputByName("N32B")
          });
          dispatch({
            type: "setDeviceIsConnected",
            deviceIsConnected: true
          });
        }
      });

      WebMidi.addListener("disconnected", function (event) {
        dispatch({
          type: "setDeviceIsConnected",
          deviceIsConnected: false
        });
        dispatch({
          type: "updateCurrentDevicePresetIndex",
          currentDevicePresetIndex: 0
        });
        dispatch({
          type: "setMidiInput",
          midiInput: null
        });
        dispatch({
          type: "setMidiOutput",
          midiOutput: null
        });
      });
    }, true);
  });

  useEffect(() => {
    if (midiOutput && midiInput) {
      midiInput.addListener('programchange', undefined, handlePresetChange);
      midiInput.addListener('sysex', 'all', handleSysex);
      handleGetDeviceFirmwareVersion();
      dispatch({
        type: "setMidiDeviceName",
        midiDeviceName: midiOutput.name
      });

      return () => {
        midiInput.removeListener('programchange', undefined, handlePresetChange);
        midiInput.removeListener('sysex', undefined, handleSysex);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiOutput, midiInput]);

  // useEffect(() => {
  //   if (isEmpty(knobsData)) return;
  //   updatePreset(prev => ({
  //     ...prev,
  //     knobs: [...knobsData]
  //   }));
  // }, [knobsData]);

  // useEffect(() => {
  //   updatePreset(prev => ({
  //     ...prev,
  //     presetID: currentDevicePresetIndex
  //   }));

  //   if (midiOutput) {
  //     midiOutput.sendProgramChange(currentDevicePresetIndex, 1);
  //   }
  // }, [currentDevicePresetIndex, midiOutput]);


  const fileInput = useRef(null);
  const handleFileInputClick = event => {
    event.target.value = null;
    fileInput.current.click();
  }
  const handleLoadPreset = e => {
    const reader = new FileReader();
    if (fileInput.current.files.length > 0) {
      const file = fileInput.current.files[0];
      reader.onload = (event => {
        const preset = JSON.parse(event.target.result);
        if (
          (firmwareVersion[0] > 29 && preset.presetVersion < 3) ||
          ((firmwareVersion[0] === 2 || firmwareVersion[0] === 3) && preset.presetVersion > 2) ||
          (firmwareVersion[0] === 4 && preset.presetVersion !== 4)
        ) {
          dispatch({
            type: "setSystemMessage",
            systemMessage: "The preset version is not matching the device firmware."
          });
          dispatch({
            type: "setMessageDialog",
            openMessageDialog: true
          });
          return;
        } else {
          dispatch({
            type: "updatePreset",
            preset
          });
        }
      });
      reader.readAsText(file);
    }
  }
  const handleSavePreset = async () => {
    const fileName = `N32B-Preset-${currentPreset.presetName}`;
    const json = JSON.stringify(currentPreset);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function setSelectedKnobIndex(selectedKnobIndex) {
    dispatch({
      type: "setSelectedKnobIndex",
      selectedKnobIndex
    });
  }

  function handleKnobDataChange(currentKnob, data = {}) {
    dispatch({
      type: "updateKnobData",
      currentKnob: {
        ...currentKnob,
        ...data
      }
    });
  }

  const handleCloseSystemDialog = () => {
    dispatch({
      type: "setMessageDialog",
      openMessageDialog: false
    });
    dispatch({
      type: "setSystemMessage",
      systemMessage: null
    });
  }

  const handlePresetChange = e => {
    dispatch({
      type: "updateCurrentDevicePresetIndex",
      currentDevicePresetIndex: e.data[1]
    });
    midiOutput.sendProgramChange(e.data[1], 1);
  }

  const handleSysex = event => {
    const {
      dataBytes,
      message: {
        manufacturerId
      }
    } = event;
    let knobData = {};
    if (manufacturerId[0] === 32) {
      switch (dataBytes[0]) {
        case SEND_FIRMWARE_VERSION:
          if (dataBytes.length > 2) {
            dispatch({
              type: "setFirmwareVersion",
              firmwareVersion: dataBytes.slice(1)
            });
          }
          break;
        case SYNC_KNOBS:
          if (dataBytes.length > 7) {
            const knobIndex = findIndex(currentPreset.knobs, knob => knob.hardwareId === dataBytes[1]);
            if (knobIndex > -1) {
              switch (firmwareVersion[0]) {
                case this > 29:
                  knobData = {
                    ...currentPreset.knobs[knobIndex],
                    MSBFirst: Boolean(dataBytes[2]),
                    valuesIndex: dataBytes[3],
                    minValue: (dataBytes[4] << 4) | dataBytes[5],
                    maxValue: (dataBytes[6] << 4) | dataBytes[7],
                    isSigned: Boolean(dataBytes[8]),
                    sysExMessage: []
                  }
                  const messageSize = dataBytes[9];

                  for (let byteIndex = 0; byteIndex < messageSize; byteIndex++) {
                    knobData.sysExMessage.push(dataBytes[byteIndex + 10].toString(16).padStart(2, '0'));
                  }
                  break;

                case this < 4:
                  knobData = {
                    ...currentPreset.knobs[knobIndex],
                    mode: dataBytes[5],
                    msb: dataBytes[2],
                    lsb: dataBytes[3],
                    channel: dataBytes[4],
                    invert_a: Boolean(dataBytes[6]),
                    invert_b: Boolean(dataBytes[7])
                  };
                  break;

                case this === 4:
                  // TODO: Structue according to firmware V4
                  knobData = {
                    // ...currentPreset.knobs[knobIndex],
                    // mode: dataBytes[5],
                    // msb: dataBytes[2],
                    // lsb: dataBytes[3],
                    // channel: dataBytes[4],
                    // invert_a: Boolean(dataBytes[6]),
                    // invert_b: Boolean(dataBytes[7])
                  };
                  break;

                default:
                  break;
              }

              handleKnobDataChange(knobData);
            }
          }
          break;

        case SET_THRU_MODE:
          const thruMode = dataBytes[1];
          dispatch({
            type: "updateMidiThru",
            thruMode
          });
          break;

        default:
          break;
      }
    }
  }


  // function handleChannelAChange(event) {
  //   handleKnobDataChange(
  //     currentKnob, {
  //     channel_a: parseInt(event.target.value)
  //   });
  // }

  // function handleChannelBChange(event) {
  //   handleKnobDataChange(
  //     currentKnob, {
  //     channel_b: parseInt(event.target.value)
  //   });
  // }
  function handleMinAChange(event) {
    handleKnobDataChange({
      min_a: parseInt(event.target.value)
    });
  }
  function handleMaxAChange(event) {
    handleKnobDataChange({
      max_a: parseInt(event.target.value)
    });
  }
  function handleMinBChange(event) {
    handleKnobDataChange({
      min_b: parseInt(event.target.value)
    });
  }
  function handleMaxBChange(event) {
    handleKnobDataChange({
      max_b: parseInt(event.target.value)
    });
  }

  function handleMSBChange(event) {
    handleKnobDataChange({
      msb: validateValueRange(event.target)
    });
  }
  function handleLSBChange(event) {
    handleKnobDataChange({
      lsb: validateValueRange(event.target)
    });
  }

  function handleHiResChange(event) {
    handleKnobDataChange({
      msb: validateValueRange(event.target),
      lsb: validateValueRange(event.target) + 32
    });
  }

  function handleInvertValueAChange(event) {
    handleKnobDataChange({
      invert_a: event.target.checked
    });
  }

  function handleInvertValueBChange(event) {
    handleKnobDataChange({
      invert_b: event.target.checked
    });
  }
  const handleGetDeviceFirmwareVersion = () => {
    midiOutput.sendSysex(32, [SEND_FIRMWARE_VERSION]);
  }
  const handleLoadFromDevice = () => {
    midiOutput.sendSysex(32, [SYNC_KNOBS]);
  }
  const handleFirmwareUpdate = () => {
    window.open("https://shik.tech/firmware-update/");
  }

  function handleThruModeChange(thruMode) {
    // updatePreset(prev => ({
    //   ...prev,
    //   thruMode: thruMode.target.value
    // }));
  }

  return (
    <Container maxWidth="lg">
      <SystemMessages
        closeDialog={handleCloseSystemDialog}
        showMessage={openMessageDialog}
        message={systemMessage}
      />
      <Box>
        <AppBar position="static" >
          <Toolbar variant="dense">
            <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
              <Stack
                direction="row"
                spacing={2}
                divider={<Divider orientation="vertical" light />}
                sx={{ flexGrow: 1 }}
              >
                <Box
                  component="img"
                  alt="SHIK logo"
                  src={logo}
                  sx={{
                    height: 20,
                    pt: 1
                  }}
                />
                <Typography sx={{ pt: 1 }} variant="body2" component="div">
                  N32B Editor
                </Typography>
                {deviceIsConnected && firmwareVersion &&
                  <Typography sx={{ pt: 1 }} variant="body2" component="div">
                    {midiDeviceName} < Typography variant="caption" sx={{ color: "#808080" }} >(v{firmwareVersion.join('.')})</Typography>
                    {firmwareVersion[0] > 29 &&
                      " - SysEx"
                    }
                  </Typography>
                }
              </Stack>

              {deviceIsConnected && !firmwareVersion &&
                <Button
                  onClick={handleFirmwareUpdate}
                  color="error"
                >
                  Firmware Update
                </Button>
              }

              {deviceIsConnected && firmwareVersion && currentPreset &&
                <Stack
                  direction="row"
                  spacing={2}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<UploadFileRoundedIcon />}
                    onClick={handleFileInputClick}
                  >
                    Load
                    <input
                      hidden
                      type="file"
                      ref={fileInput}
                      onChange={handleLoadPreset}
                    />
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    endIcon={<SimCardDownloadRoundedIcon />}
                    onClick={handleSavePreset}
                  >
                    Save
                  </Button>

                  <UpdateDevice
                    firmwareVersion={firmwareVersion}
                    currentPreset={currentPreset}
                    midiOutput={midiOutput}
                    currentDevicePresetIndex={currentPreset.presetId}
                    updateCurrentDevicePresetIndex={handlePresetChange}
                  />

                  <SyncDevice
                    firmwareVersion={firmwareVersion}
                    currentPreset={currentPreset}
                    currentDevicePresetIndex={currentPreset.presetId}
                    updateCurrentDevicePresetIndex={handlePresetChange}
                    handleLoadFromDevice={handleLoadFromDevice}
                  />
                </Stack>
              }
            </Stack>
          </Toolbar>
        </AppBar>

        {!deviceIsConnected &&
          <ConnectDevice />
        }

        {deviceIsConnected && firmwareVersion && currentPreset &&
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem />}
            spacing={4}
            sx={{ mt: 2 }}
          >
            <Stack>
              <N32B
                knobsData={currentPreset.knobs}
                selectedKnobIndex={selectedKnobIndex}
                setSelectedKnob={setSelectedKnobIndex}
              />
              <Version appVersion={appVersion} />
            </Stack>

            <Stack
              sx={{ flexGrow: 1 }}
              spacing={2}
            >
              {firmwareVersion[0] > 3 &&
                <>
                  <ThruMode
                    thruMode={currentPreset.thruMode}
                    thruOptions={ThruOptions}
                    handleThruModeChange={handleThruModeChange}
                  />
                  <Divider />
                </>
              }
              <Typography variant="h5" component="div" gutterBottom>
                Editing Knob: <span className="currentKnob">{currentPreset.knobs[selectedKnobIndex].id}</span>
              </Typography>
              {firmwareVersion[0] < 30 &&
                <Editor
                  currentKnob={currentPreset.knobs[selectedKnobIndex]}
                  handleKnobDataChange={handleKnobDataChange}

                  handleMinAChange={handleMinAChange}
                  handleMaxAChange={handleMaxAChange}
                  handleMinBChange={handleMinBChange}
                  handleMaxBChange={handleMaxBChange}
                  handleMSBChange={handleMSBChange}
                  handleLSBChange={handleLSBChange}
                  handleInvertValueAChange={handleInvertValueAChange}
                  handleInvertValueBChange={handleInvertValueBChange}
                  handleHiResChange={handleHiResChange}
                  firmwareVersion={firmwareVersion}
                />
              }
              {firmwareVersion[0] > 29 &&
                <SysExEditor
                  currentKnob={currentPreset.knobs[selectedKnobIndex]}
                  handleKnobDataChange={handleKnobDataChange}
                />
              }
            </Stack>
          </Stack>
        }
      </Box>
    </Container >
  );
}

export default App;
