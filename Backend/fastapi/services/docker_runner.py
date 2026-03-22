import docker
import os
import tempfile
import threading

LANGUAGE_CONFIG = {
    "python": {
        "image": "python:3.11-slim",
        "filename": "solution.py",
        "run_cmd": "python /code/solution.py",
    },
    "javascript": {
        "image": "node:18-slim",
        "filename": "solution.js",
        "run_cmd": "node /code/solution.js",
    },
    "cpp": {
        "image": "gcc:latest",
        "filename": "solution.cpp",
        "run_cmd": "bash -c 'g++ /code/solution.cpp -o /tmp/sol && /tmp/sol'",
    },
    "java": {
        "image": "openjdk:17-slim",
        "filename": "Solution.java",
        "run_cmd": "bash -c 'javac /code/Solution.java -d /tmp && java -cp /tmp Solution'",
    },
}

TIMEOUT_SECONDS = 5
MEMORY_LIMIT = "128m"
CPU_QUOTA = 50000  # 50% of one core


def run_code(code: str, language: str, stdin_input: str = "") -> dict:
    """
    Runs user code inside a sandboxed Docker container.
    Returns a dict: { stdout, stderr, exit_code, error }
    """
    language = language.lower()

    if language not in LANGUAGE_CONFIG:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "exit_code": -1,
            "error": "unsupported_language",
        }

    config = LANGUAGE_CONFIG[language]

    # Write code to a temp file on the host, mount it read-only into the container
    with tempfile.TemporaryDirectory() as tmpdir:
        code_path = os.path.join(tmpdir, config["filename"])
        with open(code_path, "w") as f:
            f.write(code)

        # Write stdin to a file if provided
        if stdin_input:
            stdin_path = os.path.join(tmpdir, "input.txt")
            with open(stdin_path, "w") as f:
                f.write(stdin_input)
            run_cmd = f"bash -c '{config['run_cmd'].strip()} < /code/input.txt'"
        else:
            run_cmd = config["run_cmd"]

        try:
            client = docker.from_env()

            container = client.containers.run(
                image=config["image"],
                command=run_cmd,
                volumes={tmpdir: {"bind": "/code", "mode": "ro"}},
                mem_limit=MEMORY_LIMIT,
                cpu_quota=CPU_QUOTA,
                network_disabled=True,       # No internet access
                read_only=True,              # Read-only filesystem
                tmpfs={"/tmp": "size=64m"},  # Writable /tmp only (for compiled binaries)
                stderr=True,
                stdout=True,
                detach=True,
                remove=False,                # We remove manually after reading logs
            )

            # Enforce timeout using a thread
            timed_out = threading.Event()

            def kill_on_timeout():
                try:
                    container.wait(timeout=TIMEOUT_SECONDS)
                except Exception:
                    timed_out.set()
                    container.kill()

            watcher = threading.Thread(target=kill_on_timeout)
            watcher.start()
            result = container.wait(timeout=TIMEOUT_SECONDS + 1)
            watcher.join()

            stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
            stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")
            container.remove()

            if timed_out.is_set():
                return {
                    "stdout": "",
                    "stderr": "Time Limit Exceeded",
                    "exit_code": -1,
                    "error": "tle",
                }

            return {
                "stdout": stdout.strip(),
                "stderr": stderr.strip(),
                "exit_code": result["StatusCode"],
                "error": None,
            }

        except docker.errors.ImageNotFound:
            return {
                "stdout": "",
                "stderr": f"Docker image not found for {language}",
                "exit_code": -1,
                "error": "image_not_found",
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "error": "runner_error",
            }