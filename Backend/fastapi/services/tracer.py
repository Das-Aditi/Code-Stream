import docker
import tempfile
import os
import json

MAX_TRACE_STEPS = 200
MEMORY_LIMIT = "128m"
CPU_QUOTA = 50000

TRACER_CONFIG = {
    "python": {
        "image": "python:3.11-slim",
        "tracer_file": "tracer_runner.py",
        "run_cmd": "python /tracer/tracer_runner.py /code/solution.py",
    },
    "javascript": {
        "image": "node:18-slim",
        "tracer_file": "js_tracer_runner.js",
        "run_cmd": "node /tracer/js_tracer_runner.js /code/solution.js",
    },
}

# Path to tracer scripts on the HOST machine (same dir as this file)
SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))


def run_trace(code: str, language: str, stdin_input: str = "") -> dict:
    """
    Runs user code inside Docker with a tracer injected.
    Returns { frames, stdout, error, total_steps }
    Each frame: { step, line, event, variables, stdout, func }
    """
    language = language.lower()

    if language not in TRACER_CONFIG:
        return {
            "frames": [],
            "stdout": "",
            "error": f"Tracing not supported for language: {language}",
            "total_steps": 0,
        }

    config = TRACER_CONFIG[language]
    tracer_script_path = os.path.join(SERVICES_DIR, config["tracer_file"])

    if not os.path.exists(tracer_script_path):
        return {
            "frames": [],
            "stdout": "",
            "error": f"Tracer script not found: {tracer_script_path}",
            "total_steps": 0,
        }

    with tempfile.TemporaryDirectory() as code_dir, \
         tempfile.TemporaryDirectory() as tracer_dir:

        # Write user code
        ext = "py" if language == "python" else "js"
        code_path = os.path.join(code_dir, f"solution.{ext}")
        with open(code_path, "w") as f:
            f.write(code)

        # Write stdin if provided
        if stdin_input:
            stdin_path = os.path.join(code_dir, "input.txt")
            with open(stdin_path, "w") as f:
                f.write(stdin_input)
            run_cmd = config["run_cmd"] + " /code/input.txt"
        else:
            run_cmd = config["run_cmd"]

        # Copy tracer script to tracer_dir
        import shutil
        shutil.copy(tracer_script_path, os.path.join(tracer_dir, config["tracer_file"]))

        try:
            client = docker.from_env()

            container = client.containers.run(
                image=config["image"],
                command=run_cmd,
                volumes={
                    code_dir:   {"bind": "/code",   "mode": "ro"},
                    tracer_dir: {"bind": "/tracer",  "mode": "ro"},
                },
                mem_limit=MEMORY_LIMIT,
                cpu_quota=CPU_QUOTA,
                network_disabled=True,
                read_only=True,
                tmpfs={"/tmp": "size=32m"},
                stderr=True,
                stdout=True,
                detach=True,
                remove=False,
            )

            try:
                container.wait(timeout=10)
            except Exception:
                container.kill()
                return {
                    "frames": [],
                    "stdout": "",
                    "error": "Trace timed out — possible infinite loop",
                    "total_steps": 0,
                }

            raw_stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace").strip()
            raw_stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace").strip()
            container.remove()

            if not raw_stdout:
                return {
                    "frames": [],
                    "stdout": "",
                    "error": raw_stderr or "No output from tracer",
                    "total_steps": 0,
                }

            # Parse the JSON output from the tracer
            try:
                result = json.loads(raw_stdout)
                return result
            except json.JSONDecodeError:
                return {
                    "frames": [],
                    "stdout": raw_stdout,
                    "error": f"Tracer output parse error: {raw_stderr}",
                    "total_steps": 0,
                }

        except Exception as e:
            return {
                "frames": [],
                "stdout": "",
                "error": str(e),
                "total_steps": 0,
            }