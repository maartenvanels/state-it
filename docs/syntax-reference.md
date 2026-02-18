# State-It Expression Syntax Reference

State-It uses a MATLAB Stateflow-inspired expression language for conditions and actions.
Expressions are written once and automatically translated to **C** and **Siemens SCL (S7-1500)**.

---

## Transition Label Format

```
event[condition]{condition_action}/transition_action
```

| Part               | Description                              | Required |
|--------------------|------------------------------------------|----------|
| `event`            | Event name that triggers the transition  | No       |
| `[condition]`      | Guard expression (must be true)          | No       |
| `{condition_action}` | Action executed when condition is true | No       |
| `/transition_action` | Action executed during the transition  | No       |

**Examples:**
```
start                          -- event only
[speed > 0]                    -- condition only (eventless)
start[speed > 0]               -- event + condition
start[speed > 0]{count = 0}/initMotor()   -- all parts
```

---

## State Actions

Each state has three action phases:

| Phase    | When executed                     |
|----------|-----------------------------------|
| `entry`  | Once, when entering the state     |
| `during` | Every cycle while in the state    |
| `exit`   | Once, when leaving the state      |

Actions are single statements. Multiple actions are executed in order.

---

## Data Types

| State-It | C            | SCL (S7-1500) | Description          |
|----------|--------------|---------------|----------------------|
| boolean  | `bool`       | `BOOL`        | True/false           |
| int8     | `int8_t`     | `SINT`        | Signed 8-bit         |
| int16    | `int16_t`    | `INT`         | Signed 16-bit        |
| int32    | `int32_t`    | `DINT`        | Signed 32-bit        |
| uint8    | `uint8_t`    | `USINT`       | Unsigned 8-bit       |
| uint16   | `uint16_t`   | `UINT`        | Unsigned 16-bit      |
| uint32   | `uint32_t`   | `UDINT`       | Unsigned 32-bit      |
| float    | `float`      | `REAL`        | 32-bit floating      |
| double   | `double`     | `LREAL`       | 64-bit floating      |
| string   | `char*`      | `STRING`      | Text string          |
| enum     | `int`        | `INT`         | Enumeration (int)    |

---

## Literals

| Type    | Examples                    | Notes                              |
|---------|-----------------------------|------------------------------------|
| Integer | `0`, `42`, `-7`, `0xFF`     | Hex with `0x` prefix               |
| Float   | `3.14`, `-0.5`, `1.0e3`    | Decimal point or scientific         |
| Boolean | `true`, `false`             | C: `true/false`, SCL: `TRUE/FALSE` |
| String  | `'hello'`                   | Single-quoted                      |

---

## Variables

Variables are referenced by their project-defined name. The code generators handle
mapping to the correct target syntax.

| State-It          | C                      | SCL (S7-1500)         |
|-------------------|------------------------|-----------------------|
| `speed`           | `sm->speed`            | `#speed`              |
| `isRunning`       | `sm->isRunning`        | `#isRunning`          |

Variable names must be valid identifiers: start with a letter or underscore,
contain only letters, digits, and underscores.

---

## Operators

### Arithmetic

| Operator | Description    | Example       | C          | SCL              |
|----------|---------------|---------------|------------|------------------|
| `+`      | Addition       | `x + 1`      | `x + 1`    | `#x + 1`         |
| `-`      | Subtraction    | `x - 1`      | `x - 1`    | `#x - 1`         |
| `*`      | Multiplication | `x * 2`      | `x * 2`    | `#x * 2`         |
| `/`      | Division       | `x / 2`      | `x / 2`    | `#x / 2`         |
| `%`      | Modulo         | `x % 10`     | `x % 10`   | `#x MOD 10`      |
| `-`      | Unary negate   | `-x`         | `-x`       | `-#x`            |

### Comparison

| Operator | Description      | Example        | C            | SCL             |
|----------|-----------------|----------------|--------------|-----------------|
| `==`     | Equal            | `x == 0`      | `x == 0`     | `#x = 0`        |
| `!=`     | Not equal        | `x != 0`      | `x != 0`     | `#x <> 0`       |
| `>`      | Greater than     | `x > 10`      | `x > 10`     | `#x > 10`       |
| `<`      | Less than        | `x < 10`      | `x < 10`     | `#x < 10`       |
| `>=`     | Greater or equal | `x >= 10`     | `x >= 10`    | `#x >= 10`      |
| `<=`     | Less or equal    | `x <= 10`     | `x <= 10`    | `#x <= 10`      |

### Logical

