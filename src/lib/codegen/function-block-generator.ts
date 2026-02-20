import type { SystemBlock } from '../types/system';
import type { FunctionBlockConfig, FunctionBlockDef } from '../types/function-block';
import type { GeneratedFile } from '../types/codegen';
import { getBlockDef } from '../blocks/registry';
import '../blocks';

/**
 * Generate standalone C and SCL function block code for a single function block instance.
 * Each function block generates its own FB, analogous to how charts generate their own FB.
 */
export function generateFunctionBlockFiles(block: SystemBlock): GeneratedFile[] {
  const config = block.config as unknown as FunctionBlockConfig;
  const def = getBlockDef(config.defType);
  if (!def) return [];

  const safeName = block.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const files: GeneratedFile[] = [];

  // C files
  const cCode = generateFunctionBlockC(block, def, config);
  files.push({
    filename: `${safeName}.h`,
    content: cCode.header,
    language: 'c',
    category: 'header',
  });
  files.push({
    filename: `${safeName}.c`,
    content: cCode.source,
    language: 'c',
    category: 'source',
  });

  // SCL file
  const sclCode = generateFunctionBlockSCL(block, def, config);
  files.push({
    filename: `${safeName}.scl`,
    content: sclCode,
    language: 'scl',
    category: 'scl',
  });

  return files;
}

// ─── C Code Generation ──────────────────────────────────────

function generateFunctionBlockC(
  block: SystemBlock,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): { header: string; source: string } {
  const fbName = `FB_${block.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  // If the def has a custom FB template, use it
  if (def.codeGen.c.fbTemplate) {
    const content = substituteTemplate(def.codeGen.c.fbTemplate, block, def, config);
    return { header: `/* ${fbName} - see source */\n`, source: content };
  }

  // Generate from expression
  const header = generateCHeader(fbName, def, config);
  const source = generateCSource(fbName, def, config);
  return { header, source };
}

function generateCHeader(
  fbName: string,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  const guard = `${fbName.toUpperCase()}_H`;
  const lines: string[] = [];

  lines.push(`#ifndef ${guard}`);
  lines.push(`#define ${guard}`);
  lines.push('');

  // Includes
  const includes = new Set<string>(['<stdbool.h>']);
  if (def.codeGen.c.includes) {
    for (const inc of def.codeGen.c.includes) includes.add(inc);
  }
  for (const inc of includes) {
    lines.push(`#include ${inc}`);
  }
  lines.push('');

  // Struct
  lines.push(`typedef struct {`);
  for (const input of def.inputs) {
    lines.push(`    ${cDataType(input.dataType)} ${input.id};`);
  }
  for (const output of def.outputs) {
    lines.push(`    ${cDataType(output.dataType)} ${output.id};`);
  }
  // Parameters as constants in struct
  for (const param of def.params) {
    if (param.type === 'number') {
      lines.push(`    float ${param.id};`);
    } else if (param.type === 'boolean') {
      lines.push(`    bool ${param.id};`);
    }
  }
  lines.push(`} ${fbName};`);
  lines.push('');

  lines.push(`void ${fbName}_Init(${fbName}* fb);`);
  lines.push(`void ${fbName}_Step(${fbName}* fb);`);
  lines.push('');
  lines.push(`#endif /* ${guard} */`);
  lines.push('');

  return lines.join('\n');
}

