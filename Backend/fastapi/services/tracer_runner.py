import sys
import json
import copy

# This script is injected INSIDE the Docker container alongside user code.
# It uses Python's bdb (built-in debugger) to trace every line executed.

MAX_STEPS = 200  # prevent infinite loops from hanging forever
MAX_STR_LEN = 100  # truncate long strings in variable display

def safe_repr(val):
    """Convert a value to a JSON-safe, human-readable representation."""
    try:
        if isinstance(val, (int, float, bool, type(None))):
            return val
        if isinstance(val, str):
            return val[:MAX_STR_LEN] + ('...' if len(val) > MAX_STR_LEN else '')
        if isinstance(val, (list, tuple)):
            result = [safe_repr(v) for v in val[:20]]
            type_name = 'list' if isinstance(val, list) else 'tuple'
            return {'__type__': type_name, 'items': result, 'length': len(val)}
        if isinstance(val, dict):
            return {
                '__type__': 'dict',
                'items': {str(k)[:30]: safe_repr(v) for k, v in list(val.items())[:20]},
                'length': len(val)
            }
        if isinstance(val, set):
            return {'__type__': 'set', 'items': [safe_repr(v) for v in list(val)[:20]], 'length': len(val)}
        return str(val)[:MAX_STR_LEN]
    except Exception:
        return '<unrepresentable>'


SKIP_VARS = {'__name__', '__doc__', '__package__', '__loader__',
             '__spec__', '__builtins__', '__file__', '__cached__', '_tracer'}


def filter_locals(local_vars):
    return {
        k: safe_repr(v)
        for k, v in local_vars.items()
        if not k.startswith('__') and k not in SKIP_VARS
        and not callable(v)
    }


class StepTracer:
    def __init__(self, user_filename):
        self.frames = []
        self.step_count = 0
        self.stdout_buffer = []
        self.user_filename = user_filename
        self._original_write = sys.stdout.write

    def trace_calls(self, frame, event, arg):
        """sys.settrace callback — called on every line/call/return."""
        filename = frame.f_code.co_filename

        # Only trace the user's code, not injected files or stdlib
        if self.user_filename not in filename:
            return self.trace_calls

        if self.step_count >= MAX_STEPS:
            return None

        if event in ('line', 'call', 'return'):
            local_vars = filter_locals(dict(frame.f_locals))
            stdout_so_far = ''.join(self.stdout_buffer)

            frame_data = {
                'step': self.step_count,
                'line': frame.f_lineno,
                'event': event,
                'variables': local_vars,
                'stdout': stdout_so_far,
                'func': frame.f_code.co_name,
            }

            if event == 'return':
                frame_data['return_value'] = safe_repr(arg)

            self.frames.append(frame_data)
            self.step_count += 1

        return self.trace_calls

    def capture_stdout(self, text):
        self.stdout_buffer.append(text)
        self._original_write(text)


def run_trace(code: str, stdin_input: str = '') -> dict:
    import io

    tracer = StepTracer(user_filename='<user_code>')

    # Intercept stdout
    captured_stdout = io.StringIO()

    class TracingWriter:
        def write(self, text):
            tracer.stdout_buffer.append(text)
            captured_stdout.write(text)
        def flush(self): pass

    sys.stdout = TracingWriter()

    # Provide stdin if needed
    if stdin_input:
        sys.stdin = io.StringIO(stdin_input)

    error = None
    try:
        code_obj = compile(code, '<user_code>', 'exec')
        sys.settrace(tracer.trace_calls)
        exec(code_obj, {})
    except StopIteration:
        pass  # hit MAX_STEPS
    except Exception as e:
        error = f'{type(e).__name__}: {e}'
    finally:
        sys.settrace(None)
        sys.stdout = sys.__stdout__

    return {
        'frames': tracer.frames,
        'stdout': ''.join(tracer.stdout_buffer),
        'error': error,
        'total_steps': len(tracer.frames),
    }


if __name__ == '__main__':
    # Entry point when called from Docker
    # Usage: python tracer_runner.py <code_file> <stdin_file>
    import sys

    code_file = sys.argv[1] if len(sys.argv) > 1 else '/code/solution.py'
    stdin_file = sys.argv[2] if len(sys.argv) > 2 else None

    with open(code_file, 'r') as f:
        code = f.read()

    stdin_input = ''
    if stdin_file:
        try:
            with open(stdin_file, 'r') as f:
                stdin_input = f.read()
        except FileNotFoundError:
            pass

    result = run_trace(code, stdin_input)
    # Output as JSON to stdout so the host can read it
    print(json.dumps(result))