| Operator | Description | Example           | C              | SCL                |
|----------|------------|-------------------|----------------|--------------------|
| `&&`     | AND        | `a > 0 && b > 0` | `a > 0 && b > 0` | `#a > 0 AND #b > 0` |
| `\|\|`   | OR         | `a > 0 \|\| b > 0` | `a > 0 \|\| b > 0` | `#a > 0 OR #b > 0` |
| `!`      | NOT        | `!flag`           | `!flag`         | `NOT #flag`        |

### Bitwise

| Operator | Description | Example      | C           | SCL               |
|----------|------------|--------------|-------------|--------------------|
| `&`      | AND        | `x & 0xFF`  | `x & 0xFF`  | `#x AND 16#FF`     |
| `\|`     | OR         | `x \| 0x01` | `x \| 0x01` | `#x OR 16#01`      |
| `^`      | XOR        | `x ^ mask`  | `x ^ mask`  | `#x XOR #mask`     |
| `~`      | NOT        | `~x`        | `~x`        | `NOT #x`           |
| `<<`     | Shift left | `x << 2`    | `x << 2`    | `SHL(IN:=#x, N:=2)` |
| `>>`     | Shift right| `x >> 2`    | `x >> 2`    | `SHR(IN:=#x, N:=2)` |

### Operator Precedence (high to low)

| Level | Operators                     |
|-------|-------------------------------|
| 1     | `()` grouping                 |
| 2     | `!` `~` `-` (unary) `++` `--` |
| 3     | `*` `/` `%`                   |
| 4     | `+` `-`                       |
| 5     | `<<` `>>`                     |
| 6     | `<` `<=` `>` `>=`             |
| 7     | `==` `!=`                     |
| 8     | `&`                           |
| 9     | `^`                           |
| 10    | `\|`                          |
| 11    | `&&`                          |
| 12    | `\|\|`                        |
| 13    | `=` `+=` `-=` `*=` `/=` `%=` |

---

## Assignment

| State-It     | Description           | C                 | SCL                         |
|-------------|-----------------------|--------------------|-----------------------------|
| `x = 5`     | Simple assignment      | `sm->x = 5;`     | `#x := 5;`                  |
| `x += 5`    | Add and assign         | `sm->x += 5;`    | `#x := #x + 5;`             |
| `x -= 1`    | Subtract and assign    | `sm->x -= 1;`    | `#x := #x - 1;`             |
| `x *= 2`    | Multiply and assign    | `sm->x *= 2;`    | `#x := #x * 2;`             |
| `x /= 10`   | Divide and assign      | `sm->x /= 10;`   | `#x := #x / 10;`            |
| `x %= 3`    | Modulo and assign      | `sm->x %= 3;`    | `#x := #x MOD 3;`           |
| `x++`       | Increment              | `sm->x++;`        | `#x := #x + 1;`             |
| `x--`       | Decrement              | `sm->x--;`        | `#x := #x - 1;`             |

---

## Built-in Functions

### Math Functions

| State-It       | C              | SCL               |
|---------------|----------------|---------------------|
| `abs(x)`      | `abs(x)`       | `ABS(#x)`           |
| `min(a, b)`   | `(a < b ? a : b)` | `MIN(IN1:=#a, IN2:=#b)` |
| `max(a, b)`   | `(a > b ? a : b)` | `MAX(IN1:=#a, IN2:=#b)` |
| `sqrt(x)`     | `sqrt(x)`      | `SQRT(#x)`           |
| `limit(lo, x, hi)` | `(x < lo ? lo : (x > hi ? hi : x))` | `LIMIT(MN:=#lo, IN:=#x, MX:=#hi)` |

### Type Conversion Functions

| State-It          | C                | SCL                    |
|------------------|------------------|------------------------|
| `toInt(x)`       | `(int32_t)(x)`   | `DINT_TO_INT(#x)`      |
| `toReal(x)`      | `(float)(x)`     | `INT_TO_REAL(#x)`      |
| `toBool(x)`      | `(bool)(x)`      | `INT_TO_BOOL(#x)`      |

---

## Temporal Logic

Temporal operators track time or event counts relative to the moment a state
was entered. They require an internal counter that the code generator creates
automatically.

| State-It             | Description                              | Condition evaluates to |
|---------------------|------------------------------------------|------------------------|
| `after(n, tick)`    | True after n ticks since state entry     | `_tickCount >= n`      |
| `before(n, tick)`   | True before n ticks since state entry    | `_tickCount < n`       |
| `every(n, tick)`    | True every n-th tick since state entry   | `_tickCount % n == 0`  |
| `at(n, tick)`       | True at exactly tick n since state entry | `_tickCount == n`      |
| `elapsed()`         | Tick count since state entry             | `_tickCount`           |

