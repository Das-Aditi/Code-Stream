from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.docker_runner import LANGUAGE_CONFIG, TIMEOUT_SECONDS, MEMORY_LIMIT, CPU_QUOTA
import docker
import tempfile
import os
import asyncio
import threading
import json

router = APIRouter()


@router.websocket("/ws/run")
async def websocket_run(websocket: WebSocket):
    """
    WebSocket endpoint for real-time code execution output.

    Client sends JSON: { "code": "...", "language": "python", "stdin": "" }
    Server streams back lines of stdout/stderr as they arrive.
    Final message: { "type": "done", "exit_code": 0 }
    """
    await websocket.accept()

    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=10)
        payload = json.loads(raw)
    except asyncio.TimeoutError:
        await websocket.send_text(json.dumps({"type": "error", "message": "No payload received"}))
        await websocket.close()
        return
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()
        return

    code = payload.get("code", "")
    language = payload.get("language", "python").lower()
    stdin_input = payload.get("stdin", "")

    if language not in LANGUAGE_CONFIG:
        await websocket.send_text(json.dumps({"type": "error", "message": f"Unsupported language: {language}"}))
        await websocket.close()
        return

    config = LANGUAGE_CONFIG[language]

    loop = asyncio.get_event_loop()
    output_queue = asyncio.Queue()

    def run_in_thread():
        with tempfile.TemporaryDirectory() as tmpdir:
            code_path = os.path.join(tmpdir, config["filename"])
            with open(code_path, "w") as f:
                f.write(code)

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
                    network_disabled=True,
                    read_only=True,
                    tmpfs={"/tmp": "size=64m"},
                    stream=True,
                    detach=True,
                    remove=False,
                )

                # Stream logs line by line
                for chunk in container.logs(stream=True, follow=True):
                    line = chunk.decode("utf-8", errors="replace")
                    loop.call_soon_threadsafe(
                        output_queue.put_nowait,
                        json.dumps({"type": "output", "data": line})
                    )

                result = container.wait(timeout=TIMEOUT_SECONDS)
                container.remove()

                exit_code = result.get("StatusCode", -1)
                loop.call_soon_threadsafe(
                    output_queue.put_nowait,
                    json.dumps({"type": "done", "exit_code": exit_code})
                )

            except Exception as e:
                loop.call_soon_threadsafe(
                    output_queue.put_nowait,
                    json.dumps({"type": "error", "message": str(e)})
                )

    # Run Docker in a background thread so we don't block the event loop
    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

    try:
        while True:
            message = await asyncio.wait_for(output_queue.get(), timeout=TIMEOUT_SECONDS + 2)
            await websocket.send_text(message)
            parsed = json.loads(message)
            if parsed["type"] in ("done", "error"):
                break
    except asyncio.TimeoutError:
        await websocket.send_text(json.dumps({"type": "error", "message": "Time Limit Exceeded"}))
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()