function generateCSource(
  fbName: string,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  const lines: string[] = [];
  const headerFile = `${fbName.toLowerCase()}.h`;

  lines.push(`#include "${headerFile}"`);
  lines.push('');

  // Init function
  lines.push(`void ${fbName}_Init(${fbName}* fb) {`);
  for (const output of def.outputs) {
    lines.push(`    fb->${output.id} = ${output.dataType === 'boolean' ? 'false' : '0.0f'};`);
  }
  // Init params with config values
  for (const param of def.params) {
    const value = config.params[param.id] ?? param.defaultValue;
    if (param.type === 'number') {
      lines.push(`    fb->${param.id} = ${Number(value)}f;`);
    } else if (param.type === 'boolean') {
      lines.push(`    fb->${param.id} = ${value ? 'true' : 'false'};`);
    }
  }
  lines.push('}');
  lines.push('');

  // Step function
  lines.push(`void ${fbName}_Step(${fbName}* fb) {`);

  if (def.codeGen.c.expression) {
    // Simple expression-based block
    const expr = substituteExpression(def.codeGen.c.expression, 'fb->');
    const outId = def.outputs[0]?.id ?? 'out';
    lines.push(`    fb->${outId} = ${expr};`);
  } else {
    // Fallback: assignment for each output
    for (const output of def.outputs) {
      lines.push(`    /* TODO: implement ${output.id} computation */`);
    }
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── SCL Code Generation ────────────────────────────────────

function generateFunctionBlockSCL(
  block: SystemBlock,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  const fbName = `FB_${block.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  // If the def has a custom SCL FB template, use it
  if (def.codeGen.scl.fbTemplate) {
    return substituteTemplate(def.codeGen.scl.fbTemplate, block, def, config);
  }

  // If it wraps an IEC standard FB (timers, counters)
  if (def.codeGen.scl.iecFbType) {
    return generateIECSCL(fbName, def, config);
  }

  // Generate from expression
  return generateExpressionSCL(fbName, def, config);
}

function generateExpressionSCL(
  fbName: string,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  const lines: string[] = [];

  lines.push(`FUNCTION_BLOCK "${fbName}"`);
  lines.push('');

  // VAR_INPUT
  if (def.inputs.length > 0) {
    lines.push('VAR_INPUT');
    for (const input of def.inputs) {
      lines.push(`    ${input.name} : ${sclDataType(input.dataType)};`);
    }
    lines.push('END_VAR');
    lines.push('');
  }

  // VAR_OUTPUT
  if (def.outputs.length > 0) {
    lines.push('VAR_OUTPUT');
    for (const output of def.outputs) {
      lines.push(`    ${output.name} : ${sclDataType(output.dataType)};`);
    }
    lines.push('END_VAR');
    lines.push('');
  }

  // VAR CONSTANT for parameters
  const numParams = def.params.filter((p) => p.type === 'number' || p.type === 'boolean');
  if (numParams.length > 0) {
    lines.push('VAR CONSTANT');
    for (const param of numParams) {
      const value = config.params[param.id] ?? param.defaultValue;
      if (param.type === 'number') {
        lines.push(`    ${param.id} : REAL := ${Number(value)};`);
      } else if (param.type === 'boolean') {
        lines.push(`    ${param.id} : BOOL := ${value ? 'TRUE' : 'FALSE'};`);
      }
    }
    lines.push('END_VAR');
    lines.push('');
  }

  // BEGIN
  lines.push('BEGIN');

  if (def.codeGen.scl.expression) {
    const expr = substituteExpression(def.codeGen.scl.expression, '#');
    const outName = def.outputs[0]?.name ?? 'Out';
    lines.push(`    #${outName} := ${expr};`);
  } else {
    for (const output of def.outputs) {
      lines.push(`    // TODO: implement #${output.name} computation`);
    }
  }

  lines.push('END_FUNCTION_BLOCK');
  lines.push('');

  return lines.join('\n');
}

function generateIECSCL(
  fbName: string,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  const lines: string[] = [];
  const iecType = def.codeGen.scl.iecFbType!;

  lines.push(`FUNCTION_BLOCK "${fbName}"`);
  lines.push('');

  // VAR_INPUT
  lines.push('VAR_INPUT');
  for (const input of def.inputs) {
    const defaultVal = getIECDefaultValue(input, config);
    lines.push(`    ${input.name} : ${sclDataType(input.dataType)}${defaultVal};`);
  }
  lines.push('END_VAR');
  lines.push('');

  // VAR_OUTPUT
  lines.push('VAR_OUTPUT');
  for (const output of def.outputs) {
    lines.push(`    ${output.name} : ${sclDataType(output.dataType)};`);
  }
  lines.push('END_VAR');
  lines.push('');

  // Internal IEC FB instance
  lines.push('VAR');
  lines.push(`    fb${iecType} : ${iecType};`);
  lines.push('END_VAR');
  lines.push('');

  // Call pattern
  lines.push('BEGIN');
  const inputAssigns = def.inputs.map((inp) => `${inp.id} := #${inp.name}`).join(', ');
  lines.push(`    #fb${iecType}(${inputAssigns});`);
  for (const output of def.outputs) {
    lines.push(`    #${output.name} := #fb${iecType}.${output.id};`);
  }
  lines.push('END_FUNCTION_BLOCK');
  lines.push('');

  return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────

function cDataType(dt: 'number' | 'boolean'): string {
  return dt === 'boolean' ? 'bool' : 'float';
}

function sclDataType(dt: 'number' | 'boolean'): string {
  return dt === 'boolean' ? 'BOOL' : 'REAL';
}

/**
 * Substitute port/param IDs in an expression template.
 * Template uses `{id}` placeholders; prefix is added before each.
 * Example: "({in1} + {in2})" with prefix "fb->" → "(fb->in1 + fb->in2)"
 */
function substituteExpression(template: string, prefix: string): string {
  return template.replace(/\{(\w+)\}/g, (_, id) => `${prefix}${id}`);
}

/**
 * Substitute a full FB template with block-specific values.
 */
function substituteTemplate(
  template: string,
  block: SystemBlock,
  def: FunctionBlockDef,
  config: FunctionBlockConfig
): string {
  let result = template;
  result = result.replace(/\{FB_NAME\}/g, `FB_${block.name.replace(/[^a-zA-Z0-9_]/g, '_')}`);
  result = result.replace(/\{BLOCK_NAME\}/g, block.name);

  // Substitute parameters
  for (const param of def.params) {
    const value = config.params[param.id] ?? param.defaultValue;
    result = result.replace(new RegExp(`\\{${param.id}\\}`, 'g'), String(value));
  }

  return result;
}

function getIECDefaultValue(
  input: { id: string; dataType: 'number' | 'boolean' },
  config: FunctionBlockConfig
): string {
  // Check if there's a matching param for this input (e.g., PT for timers)
  const paramValue = config.params[input.id];
  if (paramValue !== undefined) {
    if (input.dataType === 'boolean') return ` := ${paramValue ? 'TRUE' : 'FALSE'}`;
    return ` := ${paramValue}`;
  }
  return '';
}