`tick` refers to one execution cycle of the state machine step function.

### Temporal Logic Code Generation

**C:**
```c
// Generated counter variable in struct:
uint32_t _stateTickCount;

// In Init:
sm->_stateTickCount = 0;

// In Step, before transitions:
sm->_stateTickCount++;

// On state entry:
sm->_stateTickCount = 0;

// Condition: after(100, tick)
if (sm->_stateTickCount >= 100) { ... }
```

**SCL:**
```scl
// Generated counter variable:
VAR
    _stateTickCount : UDINT;
END_VAR

// In step, before transitions:
#_stateTickCount := #_stateTickCount + 1;

// On state entry:
#_stateTickCount := 0;

// Condition: after(100, tick)
IF #_stateTickCount >= 100 THEN ...
```

### Using Time Instead of Ticks

For real-time applications, use `sec` or `ms` with known cycle time:

| State-It              | Description                      |
|----------------------|----------------------------------|
| `after(5, sec)`      | True after 5 seconds             |
| `after(500, ms)`     | True after 500 milliseconds      |

These are converted to tick counts based on the configured cycle time of
the state machine (e.g., 10ms cycle → `after(5, sec)` = `after(500, tick)`).

---

## Multiple Statements

When multiple actions need to execute, separate them with semicolons:

```
x = 0; y = 0; count++
```

Each statement is translated independently. The final semicolon is optional.

---

## Complete Examples

### Motor Control

```
States:
  Stopped
    entry: motorSpeed = 0
    during: --

  Accelerating
    entry: targetSpeed = requestedSpeed
    during: motorSpeed = min(motorSpeed + rampRate, targetSpeed)

  Running
    during: motorSpeed = targetSpeed

  Decelerating
    entry: targetSpeed = 0
    during: motorSpeed = max(motorSpeed - rampRate, 0)

Transitions:
  Stopped → Accelerating:    start[requestedSpeed > 0]
  Accelerating → Running:    [motorSpeed >= targetSpeed]
  Running → Decelerating:    stop
  Decelerating → Stopped:    [motorSpeed == 0]
  Running → Accelerating:    start[requestedSpeed != motorSpeed]{targetSpeed = requestedSpeed}
```

**Generated C (transition example):**
```c
case STATE_STOPPED:
    /* During actions */

    /* Check transitions */
    if (event == SM_EVENT_START && sm->requestedSpeed > 0) {
        /* Exit Stopped */
        sm->motorSpeed = 0;
        sm->currentState = STATE_ACCELERATING;
        /* Entry Accelerating */
        sm->targetSpeed = sm->requestedSpeed;
    }
    break;
```

**Generated SCL (transition example):**
```scl
#sStopped:
    (* During actions *)

    (* Check transitions *)
    IF #xStart AND #requestedSpeed > 0 THEN
        (* Exit Stopped *)
        #motorSpeed := 0;
        #sState := #sAccelerating;
        (* Entry Accelerating *)
        #targetSpeed := #requestedSpeed;
    END_IF;
```

### Traffic Light with Temporal Logic

```
States:
  Red
    entry: redLight = true; greenLight = false; yellowLight = false

  Green
    entry: redLight = false; greenLight = true; yellowLight = false

  Yellow
    entry: redLight = false; greenLight = false; yellowLight = true

Transitions:
  Red → Green:       [after(30, sec)]
  Green → Yellow:    [after(25, sec)]
  Yellow → Red:      [after(5, sec)]
```

### Valve Control with Guards

```
States:
  Closed
    entry: valveOutput = 0
    during: position = 0

  Opening
    during: position = min(position + stepSize, 100)

  Open
    entry: valveOutput = 100
    during: position = 100

  Closing
    during: position = max(position - stepSize, 0)

Transitions:
  Closed → Opening:     cmdOpen[pressure < maxPressure && !fault]
  Opening → Open:       [position >= 100]
  Open → Closing:       cmdClose
  Open → Closing:       [pressure >= maxPressure]{fault = true}/alarmSet()
  Closing → Closed:     [position <= 0]
```

---

## Syntax vs. Target Language Mapping Summary

