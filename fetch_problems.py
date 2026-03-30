from fastapi import APIRouter
from pydantic import BaseModel
from services.tracer import run_trace

router = APIRouter()


class TraceRequest(BaseModel):
    code: str
    language: str
    stdin: str = ""


@router.post("/trace")
def trace_code(payload: TraceRequest):
    """
    Runs user code with a step-by-step tracer injected.
    Returns list of frames: [{step, line, event, variables, stdout, func}]
    """
    result = run_trace(
        code=payload.code,
        language=payload.language,
        stdin_input=payload.stdin,
    )
    return result