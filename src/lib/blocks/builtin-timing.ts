import type { FunctionBlockDef } from '../types/function-block';

export const TIMING_BLOCKS: FunctionBlockDef[] = [
  {
    type: 'timer.ton',
    category: 'timing',
    name: 'TON',
    symbol: 'TON',
    description: 'On-delay timer (IEC)',
    inputs: [
      { id: 'in', name: 'IN', dataType: 'boolean' },
      { id: 'pt', name: 'PT', dataType: 'number' },
    ],
    outputs: [
      { id: 'q', name: 'Q', dataType: 'boolean' },
      { id: 'et', name: 'ET', dataType: 'number' },
    ],
    params: [
      { id: 'preset', name: 'Preset (ticks)', type: 'number', defaultValue: 10, min: 1, step: 1 },
    ],
    defaultSize: { width: 140, height: 90 },
    execute: (inputs, params, state) => {
      const pt = (inputs.pt ?? Number(params.preset) ?? 10);
      const inVal = (inputs.in ?? 0) !== 0;
      let et = state.et ?? 0;

      if (inVal) {
        if (et < pt) et += 1;
      } else {
        et = 0;
      }

      return {
        outputs: { q: et >= pt ? 1 : 0, et },
        state: { et },
      };
    },
    codeGen: {
      c: {
        fbTemplate: [
          'typedef struct {',
          '    bool IN;',
          '    uint32_t PT;',
          '    bool Q;',
          '    uint32_t ET;',
          '    uint32_t _counter;',
          '} {NAME};',
          '',
          'void {NAME}_Step({NAME}* fb) {',
          '    if (fb->IN) {',
          '        if (fb->_counter < fb->PT) fb->_counter++;',
          '    } else {',
          '        fb->_counter = 0;',
          '    }',
          '    fb->ET = fb->_counter;',
          '    fb->Q = (fb->_counter >= fb->PT);',
          '}',
        ].join('\n'),
      },
      scl: {
        iecFbType: 'TON',
        expression: '#fb{NAME}(IN := {in}, PT := T#{preset}ms);\n{q} := #fb{NAME}.Q;\n{et} := #fb{NAME}.ET;',
      },
    },
  },
  {
    type: 'timer.tof',
    category: 'timing',
    name: 'TOF',
    symbol: 'TOF',
    description: 'Off-delay timer (IEC)',
    inputs: [
      { id: 'in', name: 'IN', dataType: 'boolean' },
      { id: 'pt', name: 'PT', dataType: 'number' },
    ],
    outputs: [
      { id: 'q', name: 'Q', dataType: 'boolean' },
      { id: 'et', name: 'ET', dataType: 'number' },
    ],
    params: [
      { id: 'preset', name: 'Preset (ticks)', type: 'number', defaultValue: 10, min: 1, step: 1 },
    ],
    defaultSize: { width: 140, height: 90 },
    execute: (inputs, params, state) => {
      const pt = (inputs.pt ?? Number(params.preset) ?? 10);
      const inVal = (inputs.in ?? 0) !== 0;
      let et = state.et ?? 0;
      let wasOn = (state.wasOn ?? 0) !== 0;

      if (inVal) {
        et = 0;
        wasOn = true;
      } else if (wasOn) {
        if (et < pt) {
          et += 1;
        } else {
          wasOn = false;
        }
      }

      return {
        outputs: { q: (inVal || (wasOn && et < pt)) ? 1 : 0, et },
        state: { et, wasOn: wasOn ? 1 : 0 },
      };
    },
    codeGen: {
      c: {
        fbTemplate: [
          'typedef struct {',
          '    bool IN;',
          '    uint32_t PT;',
          '    bool Q;',
          '    uint32_t ET;',
          '    uint32_t _counter;',
          '    bool _wasOn;',
          '} {NAME};',
          '',
          'void {NAME}_Step({NAME}* fb) {',
          '    if (fb->IN) {',
          '        fb->_counter = 0;',
          '        fb->_wasOn = true;',
          '    } else if (fb->_wasOn) {',
          '        if (fb->_counter < fb->PT) fb->_counter++;',
          '        else fb->_wasOn = false;',
          '    }',
          '    fb->ET = fb->_counter;',
          '    fb->Q = fb->IN || (fb->_wasOn && fb->_counter < fb->PT);',
          '}',
        ].join('\n'),
      },
      scl: {
        iecFbType: 'TOF',
        expression: '#fb{NAME}(IN := {in}, PT := T#{preset}ms);\n{q} := #fb{NAME}.Q;\n{et} := #fb{NAME}.ET;',
      },
    },
  },
  {
    type: 'timer.tp',
    category: 'timing',
    name: 'TP',
    symbol: 'TP',
    description: 'Pulse timer (IEC)',
    inputs: [
      { id: 'in', name: 'IN', dataType: 'boolean' },
      { id: 'pt', name: 'PT', dataType: 'number' },
    ],
    outputs: [
      { id: 'q', name: 'Q', dataType: 'boolean' },
      { id: 'et', name: 'ET', dataType: 'number' },
    ],
    params: [
      { id: 'preset', name: 'Pulse width (ticks)', type: 'number', defaultValue: 10, min: 1, step: 1 },
    ],
    defaultSize: { width: 140, height: 90 },
    execute: (inputs, params, state) => {
      const pt = (inputs.pt ?? Number(params.preset) ?? 10);
      const inVal = (inputs.in ?? 0) !== 0;
      let et = state.et ?? 0;
      let running = (state.running ?? 0) !== 0;

      if (inVal && !running && et === 0) {
        running = true;
      }

      if (running) {
        et += 1;
        if (et >= pt) {
          running = false;
          et = 0;
        }
      }

      return {
        outputs: { q: running ? 1 : 0, et },
        state: { et, running: running ? 1 : 0 },
      };
    },
    codeGen: {
      c: {
        fbTemplate: [
          'typedef struct {',
          '    bool IN;',
          '    uint32_t PT;',
          '    bool Q;',
          '    uint32_t ET;',
          '    uint32_t _counter;',
          '    bool _running;',
          '} {NAME};',
          '',
          'void {NAME}_Step({NAME}* fb) {',
          '    if (fb->IN && !fb->_running && fb->_counter == 0) {',
          '        fb->_running = true;',
          '    }',
          '    if (fb->_running) {',
          '        fb->_counter++;',
          '        if (fb->_counter >= fb->PT) {',
          '            fb->_running = false;',
          '            fb->_counter = 0;',
          '        }',
          '    }',
          '    fb->ET = fb->_counter;',
          '    fb->Q = fb->_running;',
          '}',
        ].join('\n'),
      },
      scl: {
        iecFbType: 'TP',
        expression: '#fb{NAME}(IN := {in}, PT := T#{preset}ms);\n{q} := #fb{NAME}.Q;\n{et} := #fb{NAME}.ET;',
      },
    },
  },
  {
    type: 'counter.ctu',
    category: 'timing',
    name: 'CTU',
    symbol: 'CTU',
    description: 'Count up counter (IEC)',
    inputs: [
      { id: 'cu', name: 'CU', dataType: 'boolean' },
      { id: 'r', name: 'R', dataType: 'boolean' },
      { id: 'pv', name: 'PV', dataType: 'number' },
    ],
    outputs: [
      { id: 'q', name: 'Q', dataType: 'boolean' },
      { id: 'cv', name: 'CV', dataType: 'number' },
    ],
    params: [
      { id: 'presetValue', name: 'Preset value', type: 'number', defaultValue: 10, min: 0, step: 1 },
    ],
    defaultSize: { width: 140, height: 100 },
    execute: (inputs, params, state) => {
      const pv = (inputs.pv ?? Number(params.presetValue) ?? 10);
      const cuRising = (inputs.cu ?? 0) !== 0 && (state.prevCu ?? 0) === 0;
      const reset = (inputs.r ?? 0) !== 0;
      let cv = state.cv ?? 0;

      if (reset) {
        cv = 0;
      } else if (cuRising) {
        cv += 1;
      }

      return {
        outputs: { q: cv >= pv ? 1 : 0, cv },
        state: { cv, prevCu: (inputs.cu ?? 0) !== 0 ? 1 : 0 },
      };
    },
    codeGen: {
      c: {
        fbTemplate: [
          'typedef struct {',
          '    bool CU;',
          '    bool R;',
          '    int32_t PV;',
          '    bool Q;',
          '    int32_t CV;',
          '    bool _prevCU;',
          '} {NAME};',
          '',
          'void {NAME}_Step({NAME}* fb) {',
          '    bool rising = fb->CU && !fb->_prevCU;',
          '    fb->_prevCU = fb->CU;',
          '    if (fb->R) fb->CV = 0;',
          '    else if (rising) fb->CV++;',
          '    fb->Q = (fb->CV >= fb->PV);',
          '}',
        ].join('\n'),
      },
      scl: {
        iecFbType: 'CTU',
        expression: '#fb{NAME}(CU := {cu}, R := {r}, PV := {pv});\n{q} := #fb{NAME}.Q;\n{cv} := #fb{NAME}.CV;',
      },
    },
  },
  {
    type: 'counter.ctd',
    category: 'timing',
    name: 'CTD',
    symbol: 'CTD',
    description: 'Count down counter (IEC)',
    inputs: [
      { id: 'cd', name: 'CD', dataType: 'boolean' },
      { id: 'ld', name: 'LD', dataType: 'boolean' },
      { id: 'pv', name: 'PV', dataType: 'number' },
    ],
    outputs: [
      { id: 'q', name: 'Q', dataType: 'boolean' },
      { id: 'cv', name: 'CV', dataType: 'number' },
    ],
    params: [
      { id: 'presetValue', name: 'Preset value', type: 'number', defaultValue: 10, min: 0, step: 1 },
    ],
    defaultSize: { width: 140, height: 100 },
    execute: (inputs, params, state) => {
      const pv = (inputs.pv ?? Number(params.presetValue) ?? 10);
      const cdRising = (inputs.cd ?? 0) !== 0 && (state.prevCd ?? 0) === 0;
      const load = (inputs.ld ?? 0) !== 0;
      let cv = state.cv ?? 0;

      if (load) {
        cv = pv;
      } else if (cdRising && cv > 0) {
        cv -= 1;
      }

      return {
        outputs: { q: cv <= 0 ? 1 : 0, cv },
        state: { cv, prevCd: (inputs.cd ?? 0) !== 0 ? 1 : 0 },
      };
    },
    codeGen: {
      c: {
        fbTemplate: [
          'typedef struct {',
          '    bool CD;',
          '    bool LD;',
          '    int32_t PV;',
          '    bool Q;',
          '    int32_t CV;',
          '    bool _prevCD;',
          '} {NAME};',
          '',
          'void {NAME}_Step({NAME}* fb) {',
          '    bool rising = fb->CD && !fb->_prevCD;',
          '    fb->_prevCD = fb->CD;',
          '    if (fb->LD) fb->CV = fb->PV;',
          '    else if (rising && fb->CV > 0) fb->CV--;',
          '    fb->Q = (fb->CV <= 0);',
          '}',
        ].join('\n'),
      },
      scl: {
        iecFbType: 'CTD',
        expression: '#fb{NAME}(CD := {cd}, LD := {ld}, PV := {pv});\n{q} := #fb{NAME}.Q;\n{cv} := #fb{NAME}.CV;',
      },
    },
  },
];