| Concept              | State-It        | C                    | SCL (S7-1500)            |
|---------------------|-----------------|----------------------|--------------------------|
| Variable access      | `myVar`         | `sm->myVar`          | `#myVar`                 |
| Assignment           | `x = 5`         | `sm->x = 5;`        | `#x := 5;`              |
| Equality             | `x == 5`        | `sm->x == 5`        | `#x = 5`                |
| Not equal            | `x != 5`        | `sm->x != 5`        | `#x <> 5`               |
| Logical AND          | `a && b`        | `a && b`             | `a AND b`               |
| Logical OR           | `a \|\| b`      | `a \|\| b`           | `a OR b`                |
| Logical NOT          | `!x`            | `!x`                 | `NOT x`                 |
| Modulo               | `x % 10`        | `sm->x % 10`        | `#x MOD 10`             |
| Increment            | `x++`           | `sm->x++;`           | `#x := #x + 1;`         |
| Compound assign      | `x += 5`        | `sm->x += 5;`       | `#x := #x + 5;`         |
| Boolean literal      | `true`           | `true`              | `TRUE`                   |
| Hex literal          | `0xFF`           | `0xFF`              | `16#FF`                  |
| Bit shift left       | `x << 2`        | `sm->x << 2`        | `SHL(IN:=#x, N:=2)`     |
| Function call        | `abs(x)`         | `abs(sm->x)`       | `ABS(#x)`                |
| Min/Max              | `min(a, b)`      | `(a<b?a:b)`        | `MIN(IN1:=#a, IN2:=#b)`  |
| Temporal             | `after(10, tick)` | `sm->_tc >= 10`   | `#_tc >= 10`             |
| Comment              | `// comment`     | `// comment`         | `// comment`             |

---

## Reserved Words

The following identifiers are reserved and cannot be used as variable names:

```
true, false, after, before, every, at, elapsed,
abs, min, max, sqrt, limit, toInt, toReal, toBool
```

---

## Grammar (EBNF)

```ebnf
(* Statements *)
statement       = assignment | expression ;
assignment      = identifier assignOp expression
                | identifier ( "++" | "--" ) ;
assignOp        = "=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

(* Expressions *)
expression      = logicalOr ;
logicalOr       = logicalAnd { "||" logicalAnd } ;
logicalAnd      = bitwiseOr { "&&" bitwiseOr } ;
bitwiseOr       = bitwiseXor { "|" bitwiseXor } ;
bitwiseXor      = bitwiseAnd { "^" bitwiseAnd } ;
bitwiseAnd      = equality { "&" equality } ;
equality        = comparison { ( "==" | "!=" ) comparison } ;
comparison      = shift { ( "<" | "<=" | ">" | ">=" ) shift } ;
shift           = additive { ( "<<" | ">>" ) additive } ;
additive        = multiplicative { ( "+" | "-" ) multiplicative } ;
multiplicative  = unary { ( "*" | "/" | "%" ) unary } ;
unary           = ( "!" | "~" | "-" ) unary | postfix ;
postfix         = primary ( "++" | "--" )? ;
primary         = identifier
                | number
                | boolean
                | string
                | functionCall
                | temporalExpr
                | "(" expression ")" ;

(* Function calls *)
functionCall    = identifier "(" [ argList ] ")" ;
argList         = expression { "," expression } ;

(* Temporal expressions *)
temporalExpr    = ( "after" | "before" | "every" | "at" )
                  "(" number "," timeUnit ")"
                | "elapsed" "(" ")" ;
timeUnit        = "tick" | "sec" | "ms" ;

(* Terminals *)
identifier      = letter { letter | digit | "_" } ;
number          = integer | float | hexNumber ;
integer         = digit { digit } ;
float           = digit { digit } "." digit { digit } [ "e" ["-"] digit { digit } ] ;
hexNumber       = "0x" hexDigit { hexDigit } ;
boolean         = "true" | "false" ;
string          = "'" { character } "'" ;
```

---

## Implementation Notes

### Parser Pipeline

```
User Input (State-It syntax)
    ↓
  Lexer → Token stream
    ↓
  Parser → AST (Abstract Syntax Tree)
    ↓
  Validator (type checking, variable resolution)
    ↓
  ┌─────────────┬──────────────┬──────────────┐
  ↓             ↓              ↓              ↓
C Emitter   SCL Emitter   Simulator     Syntax Hints
                           Evaluator    (autocomplete)
```

### AST Node Types

```typescript
type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'string'; value: string }
  | { type: 'identifier'; name: string }
  | { type: 'binary'; op: BinaryOp; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: UnaryOp; operand: ASTNode }
  | { type: 'assignment'; target: string; op: AssignOp; value: ASTNode }
  | { type: 'postfix'; target: string; op: '++' | '--' }
  | { type: 'call'; name: string; args: ASTNode[] }
  | { type: 'temporal'; kind: TemporalKind; count: number; unit: TimeUnit }
  | { type: 'elapsed' };
```
