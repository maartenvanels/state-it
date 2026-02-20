export type VariableScope = 'input' | 'output' | 'local' | 'parameter';

export type DataType =
  | 'boolean'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'float'
  | 'double'
  | 'string'
  | 'enum';

export interface Variable {
  id: string;
  name: string;
  scope: VariableScope;
  dataType: DataType;
  initialValue: string;
  description: string;
  enumValues?: string[];
  arraySize?: number;
  /** When set, this variable is auto-synced from a chart port and cannot be renamed/retyped. */
  portId?: string;
}

export const DATA_TYPE_TO_C: Record<DataType, string> = {
  boolean: 'bool',
  int8: 'int8_t',
  int16: 'int16_t',
  int32: 'int32_t',
  uint8: 'uint8_t',
  uint16: 'uint16_t',
  uint32: 'uint32_t',
  float: 'float',
  double: 'double',
  string: 'char*',
  enum: 'int',
};

export const DATA_TYPE_TO_SCL: Record<DataType, string> = {
  boolean: 'BOOL',
  int8: 'SINT',
  int16: 'INT',
  int32: 'DINT',
  uint8: 'USINT',
  uint16: 'UINT',
  uint32: 'UDINT',
  float: 'REAL',
  double: 'LREAL',
  string: 'STRING',
  enum: 'INT',
};
