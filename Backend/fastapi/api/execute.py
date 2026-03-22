from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import problem_collection
from services.evaluator import evaluate_submission
from bson import ObjectId

router = APIRouter()


class SubmissionRequest(BaseModel):
    problem_id: str
    language: str
    code: str


class RunRequest(BaseModel):
    """For running code freely without test cases (like a scratch pad)."""
    language: str
    code: str
    stdin: str = ""


@router.post("/submit")
def submit_solution(payload: SubmissionRequest):
    """
    Submit a solution against all stored test cases for a problem.
    Returns full verdict: Accepted / Wrong Answer / Runtime Error / TLE
    """
    # Fetch problem + its test cases from MongoDB
    try:
        oid = ObjectId(payload.problem_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid problem_id format")

    problem = problem_collection.find_one({"_id": oid})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = problem.get("test_cases", [])
    if not test_cases:
        raise HTTPException(status_code=400, detail="Problem has no test cases defined")

    result = evaluate_submission(
        code=payload.code,
        language=payload.language,
        test_cases=test_cases,
    )

    return {
        "problem_id": payload.problem_id,
        "language": payload.language,
        **result,
    }


@router.post("/run")
def run_code_freely(payload: RunRequest):
    """
    Run arbitrary code without evaluating against test cases.
    Useful for the frontend 'Run' button before submitting.
    """
    from services.docker_runner import run_code

    result = run_code(
        code=payload.code,
        language=payload.language,
        stdin_input=payload.stdin,
    )

    return {
        "stdout": result["stdout"],
        "stderr": result["stderr"],
        "exit_code": result["exit_code"],
        "error": result["error"],
    }