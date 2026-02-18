'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Section {
  title: string;
  content: React.ReactNode;
}

function CollapsibleSection({ title, content, defaultOpen = false }: Section & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 flex-shrink-0" />}
        {title}
      </button>
      {open && <div className="px-3 pb-3 text-[11px] leading-relaxed">{content}</div>}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">{children}</code>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-[10px] font-mono mt-1.5 mb-1">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="text-left py-0.5 px-1.5 text-muted-foreground font-medium border-b border-border/50">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-accent/30">
            {row.map((cell, j) => (
              <td key={j} className="py-0.5 px-1.5 border-b border-border/30">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HelpPanel() {
  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b">
        <h3 className="text-xs font-semibold">Expression Syntax</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Write once, translates to C and SCL
        </p>
      </div>

      <CollapsibleSection
        title="Transition Labels"
        defaultOpen={true}
        content={
          <div className="space-y-2">
            <div className="font-mono bg-muted rounded p-2 text-[10px]">
              event[condition]&#123;action&#125;/action
            </div>
            <Table
              headers={['Part', 'Example']}
              rows={[
                ['event', 'start, stop, timeout'],
                ['[condition]', '[speed > 0]'],
                ['{cond. action}', '{count = 0}'],
                ['/trans. action', '/initMotor()'],
              ]}
            />
            <p className="text-muted-foreground">All parts are optional. Examples:</p>
            <div className="font-mono bg-muted rounded p-1.5 text-[10px] space-y-0.5">
              <div>start</div>
              <div>[speed &gt; 0]</div>
              <div>start[x &gt; 0]&#123;count = 0&#125;/init()</div>
            </div>
          </div>
        }
      />

      <CollapsibleSection
        title="State Actions"
        content={
          <div className="space-y-1.5">
            <Table
              headers={['Phase', 'When']}
              rows={[
                ['entry', 'Once, on entering state'],
                ['during', 'Every cycle while in state'],
                ['exit', 'Once, on leaving state'],
              ]}
            />
            <p className="text-muted-foreground">
              Each action is a single statement. Separate multiple with <Code>;</Code>
            </p>
          </div>
        }
      />

      <CollapsibleSection
        title="Comparison Operators"
        content={
          <Table
            headers={['Syntax', 'Meaning', 'C', 'SCL']}
            rows={[
              ['==', 'Equal', '==', '='],
              ['!=', 'Not equal', '!=', '<>'],
              ['>', 'Greater', '>', '>'],
              ['<', 'Less', '<', '<'],
              ['>=', 'Greater/eq', '>=', '>='],
              ['<=', 'Less/eq', '<=', '<='],
            ]}
          />
        }
      />

      <CollapsibleSection
        title="Logical Operators"
        content={
          <Table
            headers={['Syntax', 'Meaning', 'C', 'SCL']}
            rows={[
              ['&&', 'AND', '&&', 'AND'],
              ['||', 'OR', '||', 'OR'],
              ['!', 'NOT', '!', 'NOT'],
            ]}
          />
        }
      />

      <CollapsibleSection
        title="Arithmetic & Assignment"
        content={
          <div className="space-y-2">
            <Table
              headers={['Syntax', 'C', 'SCL']}
              rows={[
                ['x = 5', 'sm->x = 5;', '#x := 5;'],
                ['x += 5', 'sm->x += 5;', '#x := #x + 5;'],
                ['x++', 'sm->x++;', '#x := #x + 1;'],
                ['x--', 'sm->x--;', '#x := #x - 1;'],
                ['x % 10', 'sm->x % 10', '#x MOD 10'],
              ]}
            />
            <p className="text-muted-foreground">
              Also: <Code>+</Code> <Code>-</Code> <Code>*</Code> <Code>/</Code> <Code>-=</Code> <Code>*=</Code> <Code>/=</Code>
            </p>
          </div>
        }
      />

      <CollapsibleSection
        title="Bitwise Operators"
        content={
          <Table
            headers={['Syntax', 'C', 'SCL']}
            rows={[
              ['x & 0xFF', 'x & 0xFF', '#x AND 16#FF'],
              ['x | 0x01', 'x | 0x01', '#x OR 16#01'],
              ['x ^ mask', 'x ^ mask', '#x XOR #mask'],
              ['~x', '~x', 'NOT #x'],
              ['x << 2', 'x << 2', 'SHL(IN:=#x, N:=2)'],
              ['x >> 2', 'x >> 2', 'SHR(IN:=#x, N:=2)'],
            ]}
          />
        }
      />

      <CollapsibleSection
        title="Built-in Functions"
        content={
          <Table
            headers={['Syntax', 'C', 'SCL']}
            rows={[
              ['abs(x)', 'abs(x)', 'ABS(#x)'],
              ['min(a, b)', '(a<b?a:b)', 'MIN(IN1:=a, IN2:=b)'],
              ['max(a, b)', '(a>b?a:b)', 'MAX(IN1:=a, IN2:=b)'],
              ['sqrt(x)', 'sqrt(x)', 'SQRT(#x)'],
              ['limit(lo,x,hi)', 'clamp', 'LIMIT(MN,IN,MX)'],
              ['toInt(x)', '(int32_t)(x)', 'TO_DINT(x)'],
              ['toReal(x)', '(float)(x)', 'TO_REAL(x)'],
            ]}
          />
        }
      />

      <CollapsibleSection
        title="Temporal Logic"
        content={
          <div className="space-y-2">
            <Table
              headers={['Syntax', 'True when...']}
              rows={[
                ['after(n, tick)', 'n ticks since state entry'],
                ['before(n, tick)', 'before n ticks'],
                ['every(n, tick)', 'every n-th tick'],
                ['at(n, tick)', 'exactly at tick n'],
                ['elapsed()', 'returns tick count'],
              ]}
            />
            <p className="text-muted-foreground">
              Use <Code>sec</Code> or <Code>ms</Code> instead of <Code>tick</Code> for real time
              (based on cycle time setting).
            </p>
            <div className="font-mono bg-muted rounded p-1.5 text-[10px] space-y-0.5">
              <div>[after(30, sec)] — red to green</div>
              <div>[after(500, ms)] — debounce</div>
            </div>
          </div>
        }
      />

      <CollapsibleSection
        title="Literals"
        content={
          <Table
            headers={['Type', 'Examples']}
            rows={[
              ['Integer', '0, 42, -7'],
              ['Hex', '0xFF, 0x01'],
              ['Float', '3.14, 1.0e3'],
              ['Boolean', 'true, false'],
              ['String', "'hello'"],
            ]}
          />
        }
      />

      <CollapsibleSection
        title="Variables"
        content={
          <div className="space-y-1.5">
            <p>
              Use variable names as defined in the <strong>Data</strong> panel.
              Generators handle prefixing automatically.
            </p>
            <Table
              headers={['You write', 'C output', 'SCL output']}
              rows={[
                ['speed', 'sm->speed', '#speed'],
                ['isRunning', 'sm->isRunning', '#isRunning'],
              ]}
            />
          </div>
        }
      />

      <CollapsibleSection
        title="Complete Examples"
        content={
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-1">Motor Control</p>
              <div className="font-mono bg-muted rounded p-1.5 text-[10px] space-y-0.5">
                <div className="text-muted-foreground">{'// Stopped → Accelerating'}</div>
                <div>start[requestedSpeed &gt; 0]</div>
                <div className="text-muted-foreground mt-1">{'// Entry action:'}</div>
                <div>targetSpeed = requestedSpeed</div>
                <div className="text-muted-foreground mt-1">{'// During action:'}</div>
                <div>speed = min(speed + ramp, target)</div>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">Traffic Light</p>
              <div className="font-mono bg-muted rounded p-1.5 text-[10px] space-y-0.5">
                <div className="text-muted-foreground">{'// Red → Green'}</div>
                <div>[after(30, sec)]</div>
                <div className="text-muted-foreground">{'// Green → Yellow'}</div>
                <div>[after(25, sec)]</div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
